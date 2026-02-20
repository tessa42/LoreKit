import { useState } from 'react';
import type { LoreCraftReport, ReportSection } from '../types/lorecraft';
import { useLang } from '../i18n';

// ─── Single prose section ─────────────────────────────────────────────────────
function ProseSection({ section }: { section: ReportSection }) {
  return (
    <div className="report-card">
      <h3 className="report-section-title">{section.title}</h3>
      {section.paragraphs.map((p, i) => (
        <p key={i} className="report-prose">{p}</p>
      ))}
    </div>
  );
}

// ─── Collapsible sources / assumptions card ───────────────────────────────────
function SourcesCard({
  sources,
  notes,
}: {
  sources?: string[];
  notes?:   string[];
}) {
  const { t }   = useLang();
  const [open, setOpen] = useState(false);

  const hasSources = sources && sources.length > 0;
  const hasNotes   = notes   && notes.length   > 0;
  if (!hasSources && !hasNotes) return null;

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
          {hasSources && (
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 className="logic-col__heading">{t('report_assumptions_made')}</h4>
              <ul className="logic-list">
                {sources!.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {hasNotes && (
            <div>
              <h4 className="logic-col__heading">{t('report_uncertainty_flags')}</h4>
              <ul className="logic-list">
                {notes!.map((n, i) => <li key={i}>{n}</li>)}
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
  const { t } = useLang();

  function handleCopyReport() {
    const lines: string[] = [
      `LORECRAFT DOSSIER — ${report.title}`,
      '',
      report.overview,
    ];
    for (const section of report.sections) {
      lines.push('', `## ${section.title}`, ...section.paragraphs);
    }
    navigator.clipboard.writeText(lines.join('\n\n'));
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
            <button className="btn btn-ghost btn-sm" onClick={handleCopyReport}>
              {t('report_copy')}
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

      {/* ── Dossier Sections ───────────────────────────────────────────── */}
      {report.sections.map(section => (
        <ProseSection key={section.id} section={section} />
      ))}

      {/* ── Sources & Assumptions (collapsible) ───────────────────────── */}
      <SourcesCard
        sources={report.sourcesAndAssumptions}
        notes={report.uncertaintyNotes}
      />

    </section>
  );
}
