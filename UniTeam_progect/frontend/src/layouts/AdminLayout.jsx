// src/layouts/AdminLayout.jsx - REDESIGNED
import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import { notificationsAPI } from '../services/api';
import './AdminLayout.css';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const data = await notificationsAPI.unreadCount();
        setUnreadNotifications(data?.unread_count || 0);
      } catch (error) {
        setUnreadNotifications(0);
      }
    };

    loadUnreadCount();
  }, [location.pathname]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    showToast('info', 'Theme Changed', `${newTheme === 'dark' ? 'Dark' : 'Light'} mode activated`);
  };

  const handleLogout = () => {
    logout();
    showToast('info', 'Signed Out', 'You have been successfully logged out.');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
    { path: '/admin/users', label: 'Users', icon: 'fa-users' },
    { path: '/admin/lecturers', label: 'Lecturers', icon: 'fa-chalkboard-user' },
    { path: '/admin/reports', label: 'Reports', icon: 'fa-flag' },
    { path: '/admin/analytics', label: 'Analytics', icon: 'fa-chart-bar' },
    { path: '/admin/settings', label: 'Settings', icon: 'fa-gear' },
    { path: '/admin/security', label: 'Security', icon: 'fa-lock' },
  ];

  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`;
    }
    return user?.first_name?.[0] || user?.username?.[0] || 'A';
  };

  return (
    <div className="admin-layout">
      {/* Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div className="logo-text">
              <span className="logo-name">PROJECT HUB</span>
              <span className="logo-badge">Admin Portal</span>
            </div>
          </div>
          <button className="sidebar-close-mobile" onClick={() => setSidebarOpen(false)}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">Main</div>
          {navItems.slice(0, 3).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <div className="sidebar-item-icon">
                <i className={`fa-solid ${item.icon}`}></i>
              </div>
              <span className="sidebar-item-label">{item.label}</span>
            </Link>
          ))}
          
          <div className="nav-section">System</div>
          {navItems.slice(3).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <div className="sidebar-item-icon">
                <i className={`fa-solid ${item.icon}`}></i>
              </div>
              <span className="sidebar-item-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.first_name} />
              ) : (
                <span>{getInitials()}</span>
              )}
              <div className="avatar-status"></div>
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {user?.first_name} {user?.last_name}
              </div>
              <div className="sidebar-user-role">Administrator</div>
            </div>
            <button className="sidebar-settings-btn" onClick={() => navigate('/admin/profile')}>
              <i className="fa-solid fa-gear"></i>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main-content">
        {/* Top Header */}
        <header className="admin-top-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              <i className="fa-solid fa-bars"></i>
            </button>
            <div className="breadcrumb">
              <span className="breadcrumb-item">Admin</span>
              <i className="fa-solid fa-chevron-right"></i>
              <span className="breadcrumb-item active">
                {navItems.find(item => isActive(item.path))?.label || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="header-center">
            <div className="search-bar">
              <i className="fa-solid fa-search"></i>
              <input type="text" placeholder="Search users, reports..." />
              <kbd>⌘K</kbd>
            </div>
          </div>

          <div className="header-right">
            <button className="icon-btn" onClick={toggleTheme}>
              <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
            
            <button className="icon-btn notification-btn" onClick={() => navigate('/admin/notifications')}>
              <i className="fa-solid fa-bell"></i>
              {unreadNotifications > 0 && <span className="notification-dot"></span>}
            </button>

            <div className="user-dropdown">
              <button className="user-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <div className="user-avatar">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.first_name} />
                  ) : (
                    <span>{getInitials()}</span>
                  )}
                </div>
                <div className="user-info">
                  <div className="user-name">{user?.first_name || user?.username}</div>
                  <div className="user-role">Admin</div>
                </div>
                <i className={`fa-solid fa-chevron-down ${dropdownOpen ? 'rotate' : ''}`}></i>
              </button>

              {dropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <div className="dropdown-avatar">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.first_name} />
                      ) : (
                        <span>{getInitials()}</span>
                      )}
                    </div>
                    <div>
                      <div className="dropdown-name">{user?.first_name} {user?.last_name}</div>
                      <div className="dropdown-email">{user?.email}</div>
                      <div className="dropdown-badge">
                        <i className="fa-solid fa-shield-halved"></i>
                        System Administrator
                      </div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link to="/admin/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <i className="fa-solid fa-user"></i>
                    <span>My Profile</span>
                  </Link>
                  <Link to="/admin/settings" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <i className="fa-solid fa-gear"></i>
                    <span>Settings</span>
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item danger" onClick={handleLogout}>
                    <i className="fa-solid fa-right-from-bracket"></i>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="admin-content-area">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};