import React, { useState } from 'react';
import { Search, Filter, Download, Activity, Globe, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FullscreenModal from '../../components/ui/FullscreenModal';
import AreaChartComponent from '../../components/charts/AreaChart';
import { api } from '../../services/api';
import './IndicatorsPage.css';

const MAJOR_COUNTRIES = [
  "United States", "China", "Germany", "Japan", "India", 
  "United Kingdom", "France", "Brazil", "Italy", "Canada", 
  "Australia", "Mexico", "South Korea", "Spain", "Indonesia"
];

const INDICATORS = [
  { id: 1, name: 'Real GDP Growth', category: 'National Accounts', source: 'World Bank', frequency: 'Quarterly', coverage: '190+ Countries' },
  { id: 2, name: 'Consumer Price Index (CPI)', category: 'Prices', source: 'IMF', frequency: 'Monthly', coverage: '180+ Countries' },
  { id: 3, name: 'Policy Interest Rate', category: 'Monetary', source: 'BIS', frequency: 'Daily', coverage: '60+ Countries' },
  { id: 4, name: 'Unemployment Rate', category: 'Labor', source: 'ILO', frequency: 'Monthly', coverage: '150+ Countries' },
  { id: 5, name: 'Current Account Balance', category: 'External', source: 'World Bank', frequency: 'Quarterly', coverage: '180+ Countries' },
  { id: 6, name: 'Government Debt to GDP', category: 'Fiscal', source: 'IMF', frequency: 'Annual', coverage: '170+ Countries' },
  { id: 7, name: 'Manufacturing PMI', category: 'Leading', source: 'S&P Global', frequency: 'Monthly', coverage: '40+ Countries' },
];

export default function IndicatorsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Analysis Feature State
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [isFetching, setIsFetching] = useState(false);

  const handleAnalyzeClick = (indicator) => {
    setSelectedIndicator(indicator);
    setIsCountryModalOpen(true);
  };

  const handleCountrySelect = async (country) => {
    setIsCountryModalOpen(false);
    setSelectedCountry(country);
    setIsFetching(true);
    setIsAnalysisModalOpen(true);
    setChartData([]); // Clear previous data
    
    try {
      const data = await api.getSeries(country, selectedIndicator.name);
      setChartData(data);
    } catch (err) {
      console.error("Failed to fetch analysis data:", err);
    } finally {
      setIsFetching(false);
    }
  };

  const handleExport = () => {
    const blob = new Blob(["Indicator Name,Category,Source,Frequency,Coverage\n" + INDICATORS.map(i => `${i.name},${i.category},${i.source},${i.frequency},${i.coverage}`).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hexaware-indicators.csv';
    a.click();
  };

  const handleFilter = () => {
    alert('Category filtering is disabled in this demo environment.');
  };

  const filteredIndicators = INDICATORS.filter(ind => ind.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="indicators-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Indicators Library</h1>
          <p className="page-subtitle">Browse and analyze over 10M+ macroeconomic time series.</p>
        </div>
      </div>

      <div className="indicators-toolbar">
        <div className="search-box">
          <Search size={18} className="text-muted" />
          <input 
            type="text" 
            placeholder="Search indicators (e.g. Core CPI, M2 Money Supply)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn--secondary" onClick={handleFilter}><Filter size={16} /> Filter by Category</button>
        <button className="btn btn--secondary" onClick={handleExport}><Download size={16} /> Export Catalog</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="data-table indicators-table">
          <thead>
            <tr>
              <th>Indicator Name</th>
              <th>Category</th>
              <th>Source</th>
              <th>Frequency</th>
              <th>Coverage</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredIndicators.map(ind => (
              <tr key={ind.id}>
                <td className="font-semibold text-brand">{ind.name}</td>
                <td><span className="badge">{ind.category}</span></td>
                <td>{ind.source}</td>
                <td>{ind.frequency}</td>
                <td>{ind.coverage}</td>
                <td><button className="btn btn--secondary btn--sm" onClick={() => handleAnalyzeClick(ind)}>Analyze</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Country Selection Modal */}
      <FullscreenModal 
        isOpen={isCountryModalOpen} 
        onClose={() => setIsCountryModalOpen(false)}
        title={`Select Country for Analysis: ${selectedIndicator?.name}`}
      >
        <div style={{ padding: '20px 0', maxWidth: 800, margin: '0 auto' }}>
          <p style={{ marginBottom: 24, color: 'var(--text-muted)' }}>
            Choose a major economy to generate a complete historical analysis for {selectedIndicator?.name}.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16 }}>
            {MAJOR_COUNTRIES.map(country => (
              <button 
                key={country}
                onClick={() => handleCountrySelect(country)}
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  color: 'var(--text-color)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#6D5DFC';
                  e.currentTarget.style.backgroundColor = 'rgba(109, 93, 252, 0.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-color)';
                }}
              >
                <Globe size={16} className="text-muted" />
                {country}
              </button>
            ))}
          </div>
        </div>
      </FullscreenModal>

      {/* Analysis Results Modal */}
      <FullscreenModal 
        isOpen={isAnalysisModalOpen} 
        onClose={() => setIsAnalysisModalOpen(false)}
        title={`${selectedIndicator?.name} Analysis - ${selectedCountry}`}
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 24, padding: '10px 0' }}>
          <div style={{ display: 'flex', gap: 24 }}>
            <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ padding: 12, backgroundColor: 'rgba(109, 93, 252, 0.1)', borderRadius: 12 }}>
                <Activity size={24} color="#6D5DFC" />
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Latest Value</p>
                <h3 style={{ fontSize: 24, margin: 0 }}>
                  {isFetching ? '...' : (chartData.length > 0 ? chartData[chartData.length - 1].value + (selectedIndicator?.name.includes('Growth') || selectedIndicator?.name.includes('Rate') || selectedIndicator?.name.includes('CPI') ? '%' : '') : 'N/A')}
                </h3>
              </div>
            </div>
            
            <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ padding: 12, backgroundColor: 'rgba(18, 185, 129, 0.1)', borderRadius: 12 }}>
                <TrendingUp size={24} color="#12B981" />
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>15-Year Average</p>
                <h3 style={{ fontSize: 24, margin: 0 }}>
                  {isFetching || chartData.length === 0 ? '...' : 
                    (chartData.reduce((acc, curr) => acc + curr.value, 0) / chartData.length).toFixed(2) + (selectedIndicator?.name.includes('Growth') || selectedIndicator?.name.includes('Rate') || selectedIndicator?.name.includes('CPI') ? '%' : '')
                  }
                </h3>
              </div>
            </div>
          </div>

          <div className="card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: 16 }}>Historical Trend (15 Years)</h3>
            <div style={{ flex: 1, minHeight: 0 }}>
              {isFetching ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                  Analyzing dataset...
                </div>
              ) : (
                chartData.length > 0 && (
                  <AreaChartComponent 
                    data={chartData} 
                    xKey="year" 
                    dataKey="value" 
                    name={selectedIndicator?.name} 
                    color="#6D5DFC" 
                    gradientId="analysisGrad" 
                    height="100%"
                  />
                )
              )}
            </div>
          </div>
        </div>
      </FullscreenModal>
    </div>
  );
}
