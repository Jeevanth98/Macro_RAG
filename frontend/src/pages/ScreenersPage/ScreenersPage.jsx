import React, { useState } from 'react';
import { Filter, SlidersHorizontal, Plus, Download, Play, X, AlertCircle } from 'lucide-react';

const MOCK_COUNTRIES = [
  { id: 1, country: 'United States', gdp: 2.5, cpi: 3.4, policy: 5.50, pmi: 50.9 },
  { id: 2, country: 'China', gdp: 5.2, cpi: 0.3, policy: 3.45, pmi: 50.4 },
  { id: 3, country: 'India', gdp: 7.8, cpi: 4.8, policy: 6.50, pmi: 59.1 },
  { id: 4, country: 'Germany', gdp: -0.1, cpi: 2.4, policy: 4.50, pmi: 42.5 },
  { id: 5, country: 'United Kingdom', gdp: 0.6, cpi: 2.3, policy: 5.25, pmi: 49.1 },
  { id: 6, country: 'Japan', gdp: 0.9, cpi: 2.8, policy: 0.10, pmi: 49.6 },
  { id: 7, country: 'Brazil', gdp: 2.9, cpi: 3.9, policy: 10.50, pmi: 52.8 },
  { id: 8, country: 'Mexico', gdp: 2.4, cpi: 4.6, policy: 11.00, pmi: 51.0 },
  { id: 9, country: 'Canada', gdp: 1.1, cpi: 2.7, policy: 5.00, pmi: 49.3 },
  { id: 10, country: 'Australia', gdp: 1.5, cpi: 3.6, policy: 4.35, pmi: 49.6 },
  { id: 11, country: 'France', gdp: 0.7, cpi: 2.2, policy: 4.50, pmi: 45.3 },
  { id: 12, country: 'Italy', gdp: 0.6, cpi: 0.8, policy: 4.50, pmi: 47.3 },
  { id: 13, country: 'South Korea', gdp: 2.3, cpi: 2.9, policy: 3.50, pmi: 50.9 },
  { id: 14, country: 'Spain', gdp: 2.1, cpi: 3.3, policy: 4.50, pmi: 52.2 },
  { id: 15, country: 'Indonesia', gdp: 5.0, cpi: 2.8, policy: 6.25, pmi: 52.7 },
  { id: 16, country: 'Vietnam', gdp: 5.1, cpi: 3.1, policy: 4.50, pmi: 50.4 },
];

const INDICATOR_MAP = {
  'gdp': 'GDP Growth (%)',
  'cpi': 'CPI YoY (%)',
  'policy': 'Policy Rate (%)',
  'pmi': 'Mfg PMI'
};

