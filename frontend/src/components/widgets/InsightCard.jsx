import React from 'react';
import './InsightCard.css';

const severityConfig = {
  high: { dot: '🔴', className: 'insight--high' },
  medium: { dot: '🟡', className: 'insight--medium' },
  low: { dot: '🟢', className: 'insight--low' },
  info: { dot: '🔵', className: 'insight--info' },
};

export default function InsightCard({ title, severity = 'info', time, url, onClick }) {
  const config = severityConfig[severity] || severityConfig.info;

  const content = (
    <>
      <span className="insight-card__dot">{config.dot}</span>
      <div className="insight-card__content">
        <span className="insight-card__title">{title}</span>
        {time && <span className="insight-card__time">{time}</span>}
      </div>
    </>
  );

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={`insight-card ${config.className}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex' }}>
        {content}
      </a>
    );
  }

  return (
    <div className={`insight-card ${config.className}`} onClick={onClick}>
      {content}
    </div>
  );
}
