import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type {
  LoreCheckForm,
  LoreCheckReport,
  TensionCategory,
  StabilityLevel,
  EyebrowRisk,
} from '../types/lorecheck';

// ─── Mock report (Victorian female detective, 1880s London) ───────────────────
const MOCK_REPORT: LoreCheckReport = {
  overallImpression:
    "Your setting has strong atmospheric bones — the fog, the social rigidity, the gaslit streets all ring true. Where the prose starts to creak is in the spaces between your protagonist and the world around her: the mechanisms by which a woman of her station moves, investigates, and is taken seriously in 1880s London need more deliberate scaffolding. None of these tensions are fatal. Most are fixable with a clause or two — the kind of small institutional detail that makes a reader nod rather than squint.",

  tensions: [
    {
      title: 'Unsanctioned Female Authority',
      category: 'culture',
      explanation:
        "An unmarried woman independently solving crimes in 1880s London would not simply be unusual — she would be actively obstructed. The police, the press, and the public would question her credibility, her sanity, and her morality simultaneously. Your narrative currently treats her investigative authority as an ambient given rather than something she had to earn or circumvent.",
      fixes: [
        "Give her a male intermediary — a retired inspector or solicitor uncle — who fronts her conclusions publicly while she does the actual intellectual work",
        "Reframe her as a 'private inquiry agent' hired exclusively by families who distrust the police, limiting her to channels where personal trust already exists",
        "Acknowledge the obstruction explicitly and make navigating institutional skepticism part of the dramatic texture of every scene",
      ],
    },
    {
      title: 'Access to Evidence and Records',
      category: 'probability',
      explanation:
        "Your protagonist reviews Metropolitan Police case files, coroner's notes, and witness depositions with a fluency that implies institutional access she has no established reason to possess. Police records in 1880 were not public documents, and a private citizen — regardless of intelligence or charm — could not simply walk in and read them.",
      fixes: [
        "Establish a sympathetic officer who leaks documents for personal reasons (unpaid debt, shared history, quiet admiration)",
        "Restrict her to what a private citizen could legitimately access: newspapers, published court transcripts, paid street informants, and the testimony of people directly involved",
        "Have her reconstruct official knowledge through human sources rather than paperwork — this is also more dramatically interesting",
      ],
    },
    {
      title: 'Twenty-Two and Already Expert',
      category: 'motivation',
      explanation:
        "Your protagonist is 22 with what reads as a seasoned investigator's skillset: reading crime scenes, navigating social networks across class lines, understanding early forensic indicators. The expertise feels assumed rather than earned. A reader will quietly ask: where did she learn this, and when?",
      fixes: [
        "Age her up to 28–32, where a decade of informal self-study and unusual experience is more plausible without changing much else",
        "Add a formative backstory that explains specific knowledge: a murdered sibling she investigated herself, years assisting a physician father, access to a relative's legal library",
        "Let her be genuinely wrong or out of her depth in early scenes — expertise built on the page feels more earned than expertise assumed from page one",
      ],
    },
    {
      title: 'Economic Independence',
      category: 'economics',
      explanation:
        "A woman of the social station implied by her education and ease across class lines would typically be financially dependent on a father, brother, or husband. How she funds her lodgings, travel, informant payments, and the leisure time to investigate is currently left implicit — and implicit in 1880s London usually means implausible.",
      fixes: [
        "Establish a specific inheritance that explains both her money and her freedom: a grandmother's direct bequest, a deceased fiancé's settlement, a small legacy from an eccentric aunt",
        "Make financial precarity a live plot element — she takes cases partly because she needs the fee, which also creates stakes",
        "Give her a secondary income (medical transcription, governess on call, indexing legal documents) that explains both the free hours and the relevant knowledge base",
      ],
    },
  ],

  stability:   'Medium',
  eyebrowRisk: 'High',

  catNote:
    "The skeleton is solid and the atmosphere is genuinely good. What you're missing is connective tissue — the small institutional and social mechanics that explain how your protagonist exists in this world rather than floating above it. Patch the access points and her authority becomes earned rather than asserted. I would start with the economic independence thread; it's the one that will quietly unravel everything else if left loose.",
};

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORY_META: Record<
  TensionCategory,
  { label: string; cssClass: string; icon: string }
> = {
  probability: { label: 'Probability',  cssClass: 'cat--probability', icon: '📊' },
  culture:     { label: 'Culture',      cssClass: 'cat--culture',     icon: '🏛' },
  motivation:  { label: 'Motivation',   cssClass: 'cat--motivation',  icon: '🧠' },
  economics:   { label: 'Economics',    cssClass: 'cat--economics',   icon: '⚖️' },
  logistics:   { label: 'Logistics',    cssClass: 'cat--logistics',   icon: '🗺' },
};

