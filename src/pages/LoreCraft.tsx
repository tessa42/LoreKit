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
import { useLang, type TranslationKey } from '../i18n';

// Frontend worldType → API worldType
const TYPE_MAP: Record<string, string> = {
  historical: 'reality',
  fictional:  'fiction',
  hybrid:     'hybrid',
};

// ─── Static data ──────────────────────────────────────────────────────────────
// Values are kept in English (sent to backend). Display labels use t().
const GENRES = [
  'Fantasy', 'Science Fiction', 'Horror', 'Gothic / Dark Romance',
  'Thriller / Mystery', 'Historical Fiction', 'Mythology / Folk',
  'Solarpunk', 'Space Opera', 'Custom…',
] as const;

const GENRE_LABEL_KEYS: Record<typeof GENRES[number], TranslationKey> = {
  'Fantasy':              'genre_fantasy',
  'Science Fiction':      'genre_sci_fi',
  'Horror':               'genre_horror',
  'Gothic / Dark Romance': 'genre_gothic',
  'Thriller / Mystery':   'genre_thriller',
  'Historical Fiction':   'genre_historical_fiction',
  'Mythology / Folk':     'genre_mythology',
  'Solarpunk':            'genre_solarpunk',
  'Space Opera':          'genre_space_opera',
  'Custom…':              'genre_custom',
};

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

const TECH_LEVEL_KEYS: Record<typeof TECH_LEVELS[number], TranslationKey> = {
  'Pre-Industrial (before 1750s)':  'tech_pre_industrial',
  'Industrial Age (1800s)':         'tech_industrial',
  'Early Modern (1900–1950)':       'tech_early_modern',
  'Post-WWII Contemporary':         'tech_post_wwii',
  'Near Future (2025–2100)':        'tech_near_future',
  'Far Future (2100+)':             'tech_far_future',
  'Post-Apocalyptic Regression':    'tech_post_apocalyptic',
  'Custom / Mixed':                 'tech_custom_mixed',
};

