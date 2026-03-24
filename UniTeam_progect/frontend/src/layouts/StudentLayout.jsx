import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './StudentLayout.css';

export const StudentLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="student-layout">
      <header className="header-bg student-header">
        <div className="student-header-inner">
          <div className="student-header-top">
            <div className="logo-container">
              <div className="logo-placeholder">
                <i className="fa-solid fa-graduation-cap"></i>
              </div>
              <div className="brand-info">
                <h1 className="text-white brand-title">PROJECT HUB</h1>
                <p className="brand-subtitle">University Project Management</p>
              </div>
            </div>

            <div className="student-controls">
              <button
                className={`theme-toggle-btn ${theme === 'dark' ? 'dark' : ''}`}
                onClick={toggleTheme}
                title="Toggle Theme"
                aria-label="Toggle Theme"
              >
                <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
              </button>

              <button className="notification-btn" title="Notifications">
                <i className="fa-solid fa-bell"></i>
                <span className="notification-badge">3</span>
              </button>

              <div className="profile-dropdown">
                <div
                  className="logo-container"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.username} className="profile-avatar" />
                  ) : (
                    <div className="profile-avatar bg-accent-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                      {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600 }}>
                    {user?.first_name || user?.username}
                  </span>
                  <i className="fa-solid fa-chevron-down" style={{ color: 'white' }}></i>
                </div>

                <div className={`dropdown-menu ${dropdownOpen ? 'show' : ''}`}>
                  <div className="dropdown-item" style={{ borderBottom: '1px solid rgba(166, 176, 185, 0.2)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>{user?.first_name} {user?.last_name}</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>{user?.email}</span>
                    </div>
                  </div>
                  <Link to="/student/profile" className="dropdown-item">
                    <i className="fa-solid fa-user"></i> My Profile
                  </Link>
                  <Link to="/student/settings" className="dropdown-item">
                    <i className="fa-solid fa-gear"></i> Settings
                  </Link>
                  <Link to="/student/help" className="dropdown-item">
                    <i className="fa-solid fa-circle-question"></i> Help & Support
                  </Link>
                  <div className="dropdown-item" onClick={handleLogout} style={{ color: '#C0392B' }}>
                    <i className="fa-solid fa-right-from-bracket"></i> Logout
                  </div>
                </div>
              </div>
            </div>
          </div>

          <nav className="student-nav">
            <Link to="/student/dashboard" className={`nav-link ${isActive('/student/dashboard') ? 'active' : ''}`}>
              <i className="fa-solid fa-gauge-high"></i>
              Dashboard
            </Link>
            <Link to="/student/projects/create" className="nav-link">
              <i className="fa-solid fa-folder"></i>
              Create Project
            </Link>
            <Link to="/student/projects" className={`nav-link ${isActive('/student/projects') ? 'active' : ''}`}>
              <i className="fa-solid fa-diagram-project"></i>
              My Projects
            </Link>
            <Link to="/student/invitations" className={`nav-link ${isActive('/student/invitations') ? 'active' : ''}`}>
              <i className="fa-solid fa-inbox"></i>
              Invitations
            </Link>
            <Link to="/student/tasks" className="nav-link">
              <i className="fa-solid fa-list-check"></i>
              Tasks
            </Link>
            <Link to="/student/files" className="nav-link">
              <i className="fa-solid fa-file-lines"></i>
              Files
            </Link>
            <Link to="/student/communication" className="nav-link">
              <i className="fa-solid fa-comments"></i>
              Communication
            </Link>
            <Link to="/student/calendar" className="nav-link">
              <i className="fa-solid fa-calendar-days"></i>
              Calendar
            </Link>
          </nav>
        </div>
      </header>

      <main className="student-main surface">
        <Outlet />
      </main>

      <footer className="footer-bg student-footer">
        <div className="student-header-inner">
          <div className="footer-content">
            <div className="footer-left">
              <div className="footer-brand">
                <div className="logo-placeholder">
                  <i className="fa-solid fa-graduation-cap"></i>
                </div>
                <div>
                  <div className="footer-brand-title">PROJECT HUB</div>
                  <div className="footer-brand-subtitle">University Project Management System</div>
                </div>
              </div>
              <p className="footer-description">Empowering students and educators with seamless project collaboration and management tools.</p>
            </div>
            <div className="footer-right">
              <div className="footer-section">
                <h4 className="footer-section-title">Quick Links</h4>
                <div className="footer-links">
                  <Link to="/student/dashboard"><i className="fa-solid fa-angle-right"></i> Dashboard</Link>
                  <Link to="/student/projects"><i className="fa-solid fa-angle-right"></i> My Projects</Link>
                  <Link to="/student/invitations"><i className="fa-solid fa-angle-right"></i> Invitations</Link>
                  <Link to="/student/profile"><i className="fa-solid fa-angle-right"></i> Profile</Link>
                </div>
              </div>
              <div className="footer-section">
                <h4 className="footer-section-title">Support</h4>
                <div className="footer-links">
                  <Link to="/help"><i className="fa-solid fa-angle-right"></i> Help Center</Link>
                  <Link to="/contact"><i className="fa-solid fa-angle-right"></i> Contact Us</Link>
                  <Link to="/privacy"><i className="fa-solid fa-angle-right"></i> Privacy Policy</Link>
                  <Link to="/terms"><i className="fa-solid fa-angle-right"></i> Terms of Service</Link>
                </div>
              </div>
              <div className="footer-section">
                <h4 className="footer-section-title">Connect</h4>
                <div className="footer-social">
                  <a href="#" className="social-link" title="Facebook"><i className="fa-brands fa-facebook"></i></a>
                  <a href="#" className="social-link" title="Twitter"><i className="fa-brands fa-twitter"></i></a>
                  <a href="#" className="social-link" title="LinkedIn"><i className="fa-brands fa-linkedin"></i></a>
                  <a href="#" className="social-link" title="Instagram"><i className="fa-brands fa-instagram"></i></a>
                </div>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-bottom-content">
              <p className="footer-copyright">© 2025 Project Hub. All rights reserved.</p>
              <p className="footer-credit">Designed & Developed with <i className="fa-solid fa-heart" style={{color: '#C0392B'}}></i> by Your Team</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
