import React, { useState } from 'react';
import { FileText, Sparkles, Download, X, Printer } from 'lucide-react';
import { api } from '../../services/api';
import ConfidenceDisplay from '../../components/common/ConfidenceDisplay';
import './ReportsPage.css';

const REPORTS = [
  { id: 1, title: 'Global Macro Outlook Q3 2024', type: 'Quarterly', date: 'May 1, 2024' },
  { id: 2, title: 'US Inflation Dynamics: Deep Dive', type: 'Thematic', date: 'Apr 15, 2024' },
  { id: 3, title: 'Emerging Markets Vulnerability Index', type: 'Monitor', date: 'Apr 10, 2024' },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  const [reportConfig, setReportConfig] = useState({
    topic: '',
    includeSummary: true,
    includeCitations: true,
    includeCharts: true,
    includeTable: true
  });

  const handleGenerateClick = () => {
    setShowConfigModal(true);
  };

  const handleGenerateConfirm = async (e) => {
    e.preventDefault();
    setShowConfigModal(false);
    setIsGenerating(true);
    try {
      const report = await api.generateReport(reportConfig);
      setSelectedReport(report);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleView = (rep) => {
    let mockContent = '';
    
    if (rep.title.includes('Global Macro Outlook')) {
      mockContent = `
        <h2>Global Macro Outlook</h2>
        <p>This comprehensive quarterly report provides our baseline economic forecasts and scenarios for major global markets.</p>
        
        <h3 style="color: var(--brand-color); margin-top: 24px; margin-bottom: 12px;">GDP Growth Projections</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr style="background-color: var(--bg-secondary); border-bottom: 2px solid var(--border-color);">
            <th style="padding: 12px; text-align: left;">Region</th>
            <th style="padding: 12px; text-align: left;">2023 Actual</th>
            <th style="padding: 12px; text-align: left;">2024 Forecast</th>
            <th style="padding: 12px; text-align: left;">2025 Forecast</th>
          </tr>
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 12px;">Global</td><td style="padding: 12px;">3.2%</td><td style="padding: 12px;">3.1%</td><td style="padding: 12px;">3.2%</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 12px;">Advanced Economies</td><td style="padding: 12px;">1.6%</td><td style="padding: 12px;">1.7%</td><td style="padding: 12px;">1.8%</td>
          </tr>
          <tr>
            <td style="padding: 12px;">Emerging Markets</td><td style="padding: 12px;">4.3%</td><td style="padding: 12px;">4.2%</td><td style="padding: 12px;">4.2%</td>
          </tr>
        </table>
        
        <h3 style="color: var(--brand-color); margin-top: 24px; margin-bottom: 12px;">Central Bank Policy Stance</h3>
        <p>We expect a gradual easing cycle to commence in late 2024, led by the ECB and followed by the Federal Reserve. However, the terminal rates are expected to settle higher than the pre-pandemic neutral rates, signaling a structural shift to a "higher for longer" regime.</p>
      `;
    } else if (rep.title.includes('Inflation')) {
      mockContent = `
        <h2>US Inflation Dynamics: A Deep Dive</h2>
        <p>Analyzing the underlying components of the Consumer Price Index (CPI) and Personal Consumption Expenditures (PCE) to determine the stickiness of current inflationary pressures.</p>
        
        <h3 style="color: var(--brand-color); margin-top: 24px; margin-bottom: 12px;">The Core Services Disconnect</h3>
        <p>While headline inflation has moderated primarily due to favorable base effects in energy and core goods deflation, <strong>Supercore Inflation</strong> (Core Services ex-Housing) remains stubbornly elevated at an annualized rate of 4.2%.</p>
        
        <ul style="margin-top: 12px; margin-bottom: 24px;">
          <li style="margin-bottom: 8px;"><strong>Housing/Shelter:</strong> Leading indicators such as asking rents have plummeted, but this is operating with a significant lag in official statistics.</li>
          <li style="margin-bottom: 8px;"><strong>Auto Insurance & Transportation:</strong> Showing massive double-digit YoY increases, serving as the primary upward driver in recent prints.</li>
          <li style="margin-bottom: 8px;"><strong>Medical Care:</strong> Showing signs of re-acceleration after changes to health insurance index methodologies.</li>
        </ul>
        
        <p><strong>Conclusion:</strong> The "last mile" of disinflation to the 2% target will be the most difficult, likely requiring a more pronounced cooling of the labor market.</p>
      `;
    } else {
      mockContent = `
        <h2>Emerging Markets Vulnerability Index</h2>
        <p>An assessment of sovereign risk profiles across the EM universe in a high-interest-rate environment.</p>
        
        <h3 style="color: var(--brand-color); margin-top: 24px; margin-bottom: 12px;">High-Risk Jurisdictions</h3>
        <p>Frontier markets with high external financing requirements and low FX reserves are facing acute distress. Several nations are currently engaging with the IMF for debt restructuring programs.</p>
        
        <h3 style="color: var(--brand-color); margin-top: 24px; margin-bottom: 12px;">Resilient Markets</h3>
        <p>Conversely, major emerging markets in Latin America (e.g., Brazil, Mexico) have benefited from proactive and aggressive monetary tightening cycles initiated well ahead of the Federal Reserve. They now boast high real yields, attracting significant carry trade inflows and strengthening their currencies.</p>
      `;
    }

    setSelectedReport({
      ...rep,
      content: mockContent
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Intelligence Reports</h1>
          <p className="page-subtitle">Access deep-dive PDF reports and AI-generated summaries.</p>
        </div>
        <button className="btn btn--primary" onClick={handleGenerateClick} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : <><Sparkles size={16} /> Generate AI Report</>}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5 print-hide">
        {REPORTS.map(rep => (
          <div key={rep.id} className="card hover-lift flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="avatar-icon bg-brand-light text-brand"><FileText size={20} /></div>
              <span className="badge">{rep.type}</span>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">{rep.title}</h3>
              <p className="text-muted text-sm">{rep.date}</p>
            </div>
            <button className="btn btn--secondary mt-auto" onClick={() => handleView(rep)}>
              <FileText size={14} /> View & Export
            </button>
          </div>
        ))}
      </div>

      {selectedReport && (
        <div className="report-viewer-overlay">
          <div className="report-viewer-modal">
            <div className="report-viewer-header print-hide">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <FileText size={24} className="text-brand" />
                <div>
                  <h2 style={{ fontSize: 18, marginBottom: 0 }}>{selectedReport.title}</h2>
                  <span className="text-muted" style={{ fontSize: 13 }}>Generated on {selectedReport.date}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn--primary" onClick={handlePrint}>
                  <Printer size={16} /> Export to PDF
                </button>
                <button className="btn btn--ghost" onClick={() => setSelectedReport(null)}>
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="report-viewer-content print-content">
              <div className="report-cover">
                <h1>{selectedReport.title}</h1>
                <p>Hexaware Global Macro Intelligence</p>
                <p className="report-date">{selectedReport.date}</p>
                {selectedReport.confidence && (
                  <div style={{ maxWidth: 400, margin: '20px auto 0 auto', textAlign: 'left' }} className="print-hide">
                    <ConfidenceDisplay confidence={selectedReport.confidence} />
                  </div>
                )}
              </div>
              <div className="report-body" dangerouslySetInnerHTML={{ __html: selectedReport.content }} />
            </div>
          </div>
        </div>
      )}

      {showConfigModal && (
        <div className="report-viewer-overlay">
          <div className="report-viewer-modal" style={{ maxWidth: 500, padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, margin: 0 }}>Configure AI Report</h2>
              <button className="btn btn--ghost" onClick={() => setShowConfigModal(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleGenerateConfirm} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Report Topic</label>
                <input 
                  type="text" 
                  value={reportConfig.topic} 
                  onChange={e => setReportConfig({...reportConfig, topic: e.target.value})}
                  placeholder="e.g., Global Macroeconomic Outlook" 
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 6, background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  required
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={reportConfig.includeSummary} onChange={e => setReportConfig({...reportConfig, includeSummary: e.target.checked})} />
                  Executive Summary
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={reportConfig.includeCitations} onChange={e => setReportConfig({...reportConfig, includeCitations: e.target.checked})} />
                  Include Citations
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={reportConfig.includeCharts} onChange={e => setReportConfig({...reportConfig, includeCharts: e.target.checked})} />
                  Include Charts
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={reportConfig.includeTable} onChange={e => setReportConfig({...reportConfig, includeTable: e.target.checked})} />
                  Data Tables
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button type="button" className="btn btn--secondary" onClick={() => setShowConfigModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary"><Sparkles size={16} /> Generate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
