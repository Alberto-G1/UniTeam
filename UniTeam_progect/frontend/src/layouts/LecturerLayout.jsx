import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export const LecturerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <nav className="navbar lecturer-navbar">
        <div className="navbar-brand">
          <Link to="/lecturer/dashboard">UniTeam - Lecturer</Link>
        </div>
        <ul className="navbar-menu">
          <li><Link to="/lecturer/dashboard">Dashboard</Link></li>
          <li><Link to="/lecturer/projects">Supervised Projects</Link></li>
          <li><Link to="/lecturer/templates">Project Templates</Link></li>
          <li><Link to="/lecturer/profile">Profile</Link></li>
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
