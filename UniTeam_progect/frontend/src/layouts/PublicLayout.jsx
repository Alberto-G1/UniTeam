import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './PublicLayout.css';

export const PublicLayout = () => {
  const { user } = useAuth();

  return (
    <div className="public-shell">
      <header className="public-header">
        <div className="public-brand">
          <Link to="/" className="brand-link">UniTeam</Link>
          <span>Academic Collaboration Platform</span>
        </div>

        <nav className="public-nav">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/services">Services</NavLink>
          <NavLink to="/news">News</NavLink>
          <NavLink to="/team">The Team</NavLink>
          <NavLink to="/faq">FAQ</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </nav>

        <div className="public-actions">
          {user ? (
            <Link to="/app" className="public-btn">Open Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="public-btn ghost">Login</Link>
              <Link to="/signup" className="public-btn">Get Started</Link>
            </>
          )}
        </div>
      </header>

      <main className="public-main">
        <Outlet />
      </main>

      <footer className="public-footer">
        <div>
          <strong>UniTeam</strong>
          <p>Project management built for universities and collaborative learning.</p>
        </div>
        <div className="public-footer-links">
          <Link to="/services">Services</Link>
          <Link to="/features">Features</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/news">News</Link>
          <Link to="/careers">Careers</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
