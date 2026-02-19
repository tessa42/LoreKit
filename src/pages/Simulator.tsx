import { useState, useRef } from 'react';
import MarkdownResult from '../components/MarkdownResult';

const PRESET_WORLDS = [
  { value: '', label: 'Let fate decide…' },
  { value: 'The Forgotten Archives', label: 'The Forgotten Archives' },
  { value: 'The Neon Depths', label: 'The Neon Depths' },
  { value: 'The Emberfall Kingdom', label: 'The Emberfall Kingdom' },
  { value: 'The Drift Between Stars', label: 'The Drift Between Stars' },
  { value: 'The Verdant Labyrinth', label: 'The Verdant Labyrinth' },
];

export default function Simulator() {
  const [name, setName] = useState('');
  const [vibe, setVibe] = useState('');
  const [worldHint, setWorldHint] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [assignedWorld, setAssignedWorld] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const canSubmit = name.trim().length > 0;

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setAssignedWorld('');

    try {
      const res = await fetch('/api/simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, vibe, worldHint }),
      });
      const data = await res.json() as { result?: string; world?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      setResult(data.result ?? '');
      setAssignedWorld(data.world ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The portal has closed unexpectedly.');
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    const text = `✨ My LoreKit character card:\n\n${result}\n\nFind your world at lorekit.app`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My LoreKit Character', text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // user cancelled share
    }
  }

  return (
    <div className="page-wrapper">
      <section className="section-header animate-fade-up">
        <span className="eyebrow">✨ Simulator</span>
        <h1>Step Through the Portal</h1>
        <p>
          Enter your name and a vibe. LoreKit will summon your character card from one of the ancient worlds.
          Free, instant, and built for sharing.
        </p>
      </section>

      <div className="card animate-fade-up" style={{ animationDelay: '60ms' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group form-col-full">
              <label className="form-label" htmlFor="simName">
                Your Name <span style={{ color: 'var(--rose)' }}>*</span>
              </label>
              <input
                id="simName"
                type="text"
                className="form-input"
                placeholder="What shall we call you, wanderer?"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                maxLength={80}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="simVibe">
                Your Vibe <span className="optional">(optional)</span>
              </label>
              <p className="form-hint">Describe your essence — who you are, what draws you.</p>
              <input
                id="simVibe"
                type="text"
                className="form-input"
                placeholder="e.g. brooding scholar who collects cursed books, reluctant healer, chaos agent"
                value={vibe}
                onChange={e => setVibe(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="simWorld">
                World Preference <span className="optional">(optional)</span>
              </label>
              <p className="form-hint">Or let the portal decide.</p>
              <select
                id="simWorld"
                className="form-select"
                value={worldHint}
                onChange={e => setWorldHint(e.target.value)}
              >
                {PRESET_WORLDS.map(w => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
            </div>

            {/* Image upload — cosmetic, displayed locally */}
            <div className="form-group form-col-full">
              <label className="form-label">
                Portrait <span className="optional">(optional)</span>
              </label>
              <p className="form-hint">Add a face to your character card. Stays on your device — never sent anywhere.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Portrait preview"
                    style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-gold)' }}
                  />
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  id="portrait-upload"
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => fileRef.current?.click()}
                >
                  {imagePreview ? '🖼 Change portrait' : '🖼 Upload portrait'}
                </button>
                {imagePreview && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setImagePreview(null)}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-teal btn-lg"
              disabled={!canSubmit || loading}
            >
              {loading ? '🌀 Opening the portal…' : '✨ Summon My Card'}
            </button>
            {result && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setResult(null); setError(null); setImagePreview(null); }}>
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {loading && (
        <div className="spinner-wrap">
          <div className="spinner" />
          <span>The portal is weaving your fate…</span>
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
          <div className="char-card">
            {/* Portrait */}
            <div>
              {imagePreview ? (
                <img src={imagePreview} alt="Character portrait" className="char-card__image" />
              ) : (
                <div className="char-card__image-placeholder">🧙</div>
              )}
            </div>

            {/* World badge */}
            {assignedWorld && (
              <div style={{ marginBottom: '0.75rem' }}>
                <span className="badge badge-gold">🌍 {assignedWorld}</span>
              </div>
            )}

            <h2 className="char-card__name">{name}</h2>

            <div className="char-card__story">
              <MarkdownResult content={result} />
            </div>
          </div>

          <div className="share-banner">
            <p>Your character card has been written in the stars. Share it with your realm.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-teal" onClick={handleShare}>
                {copied ? '✅ Copied!' : '🔗 Share Card'}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setResult(null); setError(null); setImagePreview(null); setName(''); setVibe(''); setWorldHint(''); }}
              >
                Try another
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
