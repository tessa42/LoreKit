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
      </div>
    </header>
  );
}
