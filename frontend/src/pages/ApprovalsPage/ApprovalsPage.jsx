import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle,
  Clock, 
  Database,
  FileJson,
  Check, 
  X,
  RefreshCw
} from 'lucide-react';
import './ApprovalsPage.css';

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getApprovals('PENDING');
      setApprovals(data);
      if (data.length > 0) {
        setSelectedItem(data[0]);
      } else {
        setSelectedItem(null);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch validation queue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleApprove = async (id) => {
    try {
      setActionLoading(true);
      await api.approveData(id);
      setApprovals(prev => prev.filter(item => item.id !== id));
      const nextItems = approvals.filter(item => item.id !== id);
      if (nextItems.length > 0) {
        setSelectedItem(nextItems[0]);
      } else {
        setSelectedItem(null);
      }
    } catch (err) {
      alert('Failed to approve data: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    try {
      setActionLoading(true);
      await api.rejectData(id);
      setApprovals(prev => prev.filter(item => item.id !== id));
      const nextItems = approvals.filter(item => item.id !== id);
      if (nextItems.length > 0) {
        setSelectedItem(nextItems[0]);
      } else {
        setSelectedItem(null);
      }
    } catch (err) {
      alert('Failed to reject data: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const parseJson = (str, fallback = {}) => {
    try {
      return JSON.parse(str);
    } catch (e) {
      return fallback;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="approvals-container">
      <header className="approvals-header">
        <div className="header-title-wrapper">
          <ShieldAlert size={28} className="header-icon" />
          <div>
            <h1>Data Quality & Validation</h1>
            <p className="subtitle">
              Review and manually validate incoming economic records that did not meet the auto-approval threshold.
            </p>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="queue-count-badge">
            <Clock size={14} />
            <span>{approvals.length} pending review{approvals.length !== 1 ? 's' : ''}</span>
          </div>
          <button className="btn-refresh-icon" onClick={fetchApprovals} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </header>

      {error && (
        <div className="approvals-error">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button onClick={fetchApprovals} className="btn-retry">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="approvals-loading">
          <div className="spinner"></div>
          <p>Loading validation queue...</p>
        </div>
      ) : approvals.length === 0 ? (
        <div className="empty-state">
          <div className="success-shield">
            <ShieldCheck size={72} />
          </div>
          <h2>Validation Queue Clear</h2>
          <p>
            No economic data is currently pending manual validation. All ingestions successfully passed the 80% confidence criteria.
          </p>
          <button onClick={fetchApprovals} className="btn-refresh">Refresh Queue</button>
        </div>
      ) : (
        <div className="approvals-grid">
          {/* Left panel: List of items */}
          <div className="approvals-list-panel">
            <div className="panel-title">Pending Review Ingestions</div>
            <div className="list-items">
              {approvals.map((item) => {
                const payload = parseJson(item.payload);
                const title = payload.title || `Chart Series (${payload.length || 0} pts)`;
                return (
                  <div 
                    key={item.id} 
                    className={`approval-item-card ${selectedItem?.id === item.id ? 'active' : ''}`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="card-top">
                      <span className="data-type-badge">{item.dataType}</span>
                      <span className="score-badge" style={{ backgroundColor: getScoreColor(item.validationScore) + '15', color: getScoreColor(item.validationScore) }}>
                        {item.validationScore}%
                      </span>
                    </div>
                    <div className="card-title">{title}</div>
                    <div className="card-meta">
                      <span>Source: <strong>{item.source}</strong></span>
                      <span>•</span>
                      <span>{new Date(item.extractedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel: Details of selected item */}
          <div className="approvals-detail-panel">
            {selectedItem ? (
              <div className="detail-content">
                <div className="detail-header">
                  <div className="detail-title-block">
                    <h2>
                      {parseJson(selectedItem.payload).title || `Chart Series (${parseJson(selectedItem.payload).length || 0} data points)`}
                    </h2>
                    <div className="detail-meta">
                      <span className="meta-tag"><Database size={14} /> {selectedItem.source}</span>
                      <span className="meta-tag"><Clock size={14} /> {new Date(selectedItem.extractedAt).toLocaleString()}</span>
                      <span className="meta-tag">Type: {selectedItem.dataType}</span>
                    </div>
                  </div>

                  <div className="score-gauge-wrapper">
                    <div className="gauge-outer" style={{ borderColor: getScoreColor(selectedItem.validationScore) }}>
                      <span className="gauge-score">{selectedItem.validationScore}%</span>
                      <span className="gauge-label">Score</span>
                    </div>
                  </div>
                </div>

                {/* Validation Breakdown Section */}
                <div className="validation-breakdown-section">
                  <h3>Validation Parameter Breakdown</h3>
                  <div className="breakdown-grid">
                    {Object.entries(parseJson(selectedItem.validationDetails)).map(([layer, info]) => (
                      <div key={layer} className="breakdown-card">
                        <div className="breakdown-card-header">
                          <span className="layer-name">{layer.toUpperCase()} VALIDATION</span>
                          <span 
                            className="layer-score" 
                            style={{ color: getScoreColor(info.score) }}
                          >
                            {info.score}/100
                          </span>
                        </div>
                        <div className="progress-bar-container">
                          <div 
                            className="progress-bar" 
                            style={{ 
                              width: `${info.score}%`, 
                              backgroundColor: getScoreColor(info.score) 
                            }}
                          ></div>
                        </div>
                        <p className="layer-reason">{info.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Data Preview */}
                <div className="data-preview-section">
                  <div className="preview-header">
                    <h3><FileJson size={16} /> Data Payload Preview</h3>
                  </div>
                  <pre className="json-viewer">
                    {JSON.stringify(parseJson(selectedItem.payload), null, 2)}
                  </pre>
                </div>

                {/* Footer actions */}
                <div className="detail-actions">
                  <button 
                    className="btn-action btn-reject" 
                    onClick={() => handleReject(selectedItem.id)}
                    disabled={actionLoading}
                  >
                    <X size={16} /> Reject & Discard
                  </button>
                  <button 
                    className="btn-action btn-approve" 
                    onClick={() => handleApprove(selectedItem.id)}
                    disabled={actionLoading}
                  >
                    <Check size={16} /> Approve & Import Data
                  </button>
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <ShieldCheck size={48} />
                <p>Select a validation record from the list to view its complete audit report.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
