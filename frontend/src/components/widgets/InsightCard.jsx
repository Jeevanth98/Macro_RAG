import React from 'react';
import ConfidenceDisplay from '../common/ConfidenceDisplay';
import './InsightCard.css';

const severityConfig = {
  high: { dot: '🔴', className: 'insight--high' },
  medium: { dot: '🟡', className: 'insight--medium' },
  low: { dot: '🟢', className: 'insight--low' },
  info: { dot: '🔵', className: 'insight--info' },
};

export default function InsightCard({ title, severity = 'info', time, url, onClick, confidence }) {
  const config = severityConfig[severity] || severityConfig.info;

  const content = (
    <>
      <span className="insight-card__dot">{config.dot}</span>
      <div className="insight-card__content" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, width: '100%' }}>
          <span className="insight-card__title">{title}</span>
          {confidence && (
            <span className={`badge ${confidence.score >= 90 ? 'conf--high' : 'conf--medium'}`} style={{ fontSize: 10, padding: '2px 6px', whiteSpace: 'nowrap' }}>
              {confidence.score}%
            </span>
          )}
        </div>
        {time && <span className="insight-card__time">{time}</span>}
        {confidence && (
          <div style={{ marginTop: 8 }} onClick={e => e.stopPropagation()}>
            <ConfidenceDisplay confidence={confidence} />
          </div>
        )}
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
