import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MarkdownResult from '../components/MarkdownResult';

interface LocationState {
  prefill?: { worldText?: string };
}

export default function LoreCheck() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [worldText, setWorldText] = useState(state?.prefill?.worldText ?? '');
  const [worldName, setWorldName] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = worldText.trim().length > 30;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/lorecheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worldText, worldName }),
      });
      const data = await res.json() as { result?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      setResult(data.result ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. LoreKit\'s magnifying glass has fogged up.');
    } finally {
      setLoading(false);
    }
  }

  function handleRefineLoreCraft() {
    if (!result) return;
    const issues = `## Issues flagged by LoreCheck\n\n${result.slice(0, 1200)}`;
    navigate('/lorecraft', { state: { prefill: { extraContext: issues } } });
  }

  return (
    <div className="page-wrapper">
      <section className="section-header animate-fade-up">
        <span className="eyebrow">📜 LoreCheck</span>
        <h1>Validate Your World</h1>
        <p>
          Paste any lore excerpt, world description, or story passage. LoreKit will run a quick scan and
          surface the key plausibility tensions — no checkboxes required.
        </p>
      </section>

      <div className="card animate-fade-up" style={{ animationDelay: '60ms' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="worldName">
                World Name <span className="optional">(optional)</span>
              </label>
              <input
                id="worldName"
                type="text"
                className="form-input"
                placeholder="e.g. The Shattered Veil, Nexus Prime, Aethermoor…"
                value={worldName}
                onChange={e => setWorldName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="worldText">
                Lore / World Text <span style={{ color: 'var(--rose)' }}>*</span>
              </label>
              <p className="form-hint">
                Paste your world description, a lore document, a scene, or any worldbuilding passage you want checked.
              </p>
              <textarea
                id="worldText"
                className="form-textarea"
                rows={12}
                placeholder={`Describe your world here…

For example:
"The city of Velundra floats above the sea on a bed of compressed lightning, sustained by the Resonance — a force harnessed by the Tuner-priests who can hear the world's frequency. But in the lower districts, people born without the gift have found ways to tap into Resonance using stolen relics, causing dangerous feedback loops…"`}
                value={worldText}
                onChange={e => setWorldText(e.target.value)}
                required
              />
              {worldText.trim().length > 0 && worldText.trim().length < 30 && (
                <p className="form-hint" style={{ color: 'var(--rose)' }}>
                  Please provide a bit more text for LoreKit to work with.
                </p>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-gold btn-lg"
              disabled={!canSubmit || loading}
            >
              {loading ? '🐱 Scanning the lore…' : '📜 Run Quick Scan'}
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
          <span>LoreKit is reading every line…</span>
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
                🐱 Quick Scan Results
              </span>
              <h2 style={{ marginTop: '0.25rem' }}>
                {worldName ? `${worldName} — Consistency Report` : 'Consistency Report'}
              </h2>
            </div>
            <div className="result-actions">
              <button className="btn btn-primary btn-sm" onClick={handleRefineLoreCraft}>
                🔮 Refine with LoreCraft
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigator.clipboard.writeText(result)}
              >
                Copy
              </button>
            </div>
          </div>

          <div className="card">
            <MarkdownResult content={result} />
          </div>
        </section>
      )}
    </div>
  );
}
