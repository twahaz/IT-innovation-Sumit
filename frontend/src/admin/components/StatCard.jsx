import React from 'react';

const StatCard = ({ title, value, subtext, icon: Icon, color = 'blue' }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-info">
        <span className="stat-card-title">{title}</span>
        <span className="stat-card-value">{value}</span>
        {subtext && <span className="stat-card-subtext">{subtext}</span>}
      </div>
      {Icon && (
        <div className={`stat-card-icon-box ${color}`}>
          <Icon size={22} />
        </div>
      )}
    </div>
  );
};

export default StatCard;
