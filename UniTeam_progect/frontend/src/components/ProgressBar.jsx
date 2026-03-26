// src/components/ProgressBar.jsx
import './ProgressBar.css';

const ProgressBar = ({ label, percentage, color }) => {
  return (
    <div className="progress-item">
      <div className="progress-top">
        <span className="progress-name">{label}</span>
        <span className="progress-pct">{percentage}%</span>
      </div>
      <div className="progress-track">
        <div 
          className="progress-fill" 
          style={{ width: `${percentage}%`, background: color || 'var(--green-accent)' }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;