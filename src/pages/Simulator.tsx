import { useState, useRef } from 'react';
import type { SimulatorCard, SimulatorForm, VibeType, PresetWorld } from '../types/simulator';

// ─── Preset worlds ────────────────────────────────────────────────────────────
const WORLDS: Record<string, PresetWorld> = {
  archives: { id: 'archives', name: 'The Forgotten Archives', emoji: '📚', tagline: 'Where memory becomes glass' },
  neon:     { id: 'neon',     name: 'The Neon Depths',        emoji: '⚡', tagline: 'Light that breathes underwater' },
  ember:    { id: 'ember',    name: 'The Emberfall Kingdom',  emoji: '🔥', tagline: 'A warmth that refuses to die' },
  drift:    { id: 'drift',    name: 'The Drift Between Stars', emoji: '✦',  tagline: 'Destination is a direction' },
  verdant:  { id: 'verdant',  name: 'The Verdant Labyrinth',  emoji: '🌿', tagline: 'The roots remember everything' },
};

// ─── Mock cards per vibe ──────────────────────────────────────────────────────
const MOCK_CARDS: Record<VibeType | 'default', Omit<SimulatorCard, 'name' | 'vibe'>> = {
  dark: {
    world:         WORLDS.archives,
    roleArchetype: 'The Hollow Archivist',
    storyHook: [
      'In the stacks of the Forgotten Archives — where memory crystallises into glass and can be shattered by the wrong voice — you arrived with nothing but a name carved into your palm.',
      'Your own.',
      'The librarians call your kind Hollows: those who surrendered their past for the ability to read the memories locked inside objects, documents, and bones.',
      'You do not remember why you made the trade. That knowledge was the price.',
      'Last week, a sealed wing reopened — one locked before the Archives were founded. The catalogue lists a file under your name, dated forty years from now.',
    ],
    fateQuote: 'She will remember what the world chose to forget — and it will cost her everything she has left.',
  },

  cozy: {
    world:         WORLDS.verdant,
    roleArchetype: 'The Root-Speaker',
    storyHook: [
      'The Verdant Labyrinth does not let most people in. It pulled you through a gap in a hedgerow on a Tuesday afternoon when you were simply trying to find your way back to the road.',
      'Plants have been talking to you since you were small — you thought it was imagination, or loneliness, or too many hours reading in gardens.',
      'Here, it is simply called a gift.',
      'The Labyrinth has been waiting for someone who could hear its roots asking for help. There is a sickness moving through the deep bark, slow and quiet, and the great trees have chosen you as their interpreter.',
      'There is a cottage. There is always tea. The Labyrinth takes care of its own.',
    ],
    fateQuote: 'The roots chose well — and they are patient enough to help her find her footing.',
  },

  tragic: {
    world:         WORLDS.ember,
    roleArchetype: 'The Last Ember-Keeper',
    storyHook: [
      'The Emberfall Kingdom once held a thousand Ember-Keepers — tenders of the sacred fires that kept the long winter at bay.',
      'There is one left now.',
      'You.',
      'You did not ask to survive. You were simply the one standing farthest from the door when the cold came in.',
      'The last flame burns in a lantern you carry everywhere, because to set it down is to let the dark inherit everything your order died to protect.',
      'Someone is hunting the light. And you are the only thing left between them and permanent winter.',
    ],
    fateQuote: 'She will keep the flame until her hands cannot hold it — and then she will find a way to carry it further still.',
  },

  whimsical: {
    world:         WORLDS.neon,
    roleArchetype: 'The Lucky Paradox',
    storyHook: [
      'The Neon Depths exist only when the light hits the water at exactly the wrong angle, which means they exist at least seventeen times a day.',
      'You fell in on a Tuesday, which is statistically the most common day for accidents involving places that should not exist.',
      'The inhabitants — fish who speak only in questions, architects of temporary buildings, a postmaster who delivers messages backwards through time — have decided you are the Paradox their prophecy mentioned.',
      'The prophecy is seventeen pages long, written by someone who was clearly guessing, and refers to the Paradox as someone who "arrives confused and leaves having caused at least one small miracle."',
      'You have no idea what miracle you are supposed to cause. Neither does anyone else. This seems fine to everyone except you.',
    ],
    fateQuote: 'The Paradox will solve nothing and fix everything — probably by accident, definitely by Thursday.',
  },

  default: {
    world:         WORLDS.drift,
    roleArchetype: 'The Unnamed Navigator',
    storyHook: [
      'The Drift Between Stars is not a place you travel to. It is a place that finds you when you have been moving long enough that home has become a direction rather than a destination.',
      'You arrived the way most do: suddenly, with the distinct feeling that you had been heading here your entire life without knowing it.',
      'The ship was waiting. The log shows a name in the captain\'s chair — yours — dated three years from now.',
      'The crew has not asked questions. They seem to know you already, or know who you will become, which may be the same thing.',
      'The Drift navigates by the stories people carry. Yours, it turns out, is bright enough to steer by.',
    ],
    fateQuote: 'Some are born knowing their destination. She was born knowing how to move — the rest is just details.',
  },
};