export default function ScreenersPage() {
  const [conditions, setConditions] = useState([]);
  const [results, setResults] = useState([]);
  const [hasRun, setHasRun] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCondition, setNewCondition] = useState({
    indicator: 'gdp',
    operator: '>',
    value: ''
  });

  const handleAddCondition = (e) => {
    e.preventDefault();
    if (newCondition.value === '') return;
    
    setConditions([...conditions, { ...newCondition }]);
    setIsModalOpen(false);
    setNewCondition({ indicator: 'gdp', operator: '>', value: '' });
  };

  const handleRemoveCondition = (index) => {
    const newConds = [...conditions];
    newConds.splice(index, 1);
    setConditions(newConds);
    setHasRun(false); // require re-run
  };

  const handleRunScreener = () => {
    if (conditions.length === 0) {
      setResults([]);
      setHasRun(true);
      return;
    }

    const filtered = MOCK_COUNTRIES.filter(country => {
      return conditions.every(cond => {
        const countryVal = country[cond.indicator];
        const targetVal = parseFloat(cond.value);
        if (isNaN(targetVal)) return false;
        
        if (cond.operator === '>') return countryVal > targetVal;
        if (cond.operator === '<') return countryVal < targetVal;
        if (cond.operator === '=') return countryVal === targetVal;
        return false;
      });
    });

    const scored = filtered.map(c => {
       // Generate a mock score based on deviation to represent match quality
       let score = 100;
       conditions.forEach(cond => {
          const val = c[cond.indicator];
          const target = parseFloat(cond.value);
          const diff = Math.abs(val - target);
          score -= diff * 1.5; 
       });
       score = Math.min(100, Math.max(60, Math.round(score)));
       return { ...c, score: `${score}/100` };
    }).sort((a, b) => parseInt(b.score) - parseInt(a.score));

    setResults(scored);
    setHasRun(true);
  };

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="page-header">
        <div>
          <h1 className="page-title">Macro Screeners</h1>
          <p className="page-subtitle">Build complex queries to filter economies by key indicators.</p>
        </div>
        <button className="btn btn--primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> New Condition
        </button>
      </div>

      {/* Active Filters */}
      <div className="card">
        <div className="flex align-center justify-between" style={{ marginBottom: 16 }}>
          <h3 className="flex align-center gap-2">
            <SlidersHorizontal size={18} /> Active Criteria
          </h3>
          <div className="flex gap-2">
            <button className="btn btn--secondary btn--sm" disabled={results.length === 0}>
              <Download size={14} /> Export
            </button>
            <button className="btn btn--primary btn--sm" onClick={handleRunScreener}>
              <Play size={14} /> Run Screener
            </button>
          </div>
        </div>
        
        {conditions.length === 0 ? (
          <p className="text-muted text-sm">No active conditions. Click "New Condition" to get started.</p>
        ) : (
          <div className="flex gap-3 flex-wrap">
            {conditions.map((cond, idx) => (
              <div key={idx} className="badge flex align-center gap-2" style={{ padding: '6px 12px', background: 'var(--brand-light)' }}>
                {INDICATOR_MAP[cond.indicator]} {cond.operator} {cond.value}
                <button 
                  onClick={() => handleRemoveCondition(idx)} 
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--brand-color)' }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button className="btn btn--ghost btn--sm" style={{ padding: '6px 12px' }} onClick={() => setIsModalOpen(true)}>
              <Plus size={14} /> Add Another
            </button>
          </div>
        )}
      </div>

      {/* Results Table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto', minHeight: 200 }}>
        {!hasRun ? (
          <div className="flex flex-col align-center justify-center" style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Filter size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
            <h3 style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>Ready to Screen</h3>
            <p className="text-sm">Add conditions and click "Run Screener" to see matches.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col align-center justify-center" style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <AlertCircle size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
            <h3 style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>No Matches Found</h3>
            <p className="text-sm">Try broadening your criteria.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Country</th>
                <th>GDP Growth</th>
                <th>CPI YoY</th>
                <th>Policy Rate</th>
                <th>Mfg PMI</th>
                <th>Match Score</th>
              </tr>
            </thead>
            <tbody>
              {results.map(res => (
                <tr key={res.id}>
                  <td className="font-semibold text-brand">{res.country}</td>
                  <td className={res.gdp < 0 ? "text-warning" : "text-success"}>{res.gdp > 0 ? '+' : ''}{res.gdp}%</td>
                  <td>{res.cpi}%</td>
                  <td>{res.policy.toFixed(2)}%</td>
                  <td className={res.pmi < 50 ? "text-warning" : ""}>{res.pmi}</td>
                  <td><span className="badge bg-success-light text-success">{res.score}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Condition Modal */}
      {isModalOpen && (
        <div className="report-viewer-overlay" style={{ zIndex: 100 }}>
          <div className="report-viewer-modal" style={{ maxWidth: 400, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Add Screener Condition</h3>
              <button className="btn btn--ghost" style={{ padding: 4 }} onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleAddCondition} className="flex flex-col gap-4">
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500 }}>Indicator</label>
                <select 
                  className="w-full"
                  style={{ padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 6, background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  value={newCondition.indicator}
                  onChange={(e) => setNewCondition({...newCondition, indicator: e.target.value})}
                >
                  <option value="gdp">GDP Growth (%)</option>
                  <option value="cpi">CPI YoY (%)</option>
                  <option value="policy">Policy Rate (%)</option>
                  <option value="pmi">Manufacturing PMI</option>
                </select>
              </div>
              
              <div className="flex gap-4">
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500 }}>Operator</label>
                  <select 
                    className="w-full"
                    style={{ padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 6, background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    value={newCondition.operator}
                    onChange={(e) => setNewCondition({...newCondition, operator: e.target.value})}
                  >
                    <option value=">">Greater Than (&gt;)</option>
                    <option value="<">Less Than (&lt;)</option>
                    <option value="=">Equals (=)</option>
                  </select>
                </div>
                
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500 }}>Value</label>
                  <input 
                    type="number"
                    step="0.1"
                    placeholder="e.g. 2.5"
                    required
                    className="w-full"
                    style={{ padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 6, background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    value={newCondition.value}
                    onChange={(e) => setNewCondition({...newCondition, value: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" className="btn btn--secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary">Add Condition</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
