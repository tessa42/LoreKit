import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import type {
  WorldType,
  DeviationType,
  DeviationLevel,
  LoreCraftForm,
  LoreCraftReport,
} from '../types/lorecraft';
import ReportView from '../components/ReportView';

// ─── Static data ──────────────────────────────────────────────────────────────
const GENRES = [
  'Fantasy', 'Science Fiction', 'Horror', 'Gothic / Dark Romance',
  'Thriller / Mystery', 'Historical Fiction', 'Mythology / Folk',
  'Solarpunk', 'Space Opera', 'Custom…',
] as const;

const TECH_LEVELS = [
  'Pre-Industrial (before 1750s)',
  'Industrial Age (1800s)',
  'Early Modern (1900–1950)',
  'Post-WWII Contemporary',
  'Near Future (2025–2100)',
  'Far Future (2100+)',
  'Post-Apocalyptic Regression',
  'Custom / Mixed',
] as const;

const DEVIATIONS: { key: DeviationType; label: string; description: string }[] = [
  { key: 'climate',      label: 'Climate',            description: 'Weather patterns, seasons, or geography differ' },
  { key: 'supernatural', label: 'Supernatural',       description: 'Magic, spirits, or forces beyond natural law exist' },
  { key: 'technology',   label: 'Technology',         description: 'Tech level diverges from the historical baseline' },
  { key: 'political',    label: 'Political Structure', description: 'Governments, power structures, or laws differ' },
  { key: 'social',       label: 'Social Norms',        description: 'Culture, class, gender roles, or values diverge' },
];

const NUTRIENTS_COST = 62;

