import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../NotFound.css';

export default function NotFound({ feature = null, dashboardPath = null }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Determine the appropriate dashboard path based on user role
  const defaultDashboardPath = user?.role === 'STUDENT'
    ? '/student/dashboard'
    : user?.role === 'LECTURER'
    ? '/lecturer/dashboard'
    : user?.role === 'ADMIN'
    ? '/admin/dashboard'
    : '/';

  const goBackPath = dashboardPath || defaultDashboardPath;

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-icon">
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>
        
        <h1 className="not-found-title">Page Under Development</h1>
        
        <p className="not-found-subtitle">
          {feature ? `${feature} is coming soon!` : 'This page is not yet implemented.'}
        </p>

        <p className="not-found-description">
          We're working hard to bring you this feature. Check back soon!
        </p>

        <div className="not-found-actions">
          <button 
            onClick={() => navigate(goBackPath)}
            className="btn btn-primary"
          >
            <i className="fa-solid fa-arrow-left"></i> Back to Dashboard
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="btn btn-secondary"
          >
            <i className="fa-solid fa-home"></i> Home
          </button>
        </div>

        <div className="not-found-illustration">
          <div className="construction-cone"></div>
        </div>
      </div>
    </div>
  );
}
