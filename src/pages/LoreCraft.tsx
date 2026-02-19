import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MarkdownResult from '../components/MarkdownResult';

interface FormState {
  worldType: string;
  realityAnchor: string;
  allowedDeviations: string;
  motif: string;
  extraContext: string;
}

interface LocationState {
  prefill?: { extraContext?: string };
}

const WORLD_TYPES = [
  'High Fantasy',
  'Science Fiction',
  'Post-Apocalyptic',
  'Urban Fantasy / Contemporary Magic',
  'Alternate History',
  'Space Opera',
  'Horror / Dark Fantasy',
  'Solarpunk / Hopepunk',
  'Mythological Reimagining',
  'Custom / Other',
];

const PLACEHOLDERS = {
  realityAnchor:
    'e.g. Physics works mostly as in our world. Biology follows natural laws. Society is structured around trade guilds, not nation-states.',
  allowedDeviations:
    'e.g. Magic exists as a measurable force drawn from emotional memory. The dead can speak but cannot act. Time flows backwards in one cursed city.',
  motif: 'e.g. cycles of renewal, the price of forbidden knowledge, memory vs. identity',
  extraContext:
    'Any additional notes, inspirations, specific questions, or details you want LoreKit to consider…',
};

export default function LoreCraft() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [form, setForm] = useState<FormState>({
    worldType: '',
    realityAnchor: '',
    allowedDeviations: '',
    motif: '',
    extraContext: state?.prefill?.extraContext ?? '',
  });
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const canSubmit = form.worldType && form.realityAnchor.trim() && form.allowedDeviations.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/lorecraft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { result?: string; error?: string; details?: string };
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      setResult(data.result ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. LoreKit\'s crystal ball has gone dark.');
    } finally {
      setLoading(false);
    }
  }

  function handleCheckWorld() {
    if (!result) return;
    // Send the result summary to LoreCheck
    const summary = `## From LoreCraft\n\n**World Type:** ${form.worldType}\n\n**Reality Anchor:**\n${form.realityAnchor}\n\n**Allowed Deviations:**\n${form.allowedDeviations}\n\n---\n\n${result.slice(0, 1200)}`;
    navigate('/lorecheck', { state: { prefill: { worldText: summary } } });
  }

  return (
    <div className="page-wrapper">
      <section className="section-header animate-fade-up">
        <span className="eyebrow">🔮 LoreCraft</span>
        <h1>Create Your World</h1>
        <p>
          Define the bones of your world — its laws, its cracks, and its soul. LoreKit will return a
          comprehensive worldbuilding report to guide your creation.
        </p>
      </section>

      <div className="card animate-fade-up" style={{ animationDelay: '60ms' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* World Type */}
            <div className="form-group form-col-full">
              <label className="form-label" htmlFor="worldType">
                World Type <span style={{ color: 'var(--rose)' }}>*</span>
              </label>
              <select
                id="worldType"
                className="form-select"
                value={form.worldType}
                onChange={set('worldType')}
                required
              >
                <option value="" disabled>Select a world archetype…</option>
                {WORLD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Reality Anchor */}
            <div className="form-group form-col-full">
              <label className="form-label" htmlFor="realityAnchor">
                Reality Anchor <span style={{ color: 'var(--rose)' }}>*</span>
              </label>
              <p className="form-hint">What rules of reality hold true in your world? What can your characters rely on?</p>
              <textarea
                id="realityAnchor"
                className="form-textarea"
                rows={4}
                placeholder={PLACEHOLDERS.realityAnchor}
                value={form.realityAnchor}
                onChange={set('realityAnchor')}
                required
              />
            </div>

            {/* Allowed Deviations */}
            <div className="form-group form-col-full">
              <label className="form-label" htmlFor="allowedDeviations">
                Allowed Deviations <span style={{ color: 'var(--rose)' }}>*</span>
              </label>
              <p className="form-hint">What breaks or bends the rules? What makes your world unique and strange?</p>
              <textarea
                id="allowedDeviations"
                className="form-textarea"
                rows={4}
                placeholder={PLACEHOLDERS.allowedDeviations}
                value={form.allowedDeviations}
                onChange={set('allowedDeviations')}
                required
              />
            </div>

            {/* Motif */}
            <div className="form-group">
              <label className="form-label" htmlFor="motif">
                Core Motif <span className="optional">(optional)</span>
              </label>
              <p className="form-hint">Recurring themes or symbols in your world.</p>
              <input
                id="motif"
                type="text"
                className="form-input"
                placeholder={PLACEHOLDERS.motif}
                value={form.motif}
                onChange={set('motif')}
              />
            </div>

            {/* Extra Context */}
            <div className="form-group">
              <label className="form-label" htmlFor="extraContext">
                Extra Context <span className="optional">(optional)</span>
              </label>
              <p className="form-hint">Any other details, inspirations, or questions.</p>
              <textarea
                id="extraContext"
                className="form-textarea"
                rows={3}
                placeholder={PLACEHOLDERS.extraContext}
                value={form.extraContext}
                onChange={set('extraContext')}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={!canSubmit || loading}
            >
              {loading ? '🐱 Consulting the ancient tomes…' : '🔮 Generate Report'}
            </button>
            {result && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setResult(null); setError(null); }}>
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {loading && (
        <div className="spinner-wrap">
          <div className="spinner" />
          <span>LoreKit is weaving the report…</span>
        </div>
      )}

      {error && !loading && (
        <div className="error-box animate-fade-in" style={{ marginTop: '1.5rem' }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {result && !loading && (
        <section className="result-section">
          <div className="result-section__header">
            <div>
              <span className="eyebrow" style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                🐱 LoreKit's Report
              </span>
              <h2 style={{ marginTop: '0.25rem' }}>Worldbuilding Verification Report</h2>
            </div>
            <div className="result-actions">
              <button className="btn btn-gold btn-sm" onClick={handleCheckWorld}>
                📜 Check this world
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigator.clipboard.writeText(result)}
              >
                Copy
              </button>
            </div>
          </div>

          <div className="card card--gold">
            <MarkdownResult content={result} />
          </div>
        </section>
      )}
    </div>
  );
}
