// src/layouts/StudentLayout.jsx - COMPLETELY REDESIGNED
import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import { notificationsAPI } from '../services/api';
import './StudentLayout.css';

export const StudentLayout = () => {
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
    { path: '/student/dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
    { path: '/student/projects', label: 'My Projects', icon: 'fa-diagram-project' },
    { path: '/student/invitations', label: 'Invitations', icon: 'fa-inbox' },
    { path: '/student/tasks', label: 'Tasks', icon: 'fa-list-check' },
    { path: '/student/files', label: 'Files', icon: 'fa-file-lines' },
    { path: '/student/communication', label: 'Communication', icon: 'fa-comments' },
    { path: '/student/calendar', label: 'Calendar', icon: 'fa-calendar-days' },
  ];

  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`;
    }
    return user?.first_name?.[0] || user?.username?.[0] || 'U';
  };

  return (
    <div className="student-layout">
      {/* Sidebar Overlay for Mobile */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`student-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <div className="logo-text">
              <span className="logo-name">PROJECT HUB</span>
              <span className="logo-badge">Student Portal</span>
            </div>
          </div>
          <button 
            className="sidebar-close-mobile" 
            onClick={() => setSidebarOpen(false)}
          >
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
              {item.path === '/student/invitations' && (
                <span className="sidebar-badge">3</span>
              )}
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
              <div className="sidebar-user-role">Student • {user?.studentprofile?.year_of_study || 'Year 3'}</div>
            </div>
            <button className="sidebar-settings-btn" onClick={() => navigate('/student/profile')}>
              <i className="fa-solid fa-gear"></i>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="student-main-content">
        {/* Top Header */}
        <header className="student-top-header">
          <div className="header-left">
            <button 
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
            >
              <i className="fa-solid fa-bars"></i>
            </button>
            <div className="breadcrumb">
              <span className="breadcrumb-item">Student</span>
              <i className="fa-solid fa-chevron-right"></i>
              <span className="breadcrumb-item active">
                {navItems.find(item => isActive(item.path))?.label || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="header-center">
            <div className="search-bar">
              <i className="fa-solid fa-search"></i>
              <input type="text" placeholder="Search projects, tasks..." />
              <kbd>⌘K</kbd>
            </div>
          </div>

          <div className="header-right">
            <button className="icon-btn" onClick={toggleTheme}>
              <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
            
            <button className="icon-btn notification-btn" onClick={() => navigate('/student/notifications')}>
              <i className="fa-solid fa-bell"></i>
              {unreadNotifications > 0 && <span className="notification-dot"></span>}
            </button>

            <div className="user-dropdown">
              <button 
                className="user-trigger"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="user-avatar">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.first_name} />
                  ) : (
                    <span>{getInitials()}</span>
                  )}
                </div>
                <div className="user-info">
                  <div className="user-name">{user?.first_name || user?.username}</div>
                  <div className="user-role">Student</div>
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
                        <i className="fa-solid fa-graduation-cap"></i>
                        {user?.studentprofile?.year_of_study || 'Year 3'} Student
                      </div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link to="/student/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <i className="fa-solid fa-user"></i>
                    <span>My Profile</span>
                  </Link>
                  <Link to="/student/settings" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <i className="fa-solid fa-gear"></i>
                    <span>Settings</span>
                  </Link>
                  <Link to="/student/help" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
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
        <main className="student-content-area">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};