// ─── Stability meter ──────────────────────────────────────────────────────────
function StabilityMeter({
  label,
  value,
  invert = false,
}: {
  label: string;
  value: StabilityLevel | EyebrowRisk;
  invert?: boolean;
}) {
  const levels: Array<StabilityLevel> = ['Low', 'Medium', 'High'];
  const idx = levels.indexOf(value as StabilityLevel);
  // For "risk" meters, High is bad (red). For stability, High is good (green).
  const colors = invert
    ? ['#34d399', '#fbbf24', '#f87171']   // Low=green, High=red  (risk)
    : ['#f87171', '#fbbf24', '#34d399'];  // Low=red,   High=green (stability)

  return (
    <div className="lc-meter">
      <span className="lc-meter__label">{label}</span>
      <div className="lc-meter__track">
        {levels.map((lvl, i) => (
          <div
            key={lvl}
            className={`lc-meter__seg ${i <= idx ? 'lc-meter__seg--active' : ''}`}
            style={i <= idx ? { background: colors[idx] } : undefined}
          />
        ))}
      </div>
      <span
        className="lc-meter__value"
        style={{ color: colors[idx] }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Single tension card ──────────────────────────────────────────────────────
function TensionCard({
  tension,
  index,
}: {
  tension: LoreCheckReport['tensions'][number];
  index: number;
}) {
  const meta = CATEGORY_META[tension.category];

  return (
    <div className="lc-tension animate-fade-up" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="lc-tension__header">
        <span className="lc-tension__number">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className={`lc-tension__cat ${meta.cssClass}`}>
          {meta.icon} {meta.label}
        </span>
        <h3 className="lc-tension__title">{tension.title}</h3>
      </div>

      <p className="lc-tension__explanation">{tension.explanation}</p>

      <div className="lc-tension__fixes">
        <span className="lc-tension__fixes-label">Suggested fixes</span>
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

const PLACEHOLDER = `Paste your setting, plot, or synopsis here…

Example:
"Elara is 22, unmarried, and works as an independent crime investigator in 1883 London. She reads case files at Scotland Yard and consults with the coroner on forensic details. Her particular skill is reconstructing crimes from physical evidence — a method she developed after her father's unsolved murder when she was twelve. She funds her work through a small inheritance and occasional commissions from wealthy families who prefer to keep their scandals quiet."`;

export default function LoreCheck() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const initState = location.state as LocationState | null;

  const [form, setForm]         = useState<LoreCheckForm>({
    ...EMPTY_FORM,
    worldText: initState?.prefill?.worldText ?? '',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [report, setReport]     = useState<LoreCheckReport | null>(null);
  const [loading, setLoading]   = useState(false);

  const charCount  = form.worldText.trim().length;
  const canScan    = charCount >= 30;

  const setField =
    (k: keyof LoreCheckForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function handleQuickScan(e: React.FormEvent) {
    e.preventDefault();
    if (!canScan) return;
    setLoading(true);
    setReport(null);

    // Simulated latency — replace with fetch('/api/lorecheck', …) when ready
    await new Promise(r => setTimeout(r, 1000));

    setReport(MOCK_REPORT);
    setLoading(false);

    setTimeout(() => {
      document.getElementById('lc-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  function handleRefineLoreCraft() {
    if (!report) return;

    const payload = [
      '## Issues flagged by LoreCheck',
      '',
      `Stability: ${report.stability} | Reader eyebrow-raise risk: ${report.eyebrowRisk}`,
      '',
      '### Key tensions to address:',
      ...report.tensions.map(
        (t, i) =>
          `${i + 1}. **${t.title}** [${CATEGORY_META[t.category].label}] — ${t.explanation.slice(0, 120)}…`,
      ),
      '',
      '### LoreKit notes:',
      report.catNote,
    ].join('\n');

    navigate('/lorecraft', {
      state: { prefill: { extraContext: payload } },
    });
  }

  function handleClear() {
    setReport(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="page-wrapper">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <section className="section-header animate-fade-up">
        <span className="eyebrow">📜 LoreCheck</span>
        <h1>Validate Your World</h1>
        <p>
          Paste a setting, plot, or synopsis. LoreKit will surface the plausibility tensions
          your readers will feel before they can name them.
        </p>
      </section>

      {/* ── Input card ──────────────────────────────────────────────────── */}
      <div className="card animate-fade-up" style={{ animationDelay: '60ms' }}>
        <form onSubmit={handleQuickScan}>

          {/* Main textarea */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="worldText">
              Setting / Plot / Synopsis{' '}
              <span style={{ color: 'var(--rose)' }}>*</span>
            </label>
            <textarea
              id="worldText"
              className="form-textarea lc-main-textarea"
              rows={10}
              placeholder={PLACEHOLDER}
              value={form.worldText}
              onChange={setField('worldText')}
            />
            <div className="lc-char-row">
              {charCount > 0 && charCount < 30 && (
                <span className="lc-char-warn">
                  Add a bit more — LoreKit needs at least 30 characters to work with.
                </span>
              )}
              <span className="lc-char-count" style={{ marginLeft: 'auto' }}>
                {charCount.toLocaleString()} chars
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
            Advanced context{' '}
            <span className="lc-advanced-toggle__hint">
              (helps LoreKit calibrate)
            </span>
          </button>

          {/* Collapsible advanced fields */}
          <div className={`lc-advanced-fields ${showAdvanced ? 'lc-advanced-fields--open' : ''}`}>
            <div className="form-grid lc-advanced-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="timePeriod">
                  Time Period <span className="optional">(optional)</span>
                </label>
                <input
                  id="timePeriod"
                  type="text"
                  className="form-input"
                  placeholder="e.g. 1880s, Tang Dynasty, near future 2080"
                  value={form.timePeriod}
                  onChange={setField('timePeriod')}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="countryRegion">
                  Country / Region <span className="optional">(optional)</span>
                </label>
                <input
                  id="countryRegion"
                  type="text"
                  className="form-input"
                  placeholder="e.g. London, rural Appalachia, fictional Aethermoor"
                  value={form.countryRegion}
                  onChange={setField('countryRegion')}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="charAge">
                  Main Character Age Range <span className="optional">(optional)</span>
                </label>
                <input
                  id="charAge"
                  type="text"
                  className="form-input"
                  placeholder="e.g. early 20s, mid-40s, teenager"
                  value={form.characterAgeRange}
                  onChange={setField('characterAgeRange')}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="charOccupation">
                  Main Character Occupation <span className="optional">(optional)</span>
                </label>
                <input
                  id="charOccupation"
                  type="text"
                  className="form-input"
                  placeholder="e.g. private investigator, healer-monk, street archivist"
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
                {loading ? '🐱 Reading every line…' : '📜 Quick Scan'}
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-lg lc-deep-audit-btn"
                disabled
                title="Coming in a future release"
              >
                🔬 Deep Audit
                <span className="lc-coming-soon">soon</span>
              </button>
            </div>

            {report && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleClear}
              >
                Clear results
              </button>
            )}
          </div>

        </form>
      </div>

      {/* ── Loading ──────────────────────────────────────────────────────── */}
      {loading && (
        <div className="spinner-wrap">
          <div className="spinner" />
          <span>LoreKit is reading between the lines…</span>
        </div>
      )}

      {/* ── Report ───────────────────────────────────────────────────────── */}
      {report && !loading && (
        <section id="lc-report" className="lc-report animate-fade-up">

          {/* Report header */}
          <div className="lc-report__header">
            <div>
              <span className="eyebrow lc-report__eyebrow">🐱 LoreKit's Notes</span>
              <h2 className="lc-report__title">Quick Scan Results</h2>
            </div>
            <div className="lc-report__header-actions">
              <button
                className="btn btn-primary btn-sm"
                onClick={handleRefineLoreCraft}
              >
                🔮 Refine with LoreCraft
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  navigator.clipboard.writeText(
                    [
                      `LORECHECK REPORT\n`,
                      `Overall: ${report.overallImpression}\n`,
                      ...report.tensions.map(
                        (t, i) =>
                          `${i + 1}. ${t.title}\n${t.explanation}\n\nFixes:\n${t.fixes.map(f => `• ${f}`).join('\n')}`,
                      ),
                      `\nStability: ${report.stability} | Eyebrow risk: ${report.eyebrowRisk}`,
                      `\nLoreKit: ${report.catNote}`,
                    ].join('\n\n'),
                  )
                }
              >
                Copy
              </button>
            </div>
          </div>

          {/* Overall impression */}
          <div className="lc-impression">
            <span className="lc-impression__label">Overall Impression</span>
            <p className="lc-impression__text">{report.overallImpression}</p>
          </div>

          {/* Tension points */}
          <div className="lc-tensions-section">
            <p className="lc-tensions-section__heading">
              {report.tensions.length} Tension{report.tensions.length !== 1 ? 's' : ''} Found
            </p>
            {report.tensions.map((t, i) => (
              <TensionCard key={i} tension={t} index={i} />
            ))}
          </div>

          {/* Summary bar */}
          <div className="lc-summary">
            <span className="lc-summary__label">Summary</span>
            <div className="lc-summary__meters">
              <StabilityMeter label="Stability"              value={report.stability}   invert={false} />
              <StabilityMeter label="Reader eyebrow-raise risk" value={report.eyebrowRisk} invert={true}  />
            </div>
          </div>

          {/* Cat note */}
          <div className="lc-catnote">
            <span className="lc-catnote__cat">🐱</span>
            <div>
              <span className="lc-catnote__label">LoreKit's Closing Note</span>
              <p className="lc-catnote__text">{report.catNote}</p>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="lc-report__cta">
            <button className="btn btn-primary" onClick={handleRefineLoreCraft}>
              🔮 Refine with LoreCraft
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleClear}>
              Run another scan
            </button>
          </div>

        </section>
      )}
    </div>
  );
}
