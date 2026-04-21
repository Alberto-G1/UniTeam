// src/layouts/PublicLayout.jsx
import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './PublicLayout.css';

const PublicLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('ut-theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('ut-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="public-shell">
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <Link to="/" className="nav-brand" onClick={closeMobile}>
            <div className="nav-brand-name">UniTeam</div>
            <div className="nav-brand-sub">Academic Collaboration Platform</div>
          </Link>
          <ul className="nav-links">
            <li><NavLink to="/" end>Home</NavLink></li>
            <li><NavLink to="/about">About</NavLink></li>
            <li><NavLink to="/services">Services</NavLink></li>
            <li><NavLink to="/news">News</NavLink></li>
            <li><NavLink to="/team">The Team</NavLink></li>
            <li><NavLink to="/faq">FAQ</NavLink></li>
            <li><NavLink to="/contact">Contact</NavLink></li>
          </ul>
          <div className="nav-actions">
            <button className="theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              )}
            </button>
            {user ? (
              <button className="btn-started" onClick={() => navigate('/app')}>Dashboard</button>
            ) : (
              <>
                <button className="btn-login" onClick={() => navigate('/login')}>Login</button>
                <button className="btn-started" onClick={() => navigate('/signup')}>Get Started</button>
              </>
            )}
          </div>
          <button className={`nav-hamburger ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(!mobileOpen)}>
            <span className="hb-bar"></span>
            <span className="hb-bar"></span>
            <span className="hb-bar"></span>
          </button>
        </div>
      </nav>

      <div className={`mobile-nav ${mobileOpen ? 'open' : ''}`}>
        <ul className="mobile-nav-links">
          <li><NavLink to="/" onClick={closeMobile}>Home</NavLink></li>
          <li><NavLink to="/about" onClick={closeMobile}>About</NavLink></li>
          <li><NavLink to="/services" onClick={closeMobile}>Services</NavLink></li>
          <li><NavLink to="/news" onClick={closeMobile}>News</NavLink></li>
          <li><NavLink to="/team" onClick={closeMobile}>The Team</NavLink></li>
          <li><NavLink to="/faq" onClick={closeMobile}>FAQ</NavLink></li>
          <li><NavLink to="/contact" onClick={closeMobile}>Contact</NavLink></li>
        </ul>
        <div className="mobile-nav-actions">
          {user ? (
            <button className="btn-started" onClick={() => { navigate('/app'); closeMobile(); }}>Dashboard</button>
          ) : (
            <>
              <button className="btn-login" onClick={() => { navigate('/login'); closeMobile(); }}>Login</button>
              <button className="btn-started" onClick={() => { navigate('/signup'); closeMobile(); }}>Get Started →</button>
            </>
          )}
        </div>
      </div>

      <main className="public-main">
        <Outlet />
      </main>

      <footer className="public-footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div>
              <div className="footer-brand-name">UniTeam</div>
              <div className="footer-brand-sub">Academic Collaboration Platform</div>
              <p className="footer-brand-desc">Helping university teams coordinate, collaborate, and submit — all in one place.</p>
              <div className="footer-socials">
                <button className="social-btn">𝕏</button>
                <button className="social-btn">in</button>
                <button className="social-btn">f</button>
                <button className="social-btn">▶</button>
              </div>
            </div>
            <div>
              <div className="footer-col-title">Platform</div>
              <ul className="footer-links">
                <li><Link to="/services">Features</Link></li>
                <li><Link to="/services">Pricing</Link></li>
                <li><a>Integrations</a></li>
                <li><a>API Docs</a></li>
                <li><a>Security</a></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Company</div>
              <ul className="footer-links">
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/team">The Team</Link></li>
                <li><Link to="/news">News</Link></li>
                <li><a>Careers</a></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Support</div>
              <ul className="footer-links">
                <li><Link to="/faq">FAQ</Link></li>
                <li><a>Help Centre</a></li>
                <li><a>Community</a></li>
                <li><a>Status</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-copy">© {new Date().getFullYear()} UniTeam. All rights reserved.</div>
            <div className="footer-bottom-links">
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
              <a>Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;