const DEVIATIONS: {
  key:      DeviationType;
  labelKey: TranslationKey;
  descKey:  TranslationKey;
}[] = [
  { key: 'climate',      labelKey: 'deviation_climate_label',      descKey: 'deviation_climate_desc' },
  { key: 'supernatural', labelKey: 'deviation_supernatural_label', descKey: 'deviation_supernatural_desc' },
  { key: 'technology',   labelKey: 'deviation_technology_label',   descKey: 'deviation_technology_desc' },
  { key: 'political',    labelKey: 'deviation_political_label',    descKey: 'deviation_political_desc' },
  { key: 'social',       labelKey: 'deviation_social_label',       descKey: 'deviation_social_desc' },
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
  const { t } = useLang();
  return (
    <div className="world-fields animate-fade-in">
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="timePeriod">
            {t('lorecraft_time_period')} <span className="req">*</span>
          </label>
          <input id="timePeriod" type="text" className="form-input"
            placeholder={t('lorecraft_time_period_placeholder')}
            value={form.timePeriod} onChange={set('timePeriod')} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="location">
            {t('lorecraft_location')} <span className="req">*</span>
          </label>
          <input id="location" type="text" className="form-input"
            placeholder={t('lorecraft_location_placeholder')}
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
  const { t } = useLang();
  return (
    <div className="world-fields animate-fade-in">
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="genre">{t('lorecraft_genre')}</label>
          <select id="genre" className="form-select" value={form.genre} onChange={setSelect('genre')}>
            <option value="">{t('lorecraft_genre_select')}</option>
            {GENRES.map(g => (
              <option key={g} value={g}>{t(GENRE_LABEL_KEYS[g])}</option>
            ))}
          </select>
          {form.genre === 'Custom…' && (
            <input type="text" className="form-input" style={{ marginTop: '0.5rem' }}
              placeholder={t('lorecraft_genre_placeholder')}
              value={form.customGenre} onChange={setField('customGenre')} />
          )}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="techLevel">{t('lorecraft_tech_level')}</label>
          <select id="techLevel" className="form-select" value={form.techLevel} onChange={setSelect('techLevel')}>
            <option value="">{t('lorecraft_tech_level_select')}</option>
            {TECH_LEVELS.map(tl => (
              <option key={tl} value={tl}>{t(TECH_LEVEL_KEYS[tl])}</option>
            ))}
          </select>
        </div>
        <div className="form-group form-col-full">
          <label className="form-label" htmlFor="environmentCondition">
            {t('lorecraft_environment')}
          </label>
          <p className="form-hint">{t('lorecraft_environment_hint')}</p>
          <input id="environmentCondition" type="text" className="form-input"
            placeholder={t('lorecraft_environment_placeholder')}
            value={form.environmentCondition} onChange={setField('environmentCondition')} />
        </div>
      </div>
    </div>
  );
}

function DeviationRow({
  item, label, description, selected, level, onToggle, onLevel,
}: {
  item:        typeof DEVIATIONS[number];
  label:       string;
  description: string;
  selected:    boolean;
  level:       DeviationLevel | undefined;
  onToggle:    () => void;
  onLevel:     (l: DeviationLevel) => void;
}) {
  const { t } = useLang();
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
        <span className="deviation-name">{label}</span>
      </label>
      <span className="deviation-desc">{description}</span>
      {selected && (
        <select
          className="form-select deviation-level-select"
          value={level ?? 'minor'}
          onChange={e => onLevel(e.target.value as DeviationLevel)}
        >
          <option value="minor">{t('deviation_level_minor')}</option>
          <option value="moderate">{t('deviation_level_moderate')}</option>
          <option value="major">{t('deviation_level_major')}</option>
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
  const { t } = useLang();
  return (
    <div className="world-fields animate-fade-in">

      {/* Section A — Reality Anchor */}
      <div className="hybrid-section">
        <div className="hybrid-section__header">
          <span className="hybrid-section__label">A</span>
          <div>
            <h4 className="hybrid-section__title">{t('lorecraft_reality_anchor_title')}</h4>
            <p className="form-hint">{t('lorecraft_reality_anchor_hint')}</p>
          </div>
        </div>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="baseTimePeriod">
              {t('lorecraft_base_time_period')} <span className="req">*</span>
            </label>
            <input id="baseTimePeriod" type="text" className="form-input"
              placeholder={t('lorecraft_base_time_period_placeholder')}
              value={form.baseTimePeriod} onChange={setField('baseTimePeriod')} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="baseLocation">
              {t('lorecraft_base_location')} <span className="req">*</span>
            </label>
            <input id="baseLocation" type="text" className="form-input"
              placeholder={t('lorecraft_base_location_placeholder')}
              value={form.baseLocation} onChange={setField('baseLocation')} />
          </div>
        </div>
      </div>

      {/* Section B — Fictional Divergence */}
      <div className="hybrid-section">
        <div className="hybrid-section__header">
          <span className="hybrid-section__label">B</span>
          <div>
            <h4 className="hybrid-section__title">{t('lorecraft_fictional_divergence_title')}</h4>
            <p className="form-hint">{t('lorecraft_fictional_divergence_hint')}</p>
          </div>
        </div>
        <div className="form-group" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
          <label className="form-label" htmlFor="genreLayer">
            {t('lorecraft_genre_layer')} <span className="req">*</span>
          </label>
          <input id="genreLayer" type="text" className="form-input"
            placeholder={t('lorecraft_genre_layer_placeholder')}
            value={form.genreLayer} onChange={setField('genreLayer')} />
        </div>
        <div className="form-group">
          <p className="form-label">{t('lorecraft_allowed_deviations')}</p>
          <div className="deviations-list">
            {DEVIATIONS.map(item => (
              <DeviationRow
                key={item.key}
                item={item}
                label={t(item.labelKey)}
                description={t(item.descKey)}
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
              {t('lorecraft_motif_title')}{' '}
              <span className="optional">{t('optional')}</span>
            </h4>
            <p className="form-hint">{t('lorecraft_motif_hint')}</p>
          </div>
        </div>
        <input type="text" className="form-input" style={{ marginTop: '1rem' }}
          placeholder={t('lorecraft_motif_placeholder')}
          value={form.motif} onChange={setField('motif')} />
      </div>

    </div>
  );
}

// ─── World Type radio card ────────────────────────────────────────────────────
interface RadioCardProps {
  value:       WorldType;
  selected:    boolean;
  icon:        string;
  title:       string;
  description: string;
  onSelect:    () => void;
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
  const location    = useLocation();
  const state       = location.state as LocationState | null;
  const { lang, t } = useLang();

  const [form, setForm] = useState<LoreCraftForm>({
    ...EMPTY_FORM,
    extraContext: state?.prefill?.extraContext ?? '',
  });
  const [report,  setReport]  = useState<LoreCraftReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const setField =
    (k: keyof LoreCraftForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

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

  const effectiveGenre =
    form.genre === 'Custom…' ? form.customGenre.trim() : form.genre;

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
        headers: {
          'Content-Type':   'application/json',
          'X-LoreKit-Lang': lang,
        },
        body:    JSON.stringify({
          worldType:    TYPE_MAP[form.worldType],
          fields,
          extraContext: form.extraContext.trim() || undefined,
          lang,
        }),
      });

      const data = await res.json() as Record<string, unknown>;

      if (!res.ok) {
        setError((data['error'] as string | undefined) ?? t('err_generic'));
      } else {
        setReport(data as unknown as LoreCraftReport);
        setTimeout(() => {
          document.getElementById('lorecraft-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch {
      setError(t('err_server'));
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
        <span className="eyebrow">{t('lorecraft_eyebrow')}</span>
        <h1>{t('lorecraft_title')}</h1>
        <p>{t('lorecraft_desc')}</p>
      </section>

      {/* ── Form card ───────────────────────────────────────────────────── */}
      <div className="card animate-fade-up" style={{ animationDelay: '60ms' }}>
        <form onSubmit={handleGenerate}>

          {/* World Type radios */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <p className="form-label" style={{ marginBottom: '0.75rem' }}>
              {t('lorecraft_world_type_label')} <span className="req">*</span>
            </p>
            <div className="radio-group">
              <WorldTypeCard
                value="historical"
                selected={form.worldType === 'historical'}
                icon="🏛"
                title={t('lorecraft_historical_title')}
                description={t('lorecraft_historical_desc')}
                onSelect={() => setForm(p => ({ ...p, worldType: 'historical' }))}
              />
              <WorldTypeCard
                value="fictional"
                selected={form.worldType === 'fictional'}
                icon="🌌"
                title={t('lorecraft_fictional_title')}
                description={t('lorecraft_fictional_desc')}
                onSelect={() => setForm(p => ({ ...p, worldType: 'fictional' }))}
              />
              <WorldTypeCard
                value="hybrid"
                selected={form.worldType === 'hybrid'}
                icon="⚗️"
                title={t('lorecraft_hybrid_title')}
                description={t('lorecraft_hybrid_desc')}
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
                {t('lorecraft_extra_context')}{' '}
                <span className="optional">{t('optional')}</span>
              </label>
              <p className="form-hint">{t('lorecraft_extra_context_hint')}</p>
              <textarea
                id="extraContext"
                className="form-textarea"
                rows={4}
                placeholder={t('lorecraft_extra_context_placeholder')}
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
                {loading ? t('lorecraft_generating') : t('lorecraft_generate')}
              </button>
              <span className="nutrients-cost-label">
                <span className="nutrients-cost-label__icon">✦</span>
                {t('lorecraft_nutrients_cost', { n: NUTRIENTS_COST })}
              </span>
              {report && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleClear}>
                  {t('lorecraft_clear')}
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
          <span>{t('lorecraft_weaving')}</span>
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