// ─── Mock report (sample Hybrid — Victorian Gothic) ───────────────────────────
const MOCK_REPORT: LoreCraftReport = {
  worldSummary: {
    name: 'Gaslit London (Working Title)',
    worldType: 'Hybrid — Historical with Supernatural Deviation',
    tags: ['Victorian', 'Gothic Mystery', '1880s England', 'Supernatural: Major', 'Climate: Minor'],
    nutrientsConsumed: NUTRIENTS_COST,
  },
  overview:
    'A Victorian London sitting faithfully on its 1880s foundations — gas lamps, class inequality, industrial fog — with one significant fracture: the dead have begun to speak through clockwork mediums, a technology-meets-occult phenomenon that the Crown has quietly classified. The world breathes authentically until you look too closely at the shadows.',
  logicAssessment: {
    summary:
      "The world's internal logic holds well at the macro level. The historical grounding is specific enough to feel earned, and the supernatural layer is constrained (speaking, not acting), which gives it narrative teeth. The main pressure points lie in institutional response: the Crown's silence is plausible, but the Church's silence needs justification.",
    strengths: [
      'Clear, bounded supernatural rule — the dead speak but cannot act',
      'Historical specificity reduces world-building debt',
      'Class dynamics map naturally onto who has access to mediums',
    ],
    weaknesses: [
      'Church / religious institution response is under-defined',
      'Economic implications of clockwork mediums left unexplored',
      'Climate deviation currently has no narrative function',
    ],
  },
  worldLaws: [
    { law: 'Physics follows 1880s Victorian London norms', strength: 'Strong', note: 'Anchor — do not deviate without explicit justification' },
    { law: 'The dead may speak through clockwork mediums; cannot act or possess', strength: 'Strong', note: 'The core deviation. Keep the "cannot act" boundary firm.' },
    { law: 'Supernatural communication requires a licensed medium device', strength: 'Moderate', note: 'Licensing system needs societal scaffolding — who regulates?' },
    { law: 'The Crown classifies all medium transcripts as state evidence', strength: 'Moderate', note: 'Implies a surveillance apparatus — explore the implications' },
    { law: 'Climate is slightly colder and foggier than true 1880s London', strength: 'Fragile', note: 'Currently ornamental; give it a narrative function or remove it' },
  ],
  tensions: [
    {
      name: "The Church's Silence",
      issue:
        'Victorian England was deeply religious. If the dead demonstrably speak, theology is in crisis — yet your world has no visible response from the Church.',
      resolution:
        "Define a Church position: suppression (they know and deny), schism (a breakaway Spiritualist wing gains power), or ignorance (medium tech is too new). Choose one and build from it.",
      severity: 'High',
    },
    {
      name: 'Medium Accessibility & Class',
      issue:
        'Clockwork mediums cost money. The wealthy speak to their dead. The poor do not. This is dramatically rich but needs explicit acknowledgment.',
      resolution:
        'Introduce a black-market medium trade or a state Grief Bureau that offers limited access — both create immediate story hooks.',
      severity: 'Medium',
    },
    {
      name: 'Legal Identity of Testimony',
      issue:
        'If the Crown classifies medium transcripts, can a murder victim testify? The legal logic of your world is unstated.',
      resolution:
        'Establish that medium testimony is Crown property, not personal testimony — this creates a power structure and a narrative obstacle simultaneously.',
      severity: 'Medium',
    },
    {
      name: 'The Climate Deviation',
      issue:
        'A minor climate change is established but has no current function in the world or story.',
      resolution:
        'Tie it to the supernatural layer (cold spots near active mediums), or remove it to keep the world rules clean.',
      severity: 'Low',
    },
  ],
  narrativeOpportunities: [
    "A murder victim's clockwork medium is stolen before their testimony can be heard",
    'A medium forger who manufactures fake "dead voices" for grieving aristocrats',
    'A Crown investigator whose job is to erase politically dangerous transcripts',
    'The first medium trade union, led by working-class operators who hear things they should not',
    'A philosopher who argues that the dead have started to lie',
  ],
  checklist: [
    { item: "Define the Church's official position on medium technology", priority: 'high' },
    { item: 'Establish who manufactures and licenses clockwork mediums', priority: 'high' },
    { item: 'Decide whether medium testimony has legal standing', priority: 'high' },
    { item: 'Determine the class economics of medium access', priority: 'medium' },
    { item: 'Give the climate deviation a narrative function or cut it', priority: 'medium' },
    { item: 'Document what happens when a medium device malfunctions', priority: 'medium' },
    { item: 'Decide how long the dead can speak before silence', priority: 'low' },
    { item: 'Explore whether the dead retain personality or only facts', priority: 'low' },
  ],
  verdict: {
    text: "Strong bones, a few unfilled rooms. The supernatural constraint is elegantly chosen — it creates mystery without omnipotence — and the historical grounding does real work. The Church gap is your most urgent structural issue; patch it and the rest holds. The climate deviation is a loose thread I would pull. Rating adjusted for potential rather than current completeness.",
    rating: 4,
  },
};

