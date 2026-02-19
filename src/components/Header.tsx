import { NavLink } from 'react-router-dom';

export default function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <NavLink to="/" className="site-header__logo">
          <span className="site-header__logo-cat">🐱</span>
          <span className="site-header__logo-text">LoreKit</span>
        </NavLink>

        <nav className="site-header__nav" aria-label="Main navigation">
          <NavLink
            to="/lorecraft"
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          >
            LoreCraft
          </NavLink>
          <NavLink
            to="/lorecheck"
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          >
            LoreCheck
          </NavLink>
          <NavLink
            to="/simulator"
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          >
            Simulator
          </NavLink>
        </nav>

        {/* Nutrients balance — static placeholder */}
        <div className="nutrients-badge" title="Nutrients — your worldbuilding credits">
          <span className="nutrients-badge__icon">✦</span>
          <span className="nutrients-badge__value">250</span>
          <span className="nutrients-badge__label">Nutrients</span>
        </div>
      </div>
    </header>
  );
}