// ─── Vibe config ──────────────────────────────────────────────────────────────
const VIBES: Array<{ key: VibeType; label: string; icon: string; hint: string }> = [
  { key: 'dark',      label: 'Dark',      icon: '🌑', hint: 'Shadow, secrets, cost' },
  { key: 'cozy',      label: 'Cozy',      icon: '🕯',  hint: 'Warmth, belonging, slow magic' },
  { key: 'tragic',    label: 'Tragic',    icon: '🥀',  hint: 'Loss, duty, last chances' },
  { key: 'whimsical', label: 'Whimsical', icon: '✨',  hint: 'Chaos, wonder, unlikely heroes' },
];

// ─── Character card component ─────────────────────────────────────────────────
function CharacterCard({
  card,
  imageDataUrl,
  onTryAgain,
}: {
  card:         SimulatorCard;
  imageDataUrl: string | null;
  onTryAgain:   () => void;
}) {
  const [copied, setCopied]         = useState(false);
  const [showDownloadTip, setTip]   = useState(false);

  const plainText = [
    `— ${card.world.name} —`,
    '',
    card.name.toUpperCase(),
    card.roleArchetype,
    '',
    card.storyHook.join(' '),
    '',
    `"${card.fateQuote}"`,
    '',
    'Generated by LoreKit 🐱',
  ].join('\n');

  async function handleCopy() {
    await navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <div className="sim-result animate-fade-up">

      {/* The shareable card */}
      <div className={`sim-card sim-card--${card.vibe || 'default'}`} data-vibe={card.vibe || 'default'}>

        {/* World header strip */}
        <div className="sim-card__world">
          <span className="sim-card__world-emoji">{card.world.emoji}</span>
          <div>
            <span className="sim-card__world-name">{card.world.name}</span>
            <span className="sim-card__world-tagline">{card.world.tagline}</span>
          </div>
        </div>

        <div className="sim-card__divider" />

        {/* Portrait + identity */}
        <div className="sim-card__identity">
          {imageDataUrl ? (
            <img
              src={imageDataUrl}
              alt="Character portrait"
              className="sim-card__portrait"
            />
          ) : (
            <div className="sim-card__portrait-placeholder">
              <span>{card.world.emoji}</span>
            </div>
          )}
          <div className="sim-card__identity-text">
            <h2 className="sim-card__name">{card.name}</h2>
            <p className="sim-card__role">{card.roleArchetype}</p>
          </div>
        </div>

        <div className="sim-card__divider" />

        {/* Story hook */}
        <p className="sim-card__story">
          {card.storyHook.join(' ')}
        </p>

        {/* Fate quote */}
        <div className="sim-card__fate-block">
          <span className="sim-card__fate-rule" />
          <blockquote className="sim-card__fate">
            "{card.fateQuote}"
          </blockquote>
          <span className="sim-card__fate-rule" />
        </div>

        {/* LoreKit credit */}
        <p className="sim-card__credit">🐱 LoreKit</p>

      </div>

      {/* Actions below card */}
      <div className="sim-card-actions">
        <div className="sim-card-actions__left">
          <button className="btn btn-teal btn-sm" onClick={handleCopy}>
            {copied ? '✅ Copied!' : '📋 Copy text'}
          </button>

          <div
            className="sim-download-wrap"
            onMouseEnter={() => setTip(true)}
            onMouseLeave={() => setTip(false)}
          >
            <button
              type="button"
              className="btn btn-ghost btn-sm sim-download-btn"
              disabled
              aria-label="Download card as image — coming soon"
            >
              🖼 Download card
              <span className="lc-coming-soon">soon</span>
            </button>
            {showDownloadTip && (
              <div className="sim-tooltip">
                Image export is coming in a future release.
              </div>
            )}
          </div>
        </div>

        <button className="btn btn-ghost btn-sm" onClick={onTryAgain}>
          ↺ Try again
        </button>
      </div>

    </div>
  );
}

