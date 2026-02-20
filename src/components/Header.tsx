import { NavLink, useNavigate } from 'react-router-dom';
import { useLang } from '../i18n';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { lang, setLang, t } = useLang();
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <NavLink to="/" className="site-header__logo">
          <img src="/icon.png" className="site-header__logo-cat" alt="" aria-hidden="true" />
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
          <NavLink
            to="/pricing"
            className={({ isActive }) => 'nav-link nav-link--pricing' + (isActive ? ' active' : '')}
          >
            {t('nav_pricing')}
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
              KR
            </button>
          </div>

          {/* Auth icon */}
          {!loading && (
            <button
              type="button"
              className={`auth-icon-btn ${user ? 'auth-icon-btn--active' : ''}`}
              onClick={user ? handleSignOut : () => navigate('/login')}
              title={user ? `${user.email} — ${t('auth_signout_btn')}` : t('auth_login_btn')}
              aria-label={user ? t('auth_signout_btn') : t('auth_login_btn')}
            >
              👤
            </button>
          )}

          {/* Nutrients balance */}
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
