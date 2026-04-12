// src/layouts/LecturerLayout.jsx - REDESIGNED
import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import { notificationsAPI } from '../services/api';
import './LecturerLayout.css';

export const LecturerLayout = () => {
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
    { path: '/lecturer/dashboard', label: 'Dashboard', icon: 'fa-chalkboard-user' },
    { path: '/lecturer/students', label: 'Students', icon: 'fa-users' },
    { path: '/lecturer/projects', label: 'Supervised Projects', icon: 'fa-folder-open' },
    { path: '/lecturer/templates', label: 'Project Templates', icon: 'fa-clipboard-list' },
    { path: '/lecturer/reports', label: 'Reports', icon: 'fa-chart-bar' },
    { path: '/lecturer/calendar', label: 'Calendar', icon: 'fa-calendar-days' },
    { path: '/lecturer/messages', label: 'Messages', icon: 'fa-comments' },
  ];

  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`;
    }
    return user?.first_name?.[0] || user?.username?.[0] || 'L';
  };

  return (
    <div className="lecturer-layout">
      {/* Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`lecturer-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <i className="fa-solid fa-chalkboard-user"></i>
            </div>
            <div className="logo-text">
              <span className="logo-name">PROJECT HUB</span>
              <span className="logo-badge">Lecturer Portal</span>
            </div>
          </div>
          <button className="sidebar-close-mobile" onClick={() => setSidebarOpen(false)}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
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
              <div className="sidebar-user-role">Lecturer • {user?.lecturerprofile?.department || 'Faculty'}</div>
            </div>
            <button className="sidebar-settings-btn" onClick={() => navigate('/lecturer/profile')}>
              <i className="fa-solid fa-gear"></i>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lecturer-main-content">
        {/* Top Header */}
        <header className="lecturer-top-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              <i className="fa-solid fa-bars"></i>
            </button>
            <div className="breadcrumb">
              <span className="breadcrumb-item">Lecturer</span>
              <i className="fa-solid fa-chevron-right"></i>
              <span className="breadcrumb-item active">
                {navItems.find(item => isActive(item.path))?.label || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="header-center">
            <div className="search-bar">
              <i className="fa-solid fa-search"></i>
              <input type="text" placeholder="Search students, projects..." />
              <kbd>⌘K</kbd>
            </div>
          </div>

          <div className="header-right">
            <button className="icon-btn" onClick={toggleTheme}>
              <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
            
            <button className="icon-btn notification-btn" onClick={() => navigate('/lecturer/notifications')}>
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
                  <div className="user-role">Lecturer</div>
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
                        <i className="fa-solid fa-chalkboard-user"></i>
                        {user?.lecturerprofile?.department || 'Faculty'}
                      </div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link to="/lecturer/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <i className="fa-solid fa-user"></i>
                    <span>My Profile</span>
                  </Link>
                  <Link to="/lecturer/settings" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <i className="fa-solid fa-gear"></i>
                    <span>Settings</span>
                  </Link>
                  <Link to="/lecturer/help" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <i className="fa-solid fa-circle-question"></i>
                    <span>Help & Support</span>
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
        <main className="lecturer-content-area">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};