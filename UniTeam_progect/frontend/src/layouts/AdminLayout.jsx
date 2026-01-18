import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <nav className="navbar admin-navbar">
        <div className="navbar-brand">
          <Link to="/admin/dashboard">UniTeam - Admin</Link>
        </div>
        <ul className="navbar-menu">
          <li><Link to="/admin/dashboard">Dashboard</Link></li>
          <li><Link to="/admin/users">Manage Users</Link></li>
          <li><Link to="/admin/lecturers/pending">Pending Lecturers</Link></li>
          <li><Link to="/admin/profile">Profile</Link></li>
        </ul>
        <div className="navbar-user">
          <span>{user?.full_name || user?.username}</span>
          <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};
