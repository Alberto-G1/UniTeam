// src/components/StatCard.jsx
import './StatCard.css';

const StatCard = ({ type, icon, value, label, trend, trendValue }) => {
  const getTrendClass = () => {
    if (trend === 'up') return 'up';
    if (trend === 'down') return 'down';
    return 'new';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '+';
  };

  return (
    <div className={`stat-card ${type}`}>
      <div className="stat-accent"></div>
      <div className="stat-top">
        <div className="stat-icon">{icon}</div>
        {trendValue && (
          <span className={`stat-trend ${getTrendClass()}`}>
            {getTrendIcon()} {trendValue}
          </span>
        )}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
};

export default StatCard;