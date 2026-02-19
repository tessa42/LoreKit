import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { LoreCheckForm, LoreCheckReport, RiskLevel, TensionPoint } from '../types/lorecheck';
import { useLang } from '../i18n';

// ─── Stability meter ──────────────────────────────────────────────────────────
function StabilityMeter({
  label,
  value,
  invert = false,
}: {
  label:   string;
  value:   RiskLevel;
  invert?: boolean;
}) {
  const levels: RiskLevel[] = ['low', 'medium', 'high'];
  const idx = levels.indexOf(value);
  const colors = invert
    ? ['#34d399', '#fbbf24', '#f87171']
    : ['#f87171', '#fbbf24', '#34d399'];

  const display = value.charAt(0).toUpperCase() + value.slice(1);

  return (
    <div className="lc-meter">
      <span className="lc-meter__label">{label}</span>
      <div className="lc-meter__track">
        {levels.map((_, i) => (
          <div
            key={i}
            className={`lc-meter__seg ${i <= idx ? 'lc-meter__seg--active' : ''}`}
            style={i <= idx ? { background: colors[idx] } : undefined}
          />
        ))}
      </div>
      <span className="lc-meter__value" style={{ color: colors[idx] }}>
        {display}
      </span>
    </div>
  );
}

// ─── Risk badge ───────────────────────────────────────────────────────────────
function RiskBadge({ riskLevel }: { riskLevel: RiskLevel }) {
  const cls =
    riskLevel === 'high'   ? 'severity-badge--high'
    : riskLevel === 'medium' ? 'severity-badge--medium'
    : 'severity-badge--low';
  const label = riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1) + ' Risk';
  return <span className={`severity-badge ${cls}`}>{label}</span>;
}

