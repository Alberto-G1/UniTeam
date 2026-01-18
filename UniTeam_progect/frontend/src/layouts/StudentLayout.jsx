import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export const StudentLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <nav className="navbar student-navbar">
        <div className="navbar-brand">
          <Link to="/student/dashboard">UniTeam - Student</Link>
        </div>
        <ul className="navbar-menu">
          <li><Link to="/student/dashboard">Dashboard</Link></li>
          <li><Link to="/student/projects">My Projects</Link></li>
          <li><Link to="/student/invitations">Invitations</Link></li>
          <li><Link to="/student/profile">Profile</Link></li>
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
