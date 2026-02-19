import { useNavigate } from 'react-router-dom';
import type {
  LoreCraftReport,
  LawStrength,
  TensionSeverity,
  ChecklistPriority,
} from '../types/lorecraft';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <span className="rating-stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? 'star star--filled' : 'star star--empty'}>
          ✦
        </span>
      ))}
    </span>
  );
}

function StrengthBadge({ strength }: { strength: LawStrength }) {
  const cls =
    strength === 'Strong' ? 'strength-badge--strong'
    : strength === 'Moderate' ? 'strength-badge--moderate'
    : 'strength-badge--fragile';
  return <span className={`strength-badge ${cls}`}>{strength}</span>;
}

function SeverityBadge({ severity }: { severity: TensionSeverity }) {
  const cls =
    severity === 'High' ? 'severity-badge--high'
    : severity === 'Medium' ? 'severity-badge--medium'
    : 'severity-badge--low';
  return <span className={`severity-badge ${cls}`}>{severity}</span>;
}

function PriorityDot({ priority }: { priority: ChecklistPriority }) {
  const cls =
    priority === 'high' ? 'priority-dot--high'
    : priority === 'medium' ? 'priority-dot--medium'
    : 'priority-dot--low';
  return <span className={`priority-dot ${cls}`} title={`${priority} priority`} />;
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  report: LoreCraftReport;
  onClear: () => void;
}

export default function ReportView({ report, onClear }: Props) {
  const navigate = useNavigate();

  function handleCheckWorld() {
    const summary = [
      `## From LoreCraft — ${report.worldSummary.name}`,
      `**World Type:** ${report.worldSummary.worldType}`,
      `**Tags:** ${report.worldSummary.tags.join(', ')}`,
      ``,
      `### Overview`,
      report.overview,
      ``,
      `### Key Tensions`,
      ...report.tensions.map(t => `- **${t.name}** (${t.severity}): ${t.issue}`),
    ].join('\n');
    navigate('/lorecheck', { state: { prefill: { worldText: summary } } });
  }

  return (
    <section className="report-root animate-fade-up">

      {/* ── Summary banner ─────────────────────────────────────────────── */}
      <div className="report-banner">
        <div className="report-banner__left">
          <h2 className="report-banner__name">{report.worldSummary.name}</h2>
          <p className="report-banner__type">{report.worldSummary.worldType}</p>
          <div className="report-banner__tags">
            {report.worldSummary.tags.map(tag => (
              <span key={tag} className="badge badge-violet">{tag}</span>
            ))}
          </div>
        </div>
        <div className="report-banner__right">
          <div className="nutrients-consumed">
            <span className="nutrients-consumed__icon">✦</span>
            <span className="nutrients-consumed__value">{report.worldSummary.nutrientsConsumed}</span>
            <span className="nutrients-consumed__label">Nutrients consumed</span>
          </div>
          <div className="report-actions-top">
            <button className="btn btn-gold btn-sm" onClick={handleCheckWorld}>
              📜 Check this world
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onClear}>
              ✕ Clear
            </button>
          </div>
        </div>
      </div>

      {/* ── World Overview ─────────────────────────────────────────────── */}
      <div className="report-card">
        <h3 className="report-section-title">World Overview</h3>
        <p className="report-prose">{report.overview}</p>
      </div>

      {/* ── Logic Assessment ───────────────────────────────────────────── */}
      <div className="report-card">
        <h3 className="report-section-title">Internal Logic Assessment</h3>
        <p className="report-prose" style={{ marginBottom: '1.25rem' }}>{report.logicAssessment.summary}</p>
        <div className="logic-columns">
          <div className="logic-col logic-col--strengths">
            <h4 className="logic-col__heading">✓ Strengths</h4>
            <ul className="logic-list">
              {report.logicAssessment.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div className="logic-col logic-col--weaknesses">
            <h4 className="logic-col__heading">⚠ Pressure Points</h4>
            <ul className="logic-list">
              {report.logicAssessment.weaknesses.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── World Laws table ───────────────────────────────────────────── */}
      <div className="report-card">
        <h3 className="report-section-title">Key World Laws</h3>
        <div className="table-scroll">
          <table className="laws-table">
            <thead>
              <tr>
                <th>Law</th>
                <th style={{ width: '110px' }}>Strength</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {report.worldLaws.map((law, i) => (
                <tr key={i}>
                  <td className="laws-table__law">{law.law}</td>
                  <td><StrengthBadge strength={law.strength} /></td>
                  <td className="laws-table__note">{law.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Tensions ───────────────────────────────────────────────────── */}
      <div className="report-card">
        <h3 className="report-section-title">Potential Tensions & Paradoxes</h3>
        <div className="tensions-list">
          {report.tensions.map((t, i) => (
            <div key={i} className="tension-item">
              <div className="tension-item__header">
                <span className="tension-item__name">{t.name}</span>
                <SeverityBadge severity={t.severity} />
              </div>
              <p className="tension-item__issue">{t.issue}</p>
              <div className="tension-item__resolution">
                <span className="tension-item__resolution-label">Suggested resolution</span>
                <p>{t.resolution}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Narrative Opportunities ────────────────────────────────────── */}
      <div className="report-card">
        <h3 className="report-section-title">Narrative Opportunities</h3>
        <ul className="opportunity-list">
          {report.narrativeOpportunities.map((opp, i) => (
            <li key={i} className="opportunity-item">
              <span className="opportunity-item__bullet">✦</span>
              <span>{opp}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Checklist ──────────────────────────────────────────────────── */}
      <div className="report-card">
        <h3 className="report-section-title">Worldbuilder's Checklist</h3>
        <div className="checklist">
          {report.checklist.map((item, i) => (
            <div key={i} className="checklist-item">
              <input
                type="checkbox"
                id={`check-${i}`}
                className="checklist-item__checkbox"
              />
              <label htmlFor={`check-${i}`} className="checklist-item__label">
                {item.item}
              </label>
              <PriorityDot priority={item.priority} />
            </div>
          ))}
        </div>
        <div className="checklist-legend">
          <span><span className="priority-dot priority-dot--high" /> High priority</span>
          <span><span className="priority-dot priority-dot--medium" /> Medium</span>
          <span><span className="priority-dot priority-dot--low" /> Low</span>
        </div>
      </div>

      {/* ── Verdict ────────────────────────────────────────────────────── */}
      <div className="report-card report-card--verdict">
        <div className="verdict-header">
          <span className="verdict-cat">🐱</span>
          <div>
            <h3 className="report-section-title" style={{ margin: 0 }}>LoreKit's Verdict</h3>
            <StarRating rating={report.verdict.rating} />
          </div>
        </div>
        <p className="verdict-text">{report.verdict.text}</p>
        <div className="verdict-actions">
          <button className="btn btn-gold" onClick={handleCheckWorld}>
            📜 Check this world
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              const text = [
                report.worldSummary.name,
                report.worldSummary.worldType,
                '',
                report.overview,
                '',
                ...report.worldLaws.map(l => `• ${l.law} [${l.strength}]`),
              ].join('\n');
              navigator.clipboard.writeText(text);
            }}
          >
            Copy report
          </button>
        </div>
      </div>

    </section>
  );
}
