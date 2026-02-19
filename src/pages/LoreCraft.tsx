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

// Frontend worldType → API worldType
const TYPE_MAP: Record<string, string> = {
  historical: 'reality',
  fictional:  'fiction',
  hybrid:     'hybrid',
};

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
          <label className="form-label" htmlFor="genreLayer">Genre Layer <span className="req">*</span></label>
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
  const [report,  setReport]  = useState<LoreCraftReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

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

  // Derived genre value — 'Custom…' defers to the free-text field
  const effectiveGenre =
    form.genre === 'Custom…' ? form.customGenre.trim() : form.genre;

  // Validation mirrors backend requirements
  const canSubmit =
    form.worldType === 'historical'
      ? form.timePeriod.trim() !== '' && form.location.trim() !== ''
    : form.worldType === 'fictional'
      ? effectiveGenre !== ''
    : form.worldType === 'hybrid'
      ? form.baseTimePeriod.trim() !== '' &&
        form.baseLocation.trim()   !== '' &&
        form.genreLayer.trim()     !== ''
    : false;

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setLoading(true);
    setReport(null);
    setError(null);

    // Build type-specific fields object
    let fields: Record<string, unknown>;
    if (form.worldType === 'historical') {
      fields = { timePeriod: form.timePeriod, location: form.location };
    } else if (form.worldType === 'fictional') {
      fields = {
        genre:                effectiveGenre,
        techLevel:            form.techLevel            || undefined,
        environmentCondition: form.environmentCondition || undefined,
      };
    } else {
      fields = {
        baseTimePeriod: form.baseTimePeriod,
        baseLocation:   form.baseLocation,
        genreLayer:     form.genreLayer || undefined,
        deviations:     Object.keys(form.deviations).length > 0 ? form.deviations : undefined,
        motif:          form.motif || undefined,
      };
    }

    try {
      const res = await fetch('/api/lorecraft', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          worldType:    TYPE_MAP[form.worldType],
          fields,
          extraContext: form.extraContext.trim() || undefined,
        }),
      });

      const data = await res.json() as Record<string, unknown>;

      if (!res.ok) {
        setError((data['error'] as string | undefined) ?? 'Something went wrong. Please try again.');
      } else {
        setReport(data as unknown as LoreCraftReport);
        setTimeout(() => {
          document.getElementById('lorecraft-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
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

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && !loading && (
        <div className="card animate-fade-up" style={{ marginTop: '1.5rem', borderColor: 'var(--rose)' }}>
          <p style={{ color: 'var(--rose)', margin: 0 }}>🐱 {error}</p>
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
