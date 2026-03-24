import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/lecturer_base.css';

export const LecturerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
    <div className="lecturer-layout">
      <header className="header-bg lecturer-header">
        <div className="lecturer-header-inner">
          <div className="lecturer-header-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                className="icon-wrapper sidebar-toggle-mobile"
                onClick={() => setMobileOpen(!mobileOpen)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                title="Toggle sidebar"
              >
                <i className="fas fa-bars" style={{ color: 'white' }}></i>
              </button>
              <button
                className="icon-wrapper sidebar-toggle-desktop"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                title="Collapse sidebar"
              >
                <i className="fas fa-bars" style={{ color: 'white' }}></i>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="logo-placeholder">
                  <i className="fa-solid fa-chalkboard-user"></i>
                </div>
                <span className="header-title" style={{ fontWeight: 700 }}>PROJECT HUB</span>
              </div>
            </div>

            <nav className="lecturer-top-nav top-nav">
              <Link to="/lecturer/dashboard" className="top-nav-item">Home</Link>
              <Link to="/lecturer/students" className="top-nav-item">Students</Link>
              <Link to="/lecturer/projects" className="top-nav-item">Projects</Link>
              <Link to="#" className="top-nav-item" onClick={handleLogout}>Logout</Link>
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                className={`theme-toggle ${theme === 'dark' ? 'dark' : ''}`}
                onClick={toggleTheme}
                title="Toggle Theme"
                role="button"
                aria-label="Toggle Theme"
              >
                <i className="fas fa-sun"></i>
                <i className="fas fa-moon"></i>
              </div>

              <div className="profile-dropdown">
                <div
                  style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Profile" className="profile-avatar" />
                  ) : (
                    <div className="logo-placeholder">{user?.first_name?.[0]?.toUpperCase() || 'L'}</div>
                  )}
                  <span style={{ color: 'white', marginLeft: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
                    {user?.first_name || user?.username}
                  </span>
                  <i className="fas fa-chevron-down" style={{ color: 'white', marginLeft: '8px' }}></i>
                </div>

                <div className={`dropdown-menu ${dropdownOpen ? 'show' : ''}`}>
                  <div className="dropdown-item" style={{ borderBottom: '1px solid rgba(166, 176, 185, 0.2)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>{user?.first_name} {user?.last_name}</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>{user?.email}</span>
                    </div>
                  </div>
                  <Link to="/lecturer/profile" className="dropdown-item">
                    <i className="fas fa-user"></i> My Profile
                  </Link>
                  <Link to="/lecturer/settings" className="dropdown-item">
                    <i className="fas fa-cog"></i> Settings
                  </Link>
                  <Link to="/lecturer/help" className="dropdown-item">
                    <i className="fas fa-question-circle"></i> Help & Support
                  </Link>
                  <div className="dropdown-item" onClick={handleLogout} style={{ color: '#C0392B' }}>
                    <i className="fas fa-sign-out-alt"></i> Logout
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="lecturer-body">
        <aside
          className={`sidebar sidebar-bg ${sidebarCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-expanded' : ''}`}
        >
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="sidebar-header">
              <div className="logo-placeholder">
                <i className="fa-solid fa-chalkboard-user"></i>
              </div>
              <div className="sidebar-text">
                <div className="sidebar-brand-title">PROJECT HUB</div>
                <div className="sidebar-brand-subtitle">Lecturer Portal</div>
              </div>
            </div>

            <nav style={{ padding: '16px', flex: 1 }}>
              <Link to="/lecturer/dashboard" className={`sidebar-item ${isActive('/lecturer/dashboard') ? 'active' : ''}`} data-tooltip="Dashboard">
                <div className="icon-wrapper"><i className="fas fa-tachometer-alt"></i></div>
                <span className="sidebar-text">Dashboard</span>
              </Link>
              <Link to="/lecturer/students" className="sidebar-item" data-tooltip="Classes">
                <div className="icon-wrapper"><i className="fas fa-users"></i></div>
                <span className="sidebar-text">Classes</span>
              </Link>
              <Link to="/lecturer/projects" className={`sidebar-item ${isActive('/lecturer/projects') ? 'active' : ''}`} data-tooltip="Supervised Projects">
                <div className="icon-wrapper"><i className="fas fa-folder-open"></i></div>
                <span className="sidebar-text">Supervised Projects</span>
              </Link>
              <Link to="/lecturer/templates" className={`sidebar-item ${isActive('/lecturer/templates') ? 'active' : ''}`} data-tooltip="Project Templates">
                <div className="icon-wrapper"><i className="fas fa-clipboard-list"></i></div>
                <span className="sidebar-text">Project Templates</span>
              </Link>
              <Link to="/lecturer/reports" className="sidebar-item" data-tooltip="Reports">
                <div className="icon-wrapper"><i className="fas fa-chart-bar"></i></div>
                <span className="sidebar-text">Reports</span>
              </Link>
              <Link to="/lecturer/calendar" className="sidebar-item" data-tooltip="Calendar">
                <div className="icon-wrapper"><i className="fas fa-calendar"></i></div>
                <span className="sidebar-text">Calendar</span>
              </Link>
              <Link to="/lecturer/messages" className="sidebar-item" data-tooltip="Messages">
                <div className="icon-wrapper"><i className="fas fa-comments"></i></div>
                <span className="sidebar-text">Messages</span>
              </Link>
            </nav>

            <div className="sidebar-footer">
              <div className="sidebar-footer-content">
                <div className="sidebar-text">
                  <div className="sidebar-footer-text">© 2025 Project Hub</div>
                  <div className="sidebar-footer-subtext">Educator Edition</div>
                </div>
                <div className="sidebar-footer-icon">
                  <i className="fa-solid fa-graduation-cap"></i>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className={`mobile-overlay ${mobileOpen ? 'active' : ''}`} onClick={() => setMobileOpen(false)}></div>

        <main className={`main-content surface ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} id="mainContent" style={{ padding: '24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
