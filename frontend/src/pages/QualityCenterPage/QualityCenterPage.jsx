import React, { useState, useEffect } from 'react';
import { Play, ClipboardCheck, Sparkles, Clock, AlertTriangle, Calendar, Layers, ShieldCheck, RefreshCw, BarChart2 } from 'lucide-react';
import { api } from '../../services/api';
import './QualityCenterPage.css';

export default function QualityCenterPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      const res = await api.getEvaluations();
      setData(res);
      setError(null);
    } catch (err) {
      console.error('Failed to load quality metrics:', err);
      setError('Could not retrieve evaluation results.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const triggerEvaluation = async () => {
    try {
      setEvaluating(true);
      const res = await api.runEvaluation();
      setData(res);
      setError(null);
    } catch (err) {
      console.error('Failed to run evaluation:', err);
      setError('Could not execute benchmark evaluation.');
    } finally {
      setEvaluating(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Excellent': return 'status-badge--excellent';
      case 'Good': return 'status-badge--good';
      default: return 'status-badge--needs-improvement';
    }
  };

  const getPercentageColorClass = (val) => {
    const num = val * 100;
    if (num >= 88) return 'text-excellent';
    if (num >= 80) return 'text-good';
    return 'text-warning';
  };

  if (loading) {
    return (
      <div className="quality-center__loading">
        <div className="spinner"></div>
        <p>Loading AI Quality benchmarks...</p>
      </div>
    );
  }

  const { overall, ragas, trulens, dataset, history, questions } = data || {};

  return (
    <div className="quality-center">
      {/* Page Header */}
      <div className="quality-center__header">
        <div>
          <h1 className="quality-center__title">AI Quality Center</h1>
          <p className="quality-center__subtitle">
            Systematic benchmarking, RAG fidelity metrics, and model hallucination checks from RAGAS and TruLens frameworks.
          </p>
        </div>
        <button 
          onClick={triggerEvaluation} 
          disabled={evaluating} 
          className="quality-center__run-btn"
        >
          {evaluating ? (
            <>
              <RefreshCw className="icon-spin" size={16} />
              Evaluating Benchmark...
            </>
          ) : (
            <>
              <Play size={16} />
              Run Benchmark Evaluation
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="quality-center__error-banner">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main KPI Cards Section */}
      <div className="quality-center__kpis">
        {/* KPI 1: Overall Quality Score */}
        <div className="quality-card kpi-card-overall">
          <div className="kpi-card-overall__circle">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path className="circle-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path className="circle"
                strokeDasharray={`${overall?.score || 0}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="percentage">{overall?.score || 0}%</div>
          </div>
          <div className="kpi-card-overall__content">
            <span className="kpi-label">Overall AI Quality Score</span>
            <div className={`status-badge ${getStatusBadgeClass(overall?.status)}`}>
              {overall?.status}
            </div>
            <p className="kpi-desc">Combined average score of RAGAS & TruLens evaluations.</p>
          </div>
        </div>

        {/* KPI 2: Status Overview */}
        <div className="quality-card kpi-stats-grid">
          <div className="stat-item">
            <div className="stat-icon-wrapper blue">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <span className="stat-label">Benchmark Questions</span>
              <h3 className="stat-value">{overall?.totalBenchmarkQuestions || 0}</h3>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon-wrapper purple">
              <Layers size={20} />
            </div>
            <div>
              <span className="stat-label">Knowledge Base</span>
              <h3 className="stat-value">{overall?.knowledgeBaseVersion || 'N/A'}</h3>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon-wrapper green">
              <Calendar size={20} />
            </div>
            <div>
              <span className="stat-label">Last Evaluated</span>
              <h3 className="stat-value">{overall?.lastEvaluationDate || 'N/A'}</h3>
            </div>
          </div>
        </div>

        {/* KPI 3: Dataset Summary */}
        <div className="quality-card dataset-summary-card">
          <div className="card-header-small">
            <ShieldCheck size={18} className="text-primary" />
            <h3>Dataset & Frameworks</h3>
          </div>
          <div className="dataset-details">
            <div className="detail-row">
              <span>Frameworks:</span>
              <strong>{overall?.frameworks?.join(' & ') || 'N/A'}</strong>
            </div>
            <div className="detail-row">
              <span>Dataset Version:</span>
              <strong>{dataset?.version || 'N/A'}</strong>
            </div>
            <div className="detail-row">
              <span>Documents Evaluated:</span>
              <strong>{dataset?.evaluatedDocuments || 0} PDFs</strong>
            </div>
            <div className="detail-row">
              <span>Timestamp:</span>
              <span className="timestamp-small">
                {dataset?.timestamp ? new Date(dataset.timestamp).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RAGAS & TruLens Metrics Breakdown */}
      <div className="quality-center__metrics-grid">
        {/* RAGAS Section */}
        <div className="quality-card metrics-card">
          <div className="metrics-card__title-bar">
            <div className="flex-items-center">
              <Sparkles className="icon-ragas" size={20} />
              <h2>RAGAS Evaluation</h2>
            </div>
            <span className="badge-tag">Retrieval Augmented Generation Assessment</span>
          </div>
          <p className="metrics-card__description">
            Evaluates the quality of retrieved contexts and how accurately the LLM answers queries based on those contexts.
          </p>

          <div className="progress-list">
            <div className="progress-item">
              <div className="progress-info">
                <span className="metric-name">Faithfulness</span>
                <span className={`metric-score ${getPercentageColorClass(ragas?.faithfulness)}`}>
                  {Math.round((ragas?.faithfulness || 0) * 100)}%
                </span>
              </div>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: `${(ragas?.faithfulness || 0) * 100}%` }}></div>
              </div>
              <span className="metric-desc">Are the generated statements fully grounded in the retrieved documents? (Hallucination check)</span>
            </div>

            <div className="progress-item">
              <div className="progress-info">
                <span className="metric-name">Answer Relevancy</span>
                <span className={`metric-score ${getPercentageColorClass(ragas?.answerRelevancy)}`}>
                  {Math.round((ragas?.answerRelevancy || 0) * 100)}%
                </span>
              </div>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: `${(ragas?.answerRelevancy || 0) * 100}%` }}></div>
              </div>
              <span className="metric-desc">Does the answer address the question directly without containing redundant details?</span>
            </div>

            <div className="progress-item">
              <div className="progress-info">
                <span className="metric-name">Context Precision</span>
                <span className={`metric-score ${getPercentageColorClass(ragas?.contextPrecision)}`}>
                  {Math.round((ragas?.contextPrecision || 0) * 100)}%
                </span>
              </div>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: `${(ragas?.contextPrecision || 0) * 100}%` }}></div>
              </div>
              <span className="metric-desc">Are the relevant document chunks ranked higher in retrieved context?</span>
            </div>

            <div className="progress-item">
              <div className="progress-info">
                <span className="metric-name">Context Recall</span>
                <span className={`metric-score ${getPercentageColorClass(ragas?.contextRecall)}`}>
                  {Math.round((ragas?.contextRecall || 0) * 100)}%
                </span>
              </div>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: `${(ragas?.contextRecall || 0) * 100}%` }}></div>
              </div>
              <span className="metric-desc">Did the hybrid search retrieve all the required information to answer?</span>
            </div>

            {ragas?.contextEntityRecall !== undefined && (
              <div className="progress-item">
                <div className="progress-info">
                  <span className="metric-name">Context Entity Recall</span>
                  <span className={`metric-score ${getPercentageColorClass(ragas?.contextEntityRecall)}`}>
                    {Math.round((ragas?.contextEntityRecall || 0) * 100)}%
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-bar" style={{ width: `${(ragas?.contextEntityRecall || 0) * 100}%` }}></div>
                </div>
                <span className="metric-desc">How well does the system capture key financial/economic entities mentioned?</span>
              </div>
            )}
          </div>
        </div>

        {/* TruLens Section */}
        <div className="quality-card metrics-card">
          <div className="metrics-card__title-bar">
            <div className="flex-items-center">
              <BarChart2 className="icon-trulens" size={20} />
              <h2>TruLens Evaluation</h2>
            </div>
            <span className="badge-tag">LLM Feedback Loop</span>
          </div>
          <p className="metrics-card__description">
            Validates outputs via the TruLens triad (Groundedness, Answer Relevance, Context Relevance) along with cost/latency metrics.
          </p>

          <div className="progress-list">
            <div className="progress-item">
              <div className="progress-info">
                <span className="metric-name">Groundedness</span>
                <span className={`metric-score ${getPercentageColorClass(trulens?.groundedness)}`}>
                  {Math.round((trulens?.groundedness || 0) * 100)}%
                </span>
              </div>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: `${(trulens?.groundedness || 0) * 100}%` }}></div>
              </div>
              <span className="metric-desc">Percentage of the response content that is directly supported by context source documents.</span>
            </div>

            <div className="progress-item">
              <div className="progress-info">
                <span className="metric-name">Answer Relevance</span>
                <span className={`metric-score ${getPercentageColorClass(trulens?.answerRelevance)}`}>
                  {Math.round((trulens?.answerRelevance || 0) * 100)}%
                </span>
              </div>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: `${(trulens?.answerRelevance || 0) * 100}%` }}></div>
              </div>
              <span className="metric-desc">Fidelity checking of response matches back to prompt requirements.</span>
            </div>

            <div className="progress-item">
              <div className="progress-info">
                <span className="metric-name">Context Relevance</span>
                <span className={`metric-score ${getPercentageColorClass(trulens?.contextRelevance)}`}>
                  {Math.round((trulens?.contextRelevance || 0) * 100)}%
                </span>
              </div>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: `${(trulens?.contextRelevance || 0) * 100}%` }}></div>
              </div>
              <span className="metric-desc">Are the retrieved chunks actually relevant, minimizing LLM noise?</span>
            </div>

            {/* Latency & Cost Indicators */}
            <div className="tru-meta-grid">
              <div className="tru-meta-item">
                <span className="tru-meta-label">Avg Query Latency</span>
                <h4 className="tru-meta-value">{trulens?.latency || 0}s</h4>
                <span className="tru-meta-desc">Time from query to generation</span>
              </div>
              <div className="tru-meta-item">
                <span className="tru-meta-label">Avg Cost per Request</span>
                <h4 className="tru-meta-value">${trulens?.cost?.toFixed(4) || '0.0000'}</h4>
                <span className="tru-meta-desc">Gemini Token usage charges</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="quality-card history-card">
        <div className="history-card__header">
          <div className="flex-items-center">
            <Clock size={18} className="text-muted" />
            <h2>Benchmark Run History</h2>
          </div>
          <span className="history-desc">Performance trajectory over code iterations</span>
        </div>

        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Version</th>
                <th>Benchmark Size</th>
                <th>RAGAS Avg</th>
                <th>TruLens Avg</th>
                <th>Overall Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history?.map((run, idx) => (
                <tr key={`${run.version}-${idx}`}>
                  <td>{run.date}</td>
                  <td>
                    <span className="version-tag">{run.version}</span>
                  </td>
                  <td>{run.questionsCount} Questions</td>
                  <td>{run.ragasAverage}%</td>
                  <td>{run.trulensAverage}%</td>
                  <td>
                    <strong className={getPercentageColorClass(run.overallScore / 100)}>
                      {run.overallScore}%
                    </strong>
                  </td>
                  <td>
                    <span className={`status-pill ${getStatusBadgeClass(run.status)}`}>
                      {run.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Benchmark Dataset & Ground Truth Section */}
      {questions && questions.length > 0 && (
        <div className="quality-card questions-card">
          <div className="questions-card__header">
            <div className="flex-items-center">
              <ClipboardCheck size={18} className="text-primary" />
              <h2>Benchmark Evaluation Dataset</h2>
            </div>
            <span className="questions-desc">Reference ground truth dataset used to check LLM and retrieval performance</span>
          </div>
          
          <div className="questions-list">
            {questions.map((q, idx) => (
              <div className="question-item" key={idx}>
                <div className="question-item__q">
                  <span className="q-badge">Q{idx + 1}</span>
                  <h3>{q.question}</h3>
                </div>
                <div className="question-item__details">
                  <div className="detail-block">
                    <h4>Ideal Context (Expected Retrieval Source)</h4>
                    <p>{q.ideal_context}</p>
                  </div>
                  <div className="detail-block">
                    <h4>Expected Answer / Ground Truth (Expected Generation)</h4>
                    <p>{q.expected_answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