// ─── Single tension card ──────────────────────────────────────────────────────
function TensionCard({ tension, index }: { tension: TensionPoint; index: number }) {
  const { t } = useLang();
  return (
    <div className="lc-tension animate-fade-up" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="lc-tension__header">
        <span className="lc-tension__number">
          {String(index + 1).padStart(2, '0')}
        </span>
        <RiskBadge riskLevel={tension.riskLevel} />
        <h3 className="lc-tension__title">{tension.title}</h3>
      </div>

      <p className="lc-tension__explanation">{tension.why}</p>

      <div className="lc-tension__fixes">
        <span className="lc-tension__fixes-label">{t('lorecheck_suggested_fixes')}</span>
        <ul className="lc-tension__fix-list">
          {tension.fixes.map((fix, i) => (
            <li key={i} className="lc-tension__fix-item">
              <span className="lc-tension__fix-bullet">→</span>
              <span>{fix}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
interface LocationState {
  prefill?: { worldText?: string };
}

const EMPTY_FORM: LoreCheckForm = {
  worldText:           '',
  timePeriod:          '',
  countryRegion:       '',
  characterAgeRange:   '',
  characterOccupation: '',
};

export default function LoreCheck() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const initState   = location.state as LocationState | null;
  const { lang, t } = useLang();

  const [form, setForm] = useState<LoreCheckForm>({
    ...EMPTY_FORM,
    worldText: initState?.prefill?.worldText ?? '',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [report,  setReport]  = useState<LoreCheckReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const charCount = form.worldText.trim().length;
  const canScan   = charCount >= 30 && charCount <= 4_000;

  const setField =
    (k: keyof LoreCheckForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function handleQuickScan(e: React.FormEvent) {
    e.preventDefault();
    if (!canScan || loading) return;
    setLoading(true);
    setReport(null);
    setError(null);

    try {
      const res = await fetch('/api/lorecheck', {
        method:  'POST',
        headers: {
          'Content-Type':   'application/json',
          'X-LoreKit-Lang': lang,
        },
        body:    JSON.stringify({
          text: form.worldText.trim(),
          optionalMeta: {
            timePeriod: form.timePeriod          || undefined,
            region:     form.countryRegion        || undefined,
            ageRange:   form.characterAgeRange    || undefined,
            occupation: form.characterOccupation  || undefined,
          },
          lang,
        }),
      });

      const data = await res.json() as Record<string, unknown>;

      if (!res.ok) {
        setError((data['error'] as string | undefined) ?? t('err_generic'));
      } else {
        setReport(data as unknown as LoreCheckReport);
        setTimeout(() => {
          document.getElementById('lc-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch {
      setError(t('err_server'));
    } finally {
      setLoading(false);
    }
  }

  function handleRefineLoreCraft() {
    if (!report) return;
    const payload = [
      '## Issues flagged by LoreCheck',
      '',
      `Stability: ${report.stability} | Reader eyebrow-raise risk: ${report.eyebrowRaiseRisk}`,
      '',
      '### Key tensions to address:',
      ...report.tensionPoints.map(
        (tp, i) =>
          `${i + 1}. **${tp.title}** (${tp.riskLevel} risk) — ${tp.why.slice(0, 120)}…`,
      ),
      '',
      '### Overall impression:',
      report.overallImpression,
    ].join('\n');

    navigate('/lorecraft', { state: { prefill: { extraContext: payload } } });
  }

  function handleClear() {
    setReport(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function buildCopyText(r: LoreCheckReport): string {
    return [
      t('lorecheck_copy_title') + '\n',
      `${t('lorecheck_copy_overall')}: ${r.overallImpression}\n`,
      ...r.tensionPoints.map(
        (tp, i) =>
          `${i + 1}. ${tp.title} [${tp.riskLevel} risk]\n${tp.why}\n\n${t('lorecheck_copy_fixes')}:\n${tp.fixes.map(f => `• ${f}`).join('\n')}`,
      ),
      `\n${t('lorecheck_copy_stability')}: ${r.stability} | ${t('lorecheck_copy_eyebrow_risk')}: ${r.eyebrowRaiseRisk}`,
    ].join('\n\n');
  }

  const count = report?.tensionPoints.length ?? 0;

  return (
    <div className="page-wrapper">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <section className="section-header animate-fade-up">
        <span className="eyebrow">{t('lorecheck_eyebrow')}</span>
        <h1>{t('lorecheck_title')}</h1>
        <p>{t('lorecheck_desc')}</p>
      </section>

      {/* ── Input card ──────────────────────────────────────────────────── */}
      <div className="card animate-fade-up" style={{ animationDelay: '60ms' }}>
        <form onSubmit={handleQuickScan}>

          {/* Main textarea */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="worldText">
              {t('lorecheck_text_label')}{' '}
              <span style={{ color: 'var(--rose)' }}>*</span>
            </label>
            <textarea
              id="worldText"
              className="form-textarea lc-main-textarea"
              rows={10}
              placeholder={t('lorecheck_text_placeholder')}
              value={form.worldText}
              onChange={setField('worldText')}
            />
            <div className="lc-char-row">
              {charCount > 0 && charCount < 30 && (
                <span className="lc-char-warn">
                  {t('lorecheck_char_warn_min')}
                </span>
              )}
              {charCount > 4_000 && (
                <span className="lc-char-warn">
                  {t('lorecheck_char_warn_max')}
                </span>
              )}
              <span className="lc-char-count" style={{ marginLeft: 'auto' }}>
                {charCount.toLocaleString()} / 4 000
              </span>
            </div>
          </div>

          {/* Advanced toggle */}
          <button
            type="button"
            className="lc-advanced-toggle"
            onClick={() => setShowAdvanced(v => !v)}
            aria-expanded={showAdvanced}
          >
            <span className={`lc-advanced-toggle__chevron ${showAdvanced ? 'lc-advanced-toggle__chevron--open' : ''}`}>
              ›
            </span>
            {t('lorecheck_advanced_toggle')}{' '}
            <span className="lc-advanced-toggle__hint">
              {t('lorecheck_advanced_hint')}
            </span>
          </button>

          {/* Collapsible advanced fields */}
          <div className={`lc-advanced-fields ${showAdvanced ? 'lc-advanced-fields--open' : ''}`}>
            <div className="form-grid lc-advanced-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="timePeriod">
                  {t('lorecheck_time_period')} <span className="optional">{t('optional')}</span>
                </label>
                <input
                  id="timePeriod"
                  type="text"
                  className="form-input"
                  placeholder={t('lorecheck_time_period_placeholder')}
                  value={form.timePeriod}
                  onChange={setField('timePeriod')}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="countryRegion">
                  {t('lorecheck_region')} <span className="optional">{t('optional')}</span>
                </label>
                <input
                  id="countryRegion"
                  type="text"
                  className="form-input"
                  placeholder={t('lorecheck_region_placeholder')}
                  value={form.countryRegion}
                  onChange={setField('countryRegion')}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="charAge">
                  {t('lorecheck_age_range')} <span className="optional">{t('optional')}</span>
                </label>
                <input
                  id="charAge"
                  type="text"
                  className="form-input"
                  placeholder={t('lorecheck_age_range_placeholder')}
                  value={form.characterAgeRange}
                  onChange={setField('characterAgeRange')}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="charOccupation">
                  {t('lorecheck_occupation')} <span className="optional">{t('optional')}</span>
                </label>
                <input
                  id="charOccupation"
                  type="text"
                  className="form-input"
                  placeholder={t('lorecheck_occupation_placeholder')}
                  value={form.characterOccupation}
                  onChange={setField('characterOccupation')}
                />
              </div>
            </div>
          </div>

          {/* Action row */}
          <div className="lc-action-row">
            <div className="lc-action-row__primary">
              <button
                type="submit"
                className="btn btn-gold btn-lg"
                disabled={!canScan || loading}
              >
                {loading ? t('lorecheck_scanning') : t('lorecheck_scan')}
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-lg lc-deep-audit-btn"
                disabled
                title={t('coming_soon')}
              >
                {t('lorecheck_deep_audit')}
                <span className="lc-coming-soon">{t('coming_soon')}</span>
              </button>
            </div>

            {report && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleClear}>
                {t('lorecheck_clear_results')}
              </button>
            )}
          </div>

        </form>
      </div>

      {/* ── Loading ──────────────────────────────────────────────────────── */}
      {loading && (
        <div className="spinner-wrap">
          <div className="spinner" />
          <span>{t('lorecheck_reading')}</span>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && !loading && (
        <div className="card animate-fade-up" style={{ marginTop: '1.5rem', borderColor: 'var(--rose)' }}>
          <p style={{ color: 'var(--rose)', margin: 0 }}>🐱 {error}</p>
        </div>
      )}

      {/* ── Report ───────────────────────────────────────────────────────── */}
      {report && !loading && (
        <section id="lc-report" className="lc-report animate-fade-up">

          {/* Report header */}
          <div className="lc-report__header">
            <div>
              <span className="eyebrow lc-report__eyebrow">{t('lorecheck_notes_eyebrow')}</span>
              <h2 className="lc-report__title">{t('lorecheck_results_title')}</h2>
            </div>
            <div className="lc-report__header-actions">
              <button className="btn btn-primary btn-sm" onClick={handleRefineLoreCraft}>
                {t('lorecheck_refine')}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigator.clipboard.writeText(buildCopyText(report))}
              >
                {t('lorecheck_copy')}
              </button>
            </div>
          </div>

          {/* Overall impression */}
          <div className="lc-impression">
            <span className="lc-impression__label">{t('lorecheck_overall_impression')}</span>
            <p className="lc-impression__text">{report.overallImpression}</p>
          </div>

          {/* Tension points */}
          <div className="lc-tensions-section">
            <p className="lc-tensions-section__heading">
              {t('lorecheck_tensions_found', {
                n: String(count),
                s: count !== 1 ? 's' : '',
              })}
            </p>
            {report.tensionPoints.map((tp, i) => (
              <TensionCard key={i} tension={tp} index={i} />
            ))}
          </div>

          {/* Summary bar */}
          <div className="lc-summary">
            <span className="lc-summary__label">Summary</span>
            <div className="lc-summary__meters">
              <StabilityMeter label="Stability"                 value={report.stability}        invert={false} />
              <StabilityMeter label="Reader eyebrow-raise risk" value={report.eyebrowRaiseRisk} invert={true}  />
            </div>
          </div>

          {/* Extracted assumptions */}
          {report.extractedAssumptions.length > 0 && (
            <div className="lc-impression" style={{ marginTop: '1rem' }}>
              <span className="lc-impression__label">{t('lorecheck_assumptions_label')}</span>
              <ul className="logic-list" style={{ marginTop: '0.5rem' }}>
                {report.extractedAssumptions.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}

          {/* Clarifying questions */}
          {report.missingInfoQuestions.length > 0 && (
            <div className="lc-catnote" style={{ marginTop: '1rem' }}>
              <span className="lc-catnote__cat">💬</span>
              <div>
                <span className="lc-catnote__label">{t('lorecheck_curious_label')}</span>
                <ul className="logic-list" style={{ marginTop: '0.5rem' }}>
                  {report.missingInfoQuestions.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
              </div>
            </div>
          )}

          {/* Bottom CTA */}
          <div className="lc-report__cta">
            <button className="btn btn-primary" onClick={handleRefineLoreCraft}>
              {t('lorecheck_refine')}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleClear}>
              {t('lorecheck_run_another')}
            </button>
          </div>

        </section>
      )}
    </div>
  );
}