// ─── Vibe chip ────────────────────────────────────────────────────────────────
function VibeChip({
  vibe,
  selected,
  onToggle,
}: {
  vibe:     typeof VIBES[number];
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`sim-vibe-chip sim-vibe-chip--${vibe.key} ${selected ? 'sim-vibe-chip--selected' : ''}`}
      onClick={onToggle}
      title={vibe.hint}
      aria-pressed={selected}
    >
      <span className="sim-vibe-chip__icon">{vibe.icon}</span>
      <span className="sim-vibe-chip__label">{vibe.label}</span>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Simulator() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm]   = useState<SimulatorForm>({ name: '', vibe: '', imageDataUrl: null });
  const [card, setCard]   = useState<SimulatorCard | null>(null);
  const [loading, setLoading] = useState(false);

  const canReveal = form.name.trim().length > 0;

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setForm(prev => ({ ...prev, imageDataUrl: reader.result as string }));
    reader.readAsDataURL(file);
  }

  function toggleVibe(key: VibeType) {
    setForm(prev => ({ ...prev, vibe: prev.vibe === key ? '' : key }));
  }

  async function handleReveal(e: React.FormEvent) {
    e.preventDefault();
    if (!canReveal) return;
    setLoading(true);
    setCard(null);

    // Simulated latency — replace with fetch('/api/simulator', …) when ready
    await new Promise(r => setTimeout(r, 850));

    const key   = form.vibe || 'default';
    const proto = MOCK_CARDS[key];
    setCard({ ...proto, name: form.name.trim(), vibe: form.vibe });

    setLoading(false);
    setTimeout(() => {
      document.getElementById('sim-card-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  function handleTryAgain() {
    setCard(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="page-wrapper">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <section className="section-header animate-fade-up">
        <span className="eyebrow">✨ Simulator</span>
        <h1>Step Through the Portal</h1>
        <p>
          Enter your name, choose a vibe, add a portrait. LoreKit will summon your character
          card from one of the ancient worlds. Free, instant, and made for sharing.
        </p>
      </section>

      {/* ── Form ────────────────────────────────────────────────────────── */}
      <div className="card animate-fade-up" style={{ animationDelay: '60ms' }}>
        <form onSubmit={handleReveal}>

          {/* Name */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" htmlFor="simName">
              Your Name <span style={{ color: 'var(--rose)' }}>*</span>
            </label>
            <input
              id="simName"
              type="text"
              className="form-input sim-name-input"
              placeholder="What shall we call you, wanderer?"
              value={form.name}
              maxLength={80}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />
          </div>

          {/* Vibe selector */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <p className="form-label" style={{ marginBottom: '0.6rem' }}>
              Vibe <span className="optional">(optional — shapes your world)</span>
            </p>
            <div className="sim-vibe-group">
              {VIBES.map(v => (
                <VibeChip
                  key={v.key}
                  vibe={v}
                  selected={form.vibe === v.key}
                  onToggle={() => toggleVibe(v.key)}
                />
              ))}
            </div>
            {form.vibe && (
              <p className="form-hint sim-vibe-hint">
                {VIBES.find(v => v.key === form.vibe)?.hint}
              </p>
            )}
          </div>

          {/* Portrait upload */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <p className="form-label" style={{ marginBottom: '0.5rem' }}>
              Portrait <span className="optional">(optional — client-side only, never uploaded)</span>
            </p>
            <div className="sim-upload-area">
              {form.imageDataUrl ? (
                <div className="sim-upload-area__preview">
                  <img
                    src={form.imageDataUrl}
                    alt="Portrait preview"
                    className="sim-upload-preview-img"
                  />
                  <div className="sim-upload-area__preview-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => fileRef.current?.click()}
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setForm(p => ({ ...p, imageDataUrl: null }))}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="sim-upload-trigger"
                  onClick={() => fileRef.current?.click()}
                >
                  <span className="sim-upload-trigger__icon">🖼</span>
                  <span className="sim-upload-trigger__label">Click to add a portrait</span>
                  <span className="sim-upload-trigger__hint">JPG, PNG, WebP — displayed on card only</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-teal btn-lg sim-reveal-btn"
              disabled={!canReveal || loading}
            >
              {loading
                ? '🌀 The portal is opening…'
                : card
                ? '✨ Reveal again'
                : '✨ Reveal my role'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Loading ──────────────────────────────────────────────────────── */}
      {loading && (
        <div className="spinner-wrap">
          <div className="spinner" />
          <span>The portal is weaving your fate…</span>
        </div>
      )}

      {/* ── Character card ────────────────────────────────────────────────── */}
      {card && !loading && (
        <div id="sim-card-anchor" style={{ marginTop: '2.5rem' }}>
          <CharacterCard
            card={card}
            imageDataUrl={form.imageDataUrl}
            onTryAgain={handleTryAgain}
          />
        </div>
      )}

    </div>
  );
}
