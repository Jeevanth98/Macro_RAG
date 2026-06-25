import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import './ConfidenceDisplay.css';

export default function ConfidenceDisplay({ confidence }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!confidence || typeof confidence.score === 'undefined') return null;

  const { score, level, breakdown = {}, reason } = confidence;

  // Determine color class based on score
  let colorClass = 'conf--low';
  if (score >= 80) colorClass = 'conf--high';
  else if (score >= 50) colorClass = 'conf--medium';

  const renderMetric = (label, val, barColorClass) => {
    const isNA = val === null || typeof val === 'undefined';
    return (
      <div className="confidence-metric">
        <span className="metric-label">{label}</span>
        <div className="metric-bar-container">
          {isNA ? (
            <div className="metric-bar" style={{ width: '100%', backgroundColor: 'var(--border-color, #475569)', opacity: 0.3 }}></div>
          ) : (
            <div className={`metric-bar ${barColorClass}`} style={{ width: `${val}%` }}></div>
          )}
        </div>
        <span className="metric-value">{isNA ? 'N/A' : `${val}%`}</span>
      </div>
    );
  };

  return (
    <div className="confidence-display animate-fade-in">
      <div className="confidence-header" onClick={() => setShowDetails(!showDetails)}>
        <span className={`confidence-badge ${colorClass}`}>
          Confidence: <strong>{score}%</strong> ({level})
        </span>
        <button type="button" className="confidence-toggle-btn">
          {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {showDetails && (
        <div className="confidence-details">
          <div className="confidence-reason">
            <strong>Reasoning:</strong> {reason}
          </div>
          <div className="confidence-grid">
            {renderMetric("RAG Confidence", breakdown.rag, "bg-primary")}
            {renderMetric("Citation Coverage", breakdown.citationCoverage, "bg-success")}
            {renderMetric("Validation Score", breakdown.validation, "bg-info")}
            {renderMetric("LLM Diagnostic", breakdown.llmAssessment, "bg-warning")}
          </div>
        </div>
      )}
    </div>
  );
}
