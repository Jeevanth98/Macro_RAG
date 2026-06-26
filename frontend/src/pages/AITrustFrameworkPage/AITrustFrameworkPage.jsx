import React from 'react';
import { 
  ShieldCheck, 
  Search, 
  Eye, 
  ClipboardCheck, 
  BarChart2, 
  Activity, 
  Users, 
  AlertCircle,
  MessageSquare,
  Database,
  FileText,
  Cpu,
  Gauge,
  Link,
  CheckSquare,
  ChevronDown
} from 'lucide-react';
import './AITrustFrameworkPage.css';

export default function AITrustFrameworkPage() {
  return (
    <div className="trust-page">
      {/* Page Header */}
      <div className="trust-page__header">
        <div>
          <h1 className="trust-page__title">🛡 AI Trust Framework</h1>
          <p className="trust-page__subtitle">Enterprise AI Trust & Governance Framework</p>
        </div>
      </div>

      <div className="trust-framework">
        
        {/* ROW 1: Enterprise AI Trust Status (Full width) */}
        <div className="trust-status-card">
          <h3 className="trust-status-title">Enterprise AI Trust Status</h3>
          <div className="trust-status-grid">
            <div className="trust-status-subcard">
              <span className="trust-status-label">Overall Framework Status</span>
              <span className="trust-status-value status-operational">🟢 Operational</span>
            </div>
            <div className="trust-status-subcard">
              <span className="trust-status-label">Framework Health</span>
              <span className="trust-status-value status-health">Excellent</span>
            </div>
          </div>
          <div className="trust-checklist-grid">
            <div className="trust-checklist-item">
              <span className="trust-check-icon">✓</span>
              <span className="trust-check-text">Hybrid RAG</span>
              <span className="trust-status-badge active">Active</span>
            </div>
            <div className="trust-checklist-item">
              <span className="trust-check-icon">✓</span>
              <span className="trust-check-text">Confidence Engine</span>
              <span className="trust-status-badge active">Active</span>
            </div>
            <div className="trust-checklist-item">
              <span className="trust-check-icon">✓</span>
              <span className="trust-check-text">Source Attribution</span>
              <span className="trust-status-badge active">Active</span>
            </div>
            <div className="trust-checklist-item">
              <span className="trust-check-icon">✓</span>
              <span className="trust-check-text">LangSmith Observability</span>
              <span className="trust-status-badge connected">Connected</span>
            </div>
            <div className="trust-checklist-item">
              <span className="trust-check-icon">✓</span>
              <span className="trust-check-text">RAGAS Evaluation</span>
              <span className="trust-status-badge enabled">Enabled</span>
            </div>
            <div className="trust-checklist-item">
              <span className="trust-check-icon">✓</span>
              <span className="trust-check-text">TruLens Evaluation</span>
              <span className="trust-status-badge enabled">Enabled</span>
            </div>
            <div className="trust-checklist-item">
              <span className="trust-check-icon">✓</span>
              <span className="trust-check-text">Human Approval Workflow</span>
              <span className="trust-status-badge enabled">Enabled</span>
            </div>
            <div className="trust-checklist-item">
              <span className="trust-check-icon">✓</span>
              <span className="trust-check-text">Knowledge Base</span>
              <span className="trust-status-badge indexed">Indexed</span>
            </div>
          </div>
        </div>

        {/* ROW 2: Enterprise Trust Layers (Left) | Enterprise Workflow (Right) */}
        <div className="trust-dashboard-row-two">
          {/* Section 2: Enterprise Trust Layers (Left) */}
          <div className="trust-dashboard-col-left">
            <h2 className="trust-layers-title">Enterprise Trust Layers</h2>
            <div className="trust-layers-compact-grid">
              {/* Layer 1 */}
              <div className="trust-layer-card">
                <div className="trust-layer-header">
                  <div className="trust-layer-icon">
                    <Search size={20} />
                  </div>
                  <div className="trust-layer-title-wrapper">
                    <h3>📚 Retrieval & Evidence Layer</h3>
                    <span className="trust-card-status-badge active">🟢 Active</span>
                  </div>
                </div>
                <div className="trust-layer-badges">
                  <span className="trust-layer-badge">Hybrid RAG</span>
                  <span className="trust-layer-badge">BM25</span>
                  <span className="trust-layer-badge">ChromaDB</span>
                  <span className="trust-layer-badge">Reciprocal Rank Fusion (RRF)</span>
                </div>
                <p className="trust-layer-purpose">
                  <strong>Purpose:</strong> Ground AI responses using enterprise knowledge before generation.
                </p>
              </div>

              {/* Layer 2 */}
              <div className="trust-layer-card">
                <div className="trust-layer-header">
                  <div className="trust-layer-icon">
                    <Eye size={20} />
                  </div>
                  <div className="trust-layer-title-wrapper">
                    <h3>🔍 Transparency Layer</h3>
                    <span className="trust-card-status-badge active">🟢 Active</span>
                  </div>
                </div>
                <div className="trust-layer-badges">
                  <span className="trust-layer-badge">Source Attribution</span>
                </div>
                <p className="trust-layer-purpose">
                  <strong>Purpose:</strong> Improve transparency by allowing users to trace grounded responses back to supporting documents whenever retrieval is used.
                </p>
              </div>

              {/* Layer 3 */}
              <div className="trust-layer-card">
                <div className="trust-layer-header">
                  <div className="trust-layer-icon">
                    <ClipboardCheck size={20} />
                  </div>
                  <div className="trust-layer-title-wrapper">
                    <h3>📊 AI Quality & Evaluation Layer</h3>
                    <span className="trust-card-status-badge enabled">🟣 Enabled</span>
                  </div>
                </div>
                <div className="trust-layer-badges">
                  <span className="trust-layer-badge">RAGAS</span>
                  <span className="trust-layer-badge">TruLens</span>
                </div>
                <p className="trust-layer-purpose">
                  <strong>Purpose:</strong> Continuously evaluate retrieval quality, relevance, faithfulness, and overall AI response quality.
                </p>
              </div>

              {/* Layer 4 */}
              <div className="trust-layer-card">
                <div className="trust-layer-header">
                  <div className="trust-layer-icon">
                    <BarChart2 size={20} />
                  </div>
                  <div className="trust-layer-title-wrapper">
                    <h3>📈 Confidence Assessment Layer</h3>
                    <span className="trust-card-status-badge active">🟢 Active</span>
                  </div>
                </div>
                <div className="trust-layer-badges">
                  <span className="trust-layer-badge">Enterprise Confidence Engine</span>
                </div>
                <p className="trust-layer-purpose">
                  <strong>Purpose:</strong> Provide dynamic confidence assessments to help users better understand the reliability of AI-generated responses.
                </p>
              </div>

              {/* Layer 5 */}
              <div className="trust-layer-card">
                <div className="trust-layer-header">
                  <div className="trust-layer-icon">
                    <Activity size={20} />
                  </div>
                  <div className="trust-layer-title-wrapper">
                    <h3>🔬 AI Observability Layer</h3>
                    <span className="trust-card-status-badge connected">🔵 Connected</span>
                  </div>
                </div>
                <div className="trust-layer-badges">
                  <span className="trust-layer-badge">LangSmith</span>
                </div>
                <p className="trust-layer-purpose">
                  <strong>Purpose:</strong> Enable production-grade observability, execution tracing, debugging, and monitoring across the AI pipeline.
                </p>
              </div>

              {/* Layer 6 */}
              <div className="trust-layer-card">
                <div className="trust-layer-header">
                  <div className="trust-layer-icon">
                    <Users size={20} />
                  </div>
                  <div className="trust-layer-title-wrapper">
                    <h3>👤 Human Governance Layer</h3>
                    <span className="trust-card-status-badge enabled">🟣 Enabled</span>
                  </div>
                </div>
                <div className="trust-layer-badges">
                  <span className="trust-layer-badge">Human Approval Workflow</span>
                </div>
                <p className="trust-layer-purpose">
                  <strong>Purpose:</strong> Support Human-in-the-Loop validation for sensitive workflows requiring human review before operational use.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Enterprise AI Workflow (Right) */}
          <div className="trust-dashboard-col-right">
            <h2 className="trust-workflow-title">Enterprise AI Workflow</h2>
            <div className="trust-workflow-vertical">
              <div className="trust-workflow-step-vertical">
                <div className="trust-workflow-icon-vertical"><MessageSquare size={18} /></div>
                <div className="trust-workflow-content-vertical">
                  <span className="trust-workflow-name">User Query</span>
                </div>
              </div>
              <div className="trust-workflow-connector-vertical"><ChevronDown size={14} /></div>

              <div className="trust-workflow-step-vertical">
                <div className="trust-workflow-icon-vertical"><Database size={18} /></div>
                <div className="trust-workflow-content-vertical">
                  <span className="trust-workflow-name">Hybrid Retrieval</span>
                </div>
              </div>
              <div className="trust-workflow-connector-vertical"><ChevronDown size={14} /></div>

              <div className="trust-workflow-step-vertical">
                <div className="trust-workflow-icon-vertical"><FileText size={18} /></div>
                <div className="trust-workflow-content-vertical">
                  <span className="trust-workflow-name">Evidence Collection</span>
                </div>
              </div>
              <div className="trust-workflow-connector-vertical"><ChevronDown size={14} /></div>

              <div className="trust-workflow-step-vertical">
                <div className="trust-workflow-icon-vertical"><Cpu size={18} /></div>
                <div className="trust-workflow-content-vertical">
                  <span className="trust-workflow-name">Gemini Analysis</span>
                </div>
              </div>
              <div className="trust-workflow-connector-vertical"><ChevronDown size={14} /></div>

              <div className="trust-workflow-step-vertical">
                <div className="trust-workflow-icon-vertical"><Gauge size={18} /></div>
                <div className="trust-workflow-content-vertical">
                  <span className="trust-workflow-name">Confidence Assessment</span>
                </div>
              </div>
              <div className="trust-workflow-connector-vertical"><ChevronDown size={14} /></div>

              <div className="trust-workflow-step-vertical">
                <div className="trust-workflow-icon-vertical"><Link size={18} /></div>
                <div className="trust-workflow-content-vertical">
                  <span className="trust-workflow-name">Source Attribution</span>
                </div>
              </div>
              <div className="trust-workflow-connector-vertical"><ChevronDown size={14} /></div>

              <div className="trust-workflow-step-vertical">
                <div className="trust-workflow-icon-vertical"><ShieldCheck size={18} /></div>
                <div className="trust-workflow-content-vertical">
                  <span className="trust-workflow-name">AI Trust Framework</span>
                </div>
              </div>
              <div className="trust-workflow-connector-vertical"><ChevronDown size={14} /></div>

              <div className="trust-workflow-step-vertical">
                <div className="trust-workflow-icon-vertical"><CheckSquare size={18} /></div>
                <div className="trust-workflow-content-vertical">
                  <span className="trust-workflow-name">Enterprise Decision Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: Why AI Trust Framework (Full width) */}
        <div className="trust-intro-card">
          <div className="trust-highlight-panel">
            <p className="trust-highlight-title">
              <strong>Why an AI Trust Framework?</strong>
            </p>
            <p>
              Large Language Models are powerful reasoning systems, but they are not infallible. They can occasionally generate incomplete, outdated, or unsupported information, particularly when operating without reliable evidence.
            </p>
            <p>
              Macro_RAG is designed to minimize this risk by grounding responses in enterprise knowledge, continuously evaluating AI quality, monitoring system behaviour, and providing transparent confidence and source information. While no AI system can guarantee perfect accuracy, our framework is designed to improve reliability and provide users with the context needed to make informed decisions.
            </p>
          </div>
          <p className="trust-intro-text" style={{ marginTop: '1.25rem' }}>
            Macro_RAG implements a multi-layer AI Trust Framework designed to improve the reliability, transparency, explainability, and governance of AI-assisted decision making. Rather than relying solely on a Large Language Model, the platform combines enterprise retrieval, continuous evaluation, observability, confidence assessment, source attribution, and human oversight to support trustworthy responses. This layered architecture helps reduce the likelihood of unsupported AI-generated information while providing users with greater visibility into how every response is produced.
          </p>
        </div>

        {/* ROW 4: Enterprise AI Principles (Left) | Platform Metadata (Right) */}
        <div className="trust-dashboard-row-four">
          {/* Section 5: Enterprise AI Principles */}
          <div className="trust-dashboard-col-left">
            <div className="trust-principles-card">
              <h3 className="trust-principles-title">Enterprise AI Principles</h3>
              <div className="trust-principles-badges">
                <span className="trust-principle-badge">Transparency</span>
                <span className="trust-principle-badge">Explainability</span>
                <span className="trust-principle-badge">Grounded Responses</span>
                <span className="trust-principle-badge">Traceability</span>
                <span className="trust-principle-badge">Observability</span>
                <span className="trust-principle-badge">Continuous Evaluation</span>
                <span className="trust-principle-badge">Human Governance</span>
                <span className="trust-principle-badge">Responsible AI</span>
              </div>
            </div>
          </div>

          {/* Section 6: Platform Metadata */}
          <div className="trust-dashboard-col-right">
            <div className="trust-metadata-card">
              <h3 className="trust-metadata-title">Enterprise Platform Metadata</h3>
              <div className="trust-table-wrapper">
                <table className="trust-metadata-table">
                  <tbody>
                    <tr>
                      <td>Platform</td>
                      <td>Macro_RAG Enterprise</td>
                    </tr>
                    <tr>
                      <td>Platform Version</td>
                      <td>v2.1</td>
                    </tr>
                    <tr>
                      <td>Trust Framework</td>
                      <td>v1.0</td>
                    </tr>
                    <tr>
                      <td>Knowledge Base</td>
                      <td>India Macro KB v2.3</td>
                    </tr>
                    <tr>
                      <td>Retrieval Engine</td>
                      <td>Hybrid RAG (BM25, ChromaDB, Reciprocal Rank Fusion)</td>
                    </tr>
                    <tr>
                      <td>Evaluation</td>
                      <td>RAGAS, TruLens</td>
                    </tr>
                    <tr>
                      <td>Observability</td>
                      <td>LangSmith</td>
                    </tr>
                    <tr>
                      <td>Deployment</td>
                      <td>Docker</td>
                    </tr>
                    <tr>
                      <td>Last Updated</td>
                      <td>June 2026</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 5: Responsible AI Statement (Full width) */}
        <div className="trust-notice-panel">
          <div className="trust-notice-header">
            <AlertCircle size={18} />
            <span>Responsible AI Statement</span>
          </div>
          <p className="trust-notice-text">
            AI is a decision-support technology, not a decision-maker. While Macro_RAG incorporates multiple trust mechanisms designed to improve reliability and reduce the probability of unsupported or hallucinated responses, no AI system can guarantee complete accuracy. Users should validate critical financial, economic, legal, or strategic decisions using official publications and professional judgment. The AI Trust Framework is intended to support informed decision-making by increasing transparency, explainability, and confidence—not by replacing human expertise.
          </p>
        </div>

        {/* ROW 6: Platform Evolution (Full width) */}
        <div className="trust-evolution-card">
          <h3 className="trust-evolution-title">Platform Evolution</h3>
          <div className="trust-evolution-lists">
            <div className="trust-evolution-section">
              <h4 className="trust-evolution-subtitle">Completed Capabilities</h4>
              <ul className="trust-evolution-list completed">
                <li><span className="trust-evo-bullet completed">✔</span> Executive Dashboard</li>
                <li><span className="trust-evo-bullet completed">✔</span> Hybrid RAG</li>
                <li><span className="trust-evo-bullet completed">✔</span> LangSmith</li>
                <li><span className="trust-evo-bullet completed">✔</span> AI Quality Center</li>
                <li><span className="trust-evo-bullet completed">✔</span> Confidence Engine</li>
                <li><span className="trust-evo-bullet completed">✔</span> Human Approval</li>
                <li><span className="trust-evo-bullet completed">✔</span> Innovation Exchange</li>
                <li><span className="trust-evo-bullet completed">✔</span> AI Trust Framework</li>
              </ul>
            </div>
            <div className="trust-evolution-section">
              <h4 className="trust-evolution-subtitle">Future Roadmap</h4>
              <ul className="trust-evolution-list planned">
                <li><span className="trust-evo-bullet planned">⬜</span> GraphRAG</li>
                <li><span className="trust-evo-bullet planned">⬜</span> LangGraph</li>
                <li><span className="trust-evo-bullet planned">⬜</span> Authentication</li>
                <li><span className="trust-evo-bullet planned">⬜</span> RBAC</li>
                <li><span className="trust-evo-bullet planned">⬜</span> CI/CD</li>
                <li><span className="trust-evo-bullet planned">⬜</span> Advanced Monitoring</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Executive Summary Statement */}
        <div className="trust-executive-summary">
          <strong>Framework Objective:</strong> The objective of the AI Trust Framework is not to claim that AI is always correct, but to make AI-generated responses more transparent, explainable, measurable, and accountable. By combining retrieval, evaluation, observability, confidence assessment, and governance, Macro_RAG provides multiple layers of validation that help users better understand the strengths and limitations of every AI response.
        </div>

        {/* Closing Statement */}
        <div className="trust-closing-statement">
          <strong>Our objective is not to encourage users to trust AI blindly. Our objective is to provide sufficient evidence, transparency, observability, and governance so users can make informed decisions about when—and how much—to trust each AI-generated response.</strong>
        </div>
      </div>
    </div>
  );
}
