import { useNavigate } from 'react-router-dom';

const features = [
  {
    key: 'lorecraft',
    icon: '🔮',
    title: 'LoreCraft',
    subtitle: 'Create Your World',
    desc: "Feed your world's DNA — type, rules, deviations, motifs — and receive a deep verification report. Find the cracks before your readers do.",
    cta: 'Craft a world →',
    path: '/lorecraft',
  },
  {
    key: 'lorecheck',
    icon: '📜',
    title: 'LoreCheck',
    subtitle: 'Validate Your World',
    desc: 'Paste any lore, scene, or worldbuilding passage. LoreKit scans for plausibility tensions and serves up crisp, actionable insights.',
    cta: 'Check your lore →',
    path: '/lorecheck',
  },
  {
    key: 'simulator',
    icon: '✨',
    title: 'Simulator',
    subtitle: 'Preview Your Story',
    desc: 'Drop your name and a vibe. Receive a character-story card pulled from the ancient worlds. Free, fast, and made for sharing.',
    cta: 'Enter the portal →',
    path: '/simulator',
  },
] as const;

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="page-wrapper--wide">
      <section className="hero animate-fade-in">
        <span className="hero__cat">🐱</span>
        <h1 className="hero__title">LoreKit</h1>
        <p className="hero__subtitle">
          Your enchanted companion for worldbuilding — craft, verify, and explore fictional worlds with a wise cat at your side.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/lorecraft')}>
            Start Building
          </button>
          <button className="btn btn-ghost btn-lg" onClick={() => navigate('/simulator')}>
            Try the Simulator
          </button>
        </div>
      </section>

      <div className="feature-grid">
        {features.map((f, i) => (
          <a
            key={f.key}
            href={f.path}
            className={`feature-card feature-card--${f.key} animate-fade-up`}
            style={{ animationDelay: `${i * 80}ms` }}
            onClick={(e) => { e.preventDefault(); navigate(f.path); }}
          >
            <span className="feature-card__icon">{f.icon}</span>
            <div className="feature-card__title">{f.title}</div>
            <div style={{ marginBottom: '0.5rem' }}>
              <span className={`badge badge-${f.key === 'lorecraft' ? 'violet' : f.key === 'lorecheck' ? 'gold' : 'teal'}`}>
                {f.subtitle}
              </span>
            </div>
            <p className="feature-card__desc">{f.desc}</p>
            <span className="feature-card__cta">{f.cta}</span>
          </a>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '4rem', paddingBottom: '2rem' }}>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
          🐱 &nbsp; "Every world has a logic. My job is to find where yours bends." — LoreKit
        </p>
      </div>
    </div>
  );
}
