import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminLayout.css';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [unreadNotifications] = useState(3); // You can fetch this from context/API

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`;
    }
    return user?.first_name?.[0] || 'A';
  };

  const navItems = [
    {
      path: '/admin/dashboard',
      label: 'Dashboard',
      icon: 'fa-chart-line',
      exact: true
    },
    {
      section: 'Management',
      items: [
        {
          path: '/admin/users',
          label: 'Users',
          icon: 'fa-users'
        },
        {
          path: '/admin/lecturers',
          label: 'Lecturers',
          icon: 'fa-chalkboard-user'
        },
        {
          path: '/admin/reports',
          label: 'Reports',
          icon: 'fa-flag',
          badge: unreadNotifications
        },
        {
          path: '/admin/analytics',
          label: 'Analytics',
          icon: 'fa-chart-bar'
        }
      ]
    },
    {
      section: 'System',
      items: [
        {
          path: '/admin/settings',
          label: 'Settings',
          icon: 'fa-gear'
        },
        {
          path: '/admin/security',
          label: 'Security',
          icon: 'fa-lock'
        },
        {
          path: '/admin/backup',
          label: 'Backup & Restore',
          icon: 'fa-database'
        }
      ]
    }
  ];

  const quickLinks = [
    { label: 'Dashboard', path: '/admin/dashboard' },
    { label: 'User Management', path: '/admin/users' },
    { label: 'Reports', path: '/admin/reports' },
    { label: 'Settings', path: '/admin/settings' }
  ];

  return (
    <div className="admin-layout-container" data-collapsed={sidebarCollapsed}>
      {/* Mobile Overlay */}
      {isMobile && sidebarCollapsed && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarCollapsed(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            {!sidebarCollapsed && (
              <div className="admin-brand-info">
                <h2>PROJECT HUB</h2>
                <div className="admin-brand-subtitle">Admin Portal</div>
              </div>
            )}
          </div>
          <button 
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <i className={`fa-solid fa-chevron-${sidebarCollapsed ? 'right' : 'left'}`}></i>
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          {navItems.map((item, index) => (
            <div key={index} className="nav-section">
              {!sidebarCollapsed && item.section && (
                <div className="nav-section-title">
                  {item.section}
                </div>
              )}
              
              {item.path ? (
                <Link 
                  to={item.path}
                  className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                  title={sidebarCollapsed ? item.label : ''}
                >
                  <span className="nav-item-icon">
                    <i className={`fa-solid ${item.icon}`}></i>
                  </span>
                  {!sidebarCollapsed && (
                    <>
                      <span className="nav-item-label">{item.label}</span>
                      {item.badge && (
                        <span className="nav-item-badge">{item.badge}</span>
                      )}
                    </>
                  )}
                </Link>
              ) : (
                item.items?.map((subItem, subIndex) => (
                  <Link 
                    key={subIndex}
                    to={subItem.path}
                    className={`nav-item ${isActive(subItem.path) ? 'active' : ''}`}
                    title={sidebarCollapsed ? subItem.label : ''}
                  >
                    <span className="nav-item-icon">
                      <i className={`fa-solid ${subItem.icon}`}></i>
                    </span>
                    {!sidebarCollapsed && (
                      <>
                        <span className="nav-item-label">{subItem.label}</span>
                        {subItem.badge && (
                          <span className="nav-item-badge">{subItem.badge}</span>
                        )}
                      </>
                    )}
                  </Link>
                ))
              )}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          {!sidebarCollapsed && (
            <div className="admin-footer-content">
              <div className="admin-footer-text">
                <div className="admin-footer-title">© 2025 Project Hub</div>
                <div className="admin-footer-subtitle">Administrator Console</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main-content">
        {/* Top Header */}
        <header className="admin-top-header">
          <div className="header-left">
            {isMobile && (
              <button 
                className="mobile-menu-toggle"
                onClick={toggleSidebar}
                aria-label="Toggle menu"
              >
                <i className="fa-solid fa-bars"></i>
              </button>
            )}
            <div className="breadcrumb">
              <span className="breadcrumb-item">Admin</span>
              <i className="fa-solid fa-chevron-right"></i>
              <span className="breadcrumb-item active">
                {location.pathname.split('/').pop() || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="header-center">
            <nav className="quick-links">
              {quickLinks.map((link, index) => (
                <Link 
                  key={index}
                  to={link.path}
                  className={`quick-link ${isActive(link.path) ? 'active' : ''}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="header-right">
            <div className="header-actions">
              <button 
                className="action-btn search-btn"
                aria-label="Search"
              >
                <i className="fa-solid fa-search"></i>
              </button>
              
              <button 
                className="action-btn notification-btn"
                aria-label="Notifications"
              >
                <i className="fa-solid fa-bell"></i>
                {unreadNotifications > 0 && (
                  <span className="notification-badge">{unreadNotifications}</span>
                )}
              </button>
              
              <button 
                className="action-btn settings-btn"
                aria-label="Settings"
                onClick={() => navigate('/admin/settings')}
              >
                <i className="fa-solid fa-gear"></i>
              </button>

              <div className={`profile-dropdown ${dropdownOpen ? 'open' : ''}`}>
                <button 
                  className="profile-trigger"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-label="User menu"
                >
                  <div className="profile-avatar">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.first_name} />
                    ) : (
                      <div className="avatar-placeholder accent-1">
                        {getInitials()}
                      </div>
                    )}
                  </div>
                  <div className="profile-info">
                    <div className="profile-name">
                      {user?.first_name || 'Administrator'}
                    </div>
                    <div className="profile-role">Administrator</div>
                  </div>
                  <i className="fa-solid fa-chevron-down dropdown-arrow"></i>
                </button>

                <div className="dropdown-menu surface-bg">
                  <div className="dropdown-header">
                    <div className="dropdown-user">
                      <div className="dropdown-avatar accent-1">
                        {getInitials()}
                      </div>
                      <div>
                        <div className="dropdown-username">
                          {user?.first_name} {user?.last_name || ''}
                        </div>
                        <div className="dropdown-email">{user?.email}</div>
                      </div>
                    </div>
                  </div>
                  
                  <Link 
                    to="/admin/profile" 
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <i className="fa-solid fa-user dropdown-icon"></i>
                    <span>My Profile</span>
                  </Link>
                  <Link 
                    to="/admin/settings" 
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <i className="fa-solid fa-gear dropdown-icon"></i>
                    <span>Settings</span>
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button 
                    className="dropdown-item logout-btn"
                    onClick={handleLogout}
                  >
                    <i className="fa-solid fa-right-from-bracket dropdown-icon"></i>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
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