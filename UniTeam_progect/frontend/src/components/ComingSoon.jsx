import { useNavigate } from 'react-router-dom';
import './ComingSoon.css';

export default function ComingSoon({ feature = 'This feature', dashboardPath }) {
  const navigate = useNavigate();

  return (
    <div className="coming-soon-container">
      <div className="coming-soon-card">
        <div className="coming-soon-icon"><i className="fa-solid fa-rocket"></i></div>
        <h1 className="coming-soon-title">{feature}</h1>
        <p className="coming-soon-subtitle">is coming soon</p>
        <p className="coming-soon-description">
          We're working hard to bring you this feature. Stay tuned for updates!
        </p>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate(dashboardPath || -1)}
        >
          {dashboardPath ? 'Back to Dashboard' : 'Go Back'}
        </button>
      </div>
    </div>
  );
}
