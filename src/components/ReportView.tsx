import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LoreCraftReport, ReportSection } from '../types/lorecraft';
import { useLang } from '../i18n';

// ─── Badge helpers ────────────────────────────────────────────────────────────
function StrengthBadge({ value }: { value: string }) {
  const v = value.trim();
  const cls =
    v === 'Strong'   ? 'strength-badge--strong'
    : v === 'Moderate' ? 'strength-badge--moderate'
    : 'strength-badge--fragile';
  return <span className={`strength-badge ${cls}`}>{v}</span>;
}

function SeverityBadge({ value }: { value: string }) {
  const lower = value.trim().toLowerCase();
  const cls =
    lower === 'high'   ? 'severity-badge--high'
    : lower === 'medium' ? 'severity-badge--medium'
    : 'severity-badge--low';
  return <span className={`severity-badge ${cls}`}>{value}</span>;
}

// ─── Internal Logic — two-column strengths / fragilities ──────────────────────
function LogicSection({ section }: { section: ReportSection }) {
  const { t }       = useLang();
  const bullets     = section.bullets ?? [];
  const strengths   = bullets.filter(b => /^strength/i.test(b));
  const fragilities = bullets.filter(b => /^fragil/i.test(b));
  const rest        = bullets.filter(b => !/^(strength|fragil)/i.test(b));

  return (
    <div className="report-card">
      <h3 className="report-section-title">{section.title}</h3>
      {section.paragraphs.map((p, i) => (
        <p key={i} className="report-prose" style={{ marginBottom: '1rem' }}>{p}</p>
      ))}
      {(strengths.length > 0 || fragilities.length > 0) && (
        <div className="logic-columns">
          {strengths.length > 0 && (
            <div className="logic-col logic-col--strengths">
              <h4 className="logic-col__heading">{t('report_strengths')}</h4>
              <ul className="logic-list">
                {strengths.map((b, i) => (
                  <li key={i}>{b.replace(/^Strength:\s*/i, '')}</li>
                ))}
              </ul>
            </div>
          )}
          {fragilities.length > 0 && (
            <div className="logic-col logic-col--weaknesses">
              <h4 className="logic-col__heading">{t('report_pressure_points')}</h4>
              <ul className="logic-list">
                {fragilities.map((b, i) => (
                  <li key={i}>{b.replace(/^Fragility:\s*/i, '')}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {rest.length > 0 && (
        <ul className="logic-list" style={{ marginTop: '0.75rem' }}>
          {rest.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      )}
    </div>
  );
}

// ─── Table section (World Laws, Tensions) ────────────────────────────────────
function TableSection({ section }: { section: ReportSection }) {
  if (!section.table) return null;
  const { headers, rows } = section.table;

  return (
    <div className="report-card">
      <h3 className="report-section-title">{section.title}</h3>
      <div className="table-scroll">
        <table className="laws-table">
          <thead>
            <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => {
                  const h = headers[j]?.toLowerCase() ?? '';
                  if (h === 'strength') return <td key={j}><StrengthBadge value={cell} /></td>;
                  if (h === 'severity') return <td key={j}><SeverityBadge value={cell} /></td>;
                  return (
                    <td
                      key={j}
                      className={j === 0 ? 'laws-table__law' : 'laws-table__note'}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Narrative hooks — ✦ bulleted list ───────────────────────────────────────
function HooksSection({ section }: { section: ReportSection }) {
  return (
    <div className="report-card">
      <h3 className="report-section-title">{section.title}</h3>
      <ul className="opportunity-list">
        {(section.bullets ?? []).map((b, i) => (
          <li key={i} className="opportunity-item">
            <span className="opportunity-item__bullet">✦</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Checklist — interactive checkboxes ───────────────────────────────────────
function ChecklistSection({ section }: { section: ReportSection }) {
  const items = section.bullets ?? [];
  const [checked, setChecked] = useState(() => items.map(() => false));

  function toggle(i: number) {
    setChecked(prev => prev.map((v, j) => (j === i ? !v : v)));
  }

  return (
    <div className="report-card">
      <h3 className="report-section-title">{section.title}</h3>
      <div className="checklist">
        {items.map((item, i) => (
          <div key={i} className="checklist-item">
            <input
              type="checkbox"
              id={`chk-${i}`}
              className="checklist-item__checkbox"
              checked={checked[i]}
              onChange={() => toggle(i)}
            />
            <label htmlFor={`chk-${i}`} className="checklist-item__label">
              {item.replace(/^\[?\s*x?\s*\]?\s*/i, '')}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Verdict — cat header + rating line detection ────────────────────────────
function VerdictSection({
  section,
  onCheckWorld,
  onCopyReport,
}: {
  section:      ReportSection;
  onCheckWorld: () => void;
  onCopyReport: () => void;
}) {
  const { t } = useLang();
  return (
    <div className="report-card report-card--verdict">
      <div className="verdict-header">
        <img src="/cat-mascot.svg" className="verdict-cat" alt="" aria-hidden="true" />
        <h3 className="report-section-title" style={{ margin: 0 }}>
          {section.title}
        </h3>
      </div>

      {section.paragraphs.map((p, i) => {
        const isRating = /^[✦☆★]/.test(p.trim());
        return (
          <p
            key={i}
            className="verdict-text"
            style={
              isRating
                ? { color: 'var(--gold)', fontFamily: 'var(--font-display)', marginTop: '0.75rem' }
                : undefined
            }
          >
            {p}
          </p>
        );
      })}

      <div className="verdict-actions">
        <button className="btn btn-gold" onClick={onCheckWorld}>
          {t('report_check_world')}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onCopyReport}>
          {t('report_copy')}
        </button>
      </div>
    </div>
  );
}

// ─── Assumptions / flags / next checks — collapsible ─────────────────────────
function MetadataCard({
  assumptions,
  uncertaintyFlags,
  suggestedNextChecks,
}: {
  assumptions:         string[];
  uncertaintyFlags:    string[];
  suggestedNextChecks: string[];
}) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <div className="report-card">
      <button
        type="button"
        className="lc-advanced-toggle"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <span className={`lc-advanced-toggle__chevron ${open ? 'lc-advanced-toggle__chevron--open' : ''}`}>
          ›
        </span>
        {t('report_assumptions_toggle')}
        <span className="lc-advanced-toggle__hint">{t('report_assumptions_hint')}</span>
      </button>

      {open && (
        <div style={{ marginTop: '1.25rem' }}>
          {assumptions.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 className="logic-col__heading">{t('report_assumptions_made')}</h4>
              <ul className="logic-list">
                {assumptions.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
          {uncertaintyFlags.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 className="logic-col__heading">{t('report_uncertainty_flags')}</h4>
              <ul className="logic-list">
                {uncertaintyFlags.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}
          {suggestedNextChecks.length > 0 && (
            <div>
              <h4 className="logic-col__heading">{t('report_suggested_checks')}</h4>
              <ul className="opportunity-list">
                {suggestedNextChecks.map((s, i) => (
                  <li key={i} className="opportunity-item">
                    <span className="opportunity-item__bullet">→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  report:  LoreCraftReport;
  onClear: () => void;
}

export default function ReportView({ report, onClear }: Props) {
  const navigate  = useNavigate();
  const { t }     = useLang();

  const byId = (id: string) => report.sections.find(s => s.id === id);

  const logicSection     = byId('internal-logic');
  const lawsSection      = byId('world-laws');
  const tensionsSection  = byId('tensions');
  const hooksSection     = byId('narrative-hooks');
  const checklistSection = byId('checklist');
  const verdictSection   = byId('verdict');

  const hasMetadata =
    report.assumptions.length > 0 ||
    report.uncertaintyFlags.length > 0 ||
    report.suggestedNextChecks.length > 0;

  function handleCheckWorld() {
    const rows = tensionsSection?.table?.rows ?? [];
    const summary = [
      `## From LoreCraft — ${report.title}`,
      '',
      report.overview.slice(0, 400) + (report.overview.length > 400 ? '…' : ''),
      ...(rows.length > 0
        ? ['', '### Key Tensions', ...rows.map(r => `- **${r[0]}** (${r[1]}): ${r[2]}`)]
        : []),
    ].join('\n');
    navigate('/lorecheck', { state: { prefill: { worldText: summary } } });
  }

  function handleCopyReport() {
    const lines = [
      `LORECRAFT REPORT — ${report.title}`,
      '',
      report.overview,
      '',
      ...(lawsSection?.table?.rows.map(r => `• ${r[0]} [${r[1]}]`) ?? []),
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(lines);
  }

  return (
    <section className="report-root animate-fade-up">

      {/* ── Banner ────────────────────────────────────────────────────── */}
      <div className="report-banner">
        <div className="report-banner__left">
          <h2 className="report-banner__name">{report.title}</h2>
        </div>
        <div className="report-banner__right">
          <div className="report-actions-top">
            <button className="btn btn-gold btn-sm" onClick={handleCheckWorld}>
              {t('report_check_world')}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onClear}>
              {t('report_clear')}
            </button>
          </div>
        </div>
      </div>

      {/* ── World Overview ─────────────────────────────────────────────── */}
      <div className="report-card">
        <h3 className="report-section-title">{t('report_world_overview')}</h3>
        <p className="report-prose">{report.overview}</p>
      </div>

      {/* ── Dynamic sections ───────────────────────────────────────────── */}
      {logicSection    && <LogicSection     section={logicSection} />}
      {lawsSection     && <TableSection     section={lawsSection} />}
      {tensionsSection && <TableSection     section={tensionsSection} />}
      {hooksSection    && <HooksSection     section={hooksSection} />}
      {checklistSection && <ChecklistSection section={checklistSection} />}

      {/* ── Verdict ────────────────────────────────────────────────────── */}
      {verdictSection && (
        <VerdictSection
          section={verdictSection}
          onCheckWorld={handleCheckWorld}
          onCopyReport={handleCopyReport}
        />
      )}

      {/* ── Metadata (collapsible) ─────────────────────────────────────── */}
      {hasMetadata && (
        <MetadataCard
          assumptions={report.assumptions}
          uncertaintyFlags={report.uncertaintyFlags}
          suggestedNextChecks={report.suggestedNextChecks}
        />
      )}

    </section>
  );
}
