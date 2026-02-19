import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n';

export default function Home() {
  const navigate = useNavigate();
  const { t }    = useLang();

  const features = [
    {
      key:      'lorecraft',
      icon:     '🔮',
      title:    'LoreCraft',
      subtitle: t('home_lorecraft_subtitle'),
      desc:     t('home_lorecraft_desc'),
      cta:      t('home_lorecraft_cta'),
      path:     '/lorecraft',
      badge:    'badge-violet',
    },
    {
      key:      'lorecheck',
      icon:     '📜',
      title:    'LoreCheck',
      subtitle: t('home_lorecheck_subtitle'),
      desc:     t('home_lorecheck_desc'),
      cta:      t('home_lorecheck_cta'),
      path:     '/lorecheck',
      badge:    'badge-gold',
    },
    {
      key:      'simulator',
      icon:     '✨',
      title:    'Simulator',
      subtitle: t('home_simulator_subtitle'),
      desc:     t('home_simulator_desc'),
      cta:      t('home_simulator_cta'),
      path:     '/simulator',
      badge:    'badge-teal',
    },
  ];

  return (
    <div className="page-wrapper--wide">
      <section className="hero animate-fade-in">
        <span className="hero__cat">🐱</span>
        <h1 className="hero__title">LoreKit</h1>
        <p className="hero__subtitle">{t('home_subtitle')}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/lorecraft')}>
            {t('home_start_building')}
          </button>
          <button className="btn btn-ghost btn-lg" onClick={() => navigate('/simulator')}>
            {t('home_try_simulator')}
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
              <span className={`badge ${f.badge}`}>{f.subtitle}</span>
            </div>
            <p className="feature-card__desc">{f.desc}</p>
            <span className="feature-card__cta">{f.cta}</span>
          </a>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '4rem', paddingBottom: '2rem' }}>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
          🐱 &nbsp; {t('home_cat_quote')}
        </p>
      </div>
    </div>
  );
}
