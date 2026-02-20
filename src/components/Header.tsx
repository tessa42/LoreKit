import { NavLink } from 'react-router-dom';
import { useLang } from '../i18n';

export default function Header() {
  const { lang, setLang, t } = useLang();

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <NavLink to="/" className="site-header__logo">
          <img src="/cat-mascot.svg" className="site-header__logo-cat" alt="" aria-hidden="true" />
          <span className="site-header__logo-text">LoreKit</span>
        </NavLink>

        <nav className="site-header__nav" aria-label="Main navigation">
          <NavLink
            to="/lorecraft"
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          >
            {t('nav_lorecraft')}
          </NavLink>
          <NavLink
            to="/lorecheck"
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          >
            {t('nav_lorecheck')}
          </NavLink>
          <NavLink
            to="/simulator"
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          >
            Simulator
          </NavLink>
        </nav>

        <div className="site-header__right">
          {/* Language toggle */}
          <div className="lang-toggle" aria-label="Language selector">
            <button
              type="button"
              className={`lang-toggle__btn ${lang === 'en-US' ? 'lang-toggle__btn--active' : ''}`}
              onClick={() => setLang('en-US')}
              aria-pressed={lang === 'en-US'}
            >
              EN
            </button>
            <button
              type="button"
              className={`lang-toggle__btn ${lang === 'ko-KR' ? 'lang-toggle__btn--active' : ''}`}
              onClick={() => setLang('ko-KR')}
              aria-pressed={lang === 'ko-KR'}
            >
              한국어
            </button>
          </div>

          {/* Nutrients balance — static placeholder */}
          <div className="nutrients-badge" title={t('nutrients_title')}>
            <span className="nutrients-badge__icon">✦</span>
            <span className="nutrients-badge__value">250</span>
            <span className="nutrients-badge__label">{t('nutrients_label')}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