// ─── Sub-forms ────────────────────────────────────────────────────────────────
function HistoricalFields({
  form,
  set,
}: {
  form: LoreCraftForm;
  set: (k: keyof LoreCraftForm) => (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="world-fields animate-fade-in">
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="timePeriod">
            Time Period <span className="req">*</span>
          </label>
          <input id="timePeriod" type="text" className="form-input"
            placeholder="e.g. 1880s Victorian England, Tang Dynasty China, Ancient Rome 44 BC"
            value={form.timePeriod} onChange={set('timePeriod')} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="location">
            Location <span className="req">*</span>
          </label>
          <input id="location" type="text" className="form-input"
            placeholder="e.g. London, the Silk Road, the Mediterranean basin"
            value={form.location} onChange={set('location')} />
        </div>
      </div>
    </div>
  );
}

function FictionalFields({
  form,
  setField,
  setSelect,
}: {
  form: LoreCraftForm;
  setField: (k: keyof LoreCraftForm) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  setSelect: (k: keyof LoreCraftForm) => (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <div className="world-fields animate-fade-in">
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="genre">Genre</label>
          <select id="genre" className="form-select" value={form.genre} onChange={setSelect('genre')}>
            <option value="">Select a genre…</option>
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          {form.genre === 'Custom…' && (
            <input type="text" className="form-input" style={{ marginTop: '0.5rem' }}
              placeholder="Describe your genre…"
              value={form.customGenre} onChange={setField('customGenre')} />
          )}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="techLevel">Tech Level / Era</label>
          <select id="techLevel" className="form-select" value={form.techLevel} onChange={setSelect('techLevel')}>
            <option value="">Select a tech level…</option>
            {TECH_LEVELS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group form-col-full">
          <label className="form-label" htmlFor="environmentCondition">
            Key Environment Condition
          </label>
          <p className="form-hint">What defines the physical world — terrain, sky, climate, or geography?</p>
          <input id="environmentCondition" type="text" className="form-input"
            placeholder="e.g. floating islands, endless ocean, two suns, permanent winter"
            value={form.environmentCondition} onChange={setField('environmentCondition')} />
        </div>
      </div>
    </div>
  );
}

function DeviationRow({
  item, selected, level, onToggle, onLevel,
}: {
  item: typeof DEVIATIONS[number];
  selected: boolean;
  level: DeviationLevel | undefined;
  onToggle: () => void;
  onLevel: (l: DeviationLevel) => void;
}) {
  return (
    <div className={`deviation-row ${selected ? 'deviation-row--selected' : ''}`}>
      <label className="deviation-check-label">
        <input
          type="checkbox"
          className="deviation-checkbox"
          checked={selected}
          onChange={onToggle}
        />
        <span className="deviation-check-box" />
        <span className="deviation-name">{item.label}</span>
      </label>
      <span className="deviation-desc">{item.description}</span>
      {selected && (
        <select
          className="form-select deviation-level-select"
          value={level ?? 'minor'}
          onChange={e => onLevel(e.target.value as DeviationLevel)}
        >
          <option value="minor">Minor</option>
          <option value="moderate">Moderate</option>
          <option value="major">Major</option>
        </select>
      )}
    </div>
  );
}

function HybridFields({
  form,
  setField,
  setDeviation,
  setDeviationLevel,
}: {
  form: LoreCraftForm;
  setField: (k: keyof LoreCraftForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setDeviation: (key: DeviationType, active: boolean) => void;
  setDeviationLevel: (key: DeviationType, level: DeviationLevel) => void;
}) {
  return (
    <div className="world-fields animate-fade-in">

      {/* Section A — Reality Anchor */}
      <div className="hybrid-section">
        <div className="hybrid-section__header">
          <span className="hybrid-section__label">A</span>
          <div>
            <h4 className="hybrid-section__title">Reality Anchor</h4>
            <p className="form-hint">The historical base your world grows from.</p>
          </div>
        </div>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="baseTimePeriod">Base Time Period <span className="req">*</span></label>
            <input id="baseTimePeriod" type="text" className="form-input"
              placeholder="e.g. 1880s, Song Dynasty, post-WWI Europe"
              value={form.baseTimePeriod} onChange={setField('baseTimePeriod')} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="baseLocation">Base Location <span className="req">*</span></label>
            <input id="baseLocation" type="text" className="form-input"
              placeholder="e.g. London, East Asia, the Mediterranean"
              value={form.baseLocation} onChange={setField('baseLocation')} />
          </div>
        </div>
      </div>

      {/* Section B — Fictional Divergence */}
      <div className="hybrid-section">
        <div className="hybrid-section__header">
          <span className="hybrid-section__label">B</span>
          <div>
            <h4 className="hybrid-section__title">Fictional Divergence</h4>
            <p className="form-hint">Where reality bends. Select every deviation that applies and set its scale.</p>
          </div>
        </div>
        <div className="form-group" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
          <label className="form-label" htmlFor="genreLayer">Genre Layer</label>
          <input id="genreLayer" type="text" className="form-input"
            placeholder="e.g. Gothic mystery, biopunk, cosmic horror, silkpunk"
            value={form.genreLayer} onChange={setField('genreLayer')} />
        </div>
        <div className="form-group">
          <p className="form-label">Allowed Deviations</p>
          <div className="deviations-list">
            {DEVIATIONS.map(item => (
              <DeviationRow
                key={item.key}
                item={item}
                selected={item.key in form.deviations}
                level={form.deviations[item.key]}
                onToggle={() => setDeviation(item.key, !(item.key in form.deviations))}
                onLevel={l => setDeviationLevel(item.key, l)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Section C — Motif (optional) */}
      <div className="hybrid-section hybrid-section--optional">
        <div className="hybrid-section__header">
          <span className="hybrid-section__label hybrid-section__label--opt">C</span>
          <div>
            <h4 className="hybrid-section__title">
              Motif / Inspiration <span className="optional">(optional)</span>
            </h4>
            <p className="form-hint">A recurring theme, symbol, or creative touchstone.</p>
          </div>
        </div>
        <input type="text" className="form-input" style={{ marginTop: '1rem' }}
          placeholder="e.g. the cost of forbidden knowledge, memory vs. identity, industrialisation's toll"
          value={form.motif} onChange={setField('motif')} />
      </div>

    </div>
  );
}

// ─── World Type radio card ────────────────────────────────────────────────────
interface RadioCardProps {
  value: WorldType;
  selected: boolean;
  icon: string;
  title: string;
  description: string;
  onSelect: () => void;
}
function WorldTypeCard({ value, selected, icon, title, description, onSelect }: RadioCardProps) {
  return (
    <label className={`radio-card ${selected ? 'radio-card--selected' : ''}`}>
      <input type="radio" name="worldType" value={value} checked={selected} onChange={onSelect} />
      <span className="radio-card__icon">{icon}</span>
      <span className="radio-card__title">{title}</span>
      <span className="radio-card__desc">{description}</span>
      <span className="radio-card__pip" />
    </label>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
interface LocationState {
  prefill?: { extraContext?: string };
}

const EMPTY_FORM: LoreCraftForm = {
  worldType: '',
  timePeriod: '', location: '',
  genre: '', customGenre: '', techLevel: '', environmentCondition: '',
  baseTimePeriod: '', baseLocation: '',
  genreLayer: '', deviations: {}, motif: '',
  extraContext: '',
};

export default function LoreCraft() {
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [form, setForm] = useState<LoreCraftForm>({
    ...EMPTY_FORM,
    extraContext: state?.prefill?.extraContext ?? '',
  });
  const [report, setReport] = useState<LoreCraftReport | null>(null);
  const [loading, setLoading] = useState(false);

  // Generic text/textarea setter
  const setField =
    (k: keyof LoreCraftForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

  // Select setter
  const setSelect =
    (k: keyof LoreCraftForm) =>
    (e: React.ChangeEvent<HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

  function setDeviation(key: DeviationType, active: boolean) {
    setForm(prev => {
      const next = { ...prev.deviations };
      if (active) { next[key] = 'minor'; }
      else { delete next[key]; }
      return { ...prev, deviations: next };
    });
  }

  function setDeviationLevel(key: DeviationType, level: DeviationLevel) {
    setForm(prev => ({
      ...prev,
      deviations: { ...prev.deviations, [key]: level },
    }));
  }

  // Validation per world type
  const canSubmit =
    form.worldType === 'historical'
      ? form.timePeriod.trim() !== '' && form.location.trim() !== ''
    : form.worldType === 'fictional'
      ? true // all optional for fictional
    : form.worldType === 'hybrid'
      ? form.baseTimePeriod.trim() !== '' && form.baseLocation.trim() !== ''
    : false;

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setReport(null);

    // Simulate network latency; replace with real fetch when backend is ready
    await new Promise(r => setTimeout(r, 900));

    setReport(MOCK_REPORT);
    setLoading(false);

    // Scroll to results
    setTimeout(() => {
      document.getElementById('lorecraft-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  function handleClear() {
    setReport(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="page-wrapper">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <section className="section-header animate-fade-up">
        <span className="eyebrow">🔮 LoreCraft</span>
        <h1>Create Your World</h1>
        <p>
          Define the bones of your world — its laws, its cracks, and its soul. LoreKit will
          return a structured verification report to guide your creation.
        </p>
      </section>

      {/* ── Form card ───────────────────────────────────────────────────── */}
      <div className="card animate-fade-up" style={{ animationDelay: '60ms' }}>
        <form onSubmit={handleGenerate}>

          {/* World Type radios */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <p className="form-label" style={{ marginBottom: '0.75rem' }}>
              World Type <span className="req">*</span>
            </p>
            <div className="radio-group">
              <WorldTypeCard
                value="historical"
                selected={form.worldType === 'historical'}
                icon="🏛"
                title="Historical Reality"
                description="A real time period and place, faithful to history."
                onSelect={() => setForm(p => ({ ...p, worldType: 'historical' }))}
              />
              <WorldTypeCard
                value="fictional"
                selected={form.worldType === 'fictional'}
                icon="🌌"
                title="Fictional World"
                description="A fully invented world with its own rules and geography."
                onSelect={() => setForm(p => ({ ...p, worldType: 'fictional' }))}
              />
              <WorldTypeCard
                value="hybrid"
                selected={form.worldType === 'hybrid'}
                icon="⚗️"
                title="Hybrid"
                description="Real history as a foundation with fictional deviations layered on top."
                onSelect={() => setForm(p => ({ ...p, worldType: 'hybrid' }))}
              />
            </div>
          </div>

          {/* Conditional fields */}
          {form.worldType === 'historical' && (
            <HistoricalFields form={form} set={setField as any} />
          )}
          {form.worldType === 'fictional' && (
            <FictionalFields form={form} setField={setField as any} setSelect={setSelect} />
          )}
          {form.worldType === 'hybrid' && (
            <HybridFields
              form={form}
              setField={setField}
              setDeviation={setDeviation}
              setDeviationLevel={setDeviationLevel}
            />
          )}

          {/* Extra context */}
          {form.worldType !== '' && (
            <div className="form-group" style={{ marginTop: '1.25rem' }}>
              <label className="form-label" htmlFor="extraContext">
                Additional Context <span className="optional">(optional)</span>
              </label>
              <p className="form-hint">
                Paste an excerpt, note specific questions, or add anything else you want LoreKit to consider.
              </p>
              <textarea
                id="extraContext"
                className="form-textarea"
                rows={4}
                placeholder="Extra notes, story excerpt, or specific questions for LoreKit…"
                value={form.extraContext}
                onChange={setField('extraContext')}
              />
            </div>
          )}

          {/* Submit row */}
          {form.worldType !== '' && (
            <div className="form-actions" style={{ marginTop: '1.5rem' }}>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={!canSubmit || loading}
              >
                {loading ? '🐱 Consulting the ancient tomes…' : '🔮 Generate Deep Report'}
              </button>
              <span className="nutrients-cost-label">
                <span className="nutrients-cost-label__icon">✦</span>
                ~{NUTRIENTS_COST} Nutrients
              </span>
              {report && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleClear}>
                  Clear
                </button>
              )}
            </div>
          )}

        </form>
      </div>

      {/* ── Loading ──────────────────────────────────────────────────────── */}
      {loading && (
        <div className="spinner-wrap">
          <div className="spinner" />
          <span>LoreKit is weaving the report…</span>
        </div>
      )}

      {/* ── Report ───────────────────────────────────────────────────────── */}
      {report && !loading && (
        <div id="lorecraft-report" style={{ marginTop: '2.5rem' }}>
          <ReportView report={report} onClear={handleClear} />
        </div>
      )}

    </div>
  );
}
