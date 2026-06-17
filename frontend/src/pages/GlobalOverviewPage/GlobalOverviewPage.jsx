import React, { useState, useEffect } from 'react';
import KPICard from '../../components/widgets/KPICard';
import AreaChartComponent from '../../components/charts/AreaChart';
import WorldMap from '../../components/charts/WorldMap';
import FullscreenModal from '../../components/ui/FullscreenModal';
import { Download, Filter, Maximize2 } from 'lucide-react';
import { api } from '../../services/api';
import './GlobalOverviewPage.css';

const TABS = ['GDP Growth', 'Inflation', 'Policy Rates', 'Debt', 'Trade'];

const KPIS = [
  { title: 'Global GDP Growth', period: '2024 Forecast', value: '+2.6%', subtitle: 'Steady', trend: 'neutral', sparkline: [2.1, 2.3, 2.0, 2.4, 2.5, 2.6] },
  { title: 'Advanced Economies', period: '2024 Forecast', value: '+1.5%', subtitle: 'Slowing', trend: 'down', sparkline: [2.5, 2.0, 1.8, 1.7, 1.6, 1.5] },
  { title: 'Emerging Markets', period: '2024 Forecast', value: '+4.1%', subtitle: 'Accelerating', trend: 'up', sparkline: [3.8, 3.9, 4.0, 4.0, 4.0, 4.1] },
];

const countryData = [
  { country: "United States", gdp: "+2.5%", inflation: "3.4%", policy: "5.50%", unemp: "3.9%", currentAccount: "-3.0%", debt: "123%" },
  { country: "China", gdp: "+5.2%", inflation: "0.3%", policy: "3.45%", unemp: "5.0%", currentAccount: "+1.5%", debt: "83%" },
  { country: "Germany", gdp: "-0.1%", inflation: "2.4%", policy: "4.50%", unemp: "5.9%", currentAccount: "+5.9%", debt: "64%" },
  { country: "Japan", gdp: "+0.9%", inflation: "2.8%", policy: "0.10%", unemp: "2.6%", currentAccount: "+3.3%", debt: "255%" },
  { country: "India", gdp: "+7.8%", inflation: "4.8%", policy: "6.50%", unemp: "8.1%", currentAccount: "-1.2%", debt: "82%" },
  { country: "United Kingdom", gdp: "+0.6%", inflation: "2.3%", policy: "5.25%", unemp: "4.3%", currentAccount: "-3.3%", debt: "104%" },
  { country: "France", gdp: "+0.7%", inflation: "2.2%", policy: "4.50%", unemp: "7.5%", currentAccount: "-0.6%", debt: "110%" },
  { country: "Brazil", gdp: "+2.9%", inflation: "3.7%", policy: "10.50%", unemp: "7.9%", currentAccount: "-1.3%", debt: "74%" },
  { country: "Italy", gdp: "+0.6%", inflation: "0.8%", policy: "4.50%", unemp: "7.2%", currentAccount: "+0.5%", debt: "137%" },
  { country: "Canada", gdp: "+1.1%", inflation: "2.7%", policy: "5.00%", unemp: "6.1%", currentAccount: "-0.6%", debt: "106%" },
  { country: "Australia", gdp: "+1.5%", inflation: "3.6%", policy: "4.35%", unemp: "3.8%", currentAccount: "+1.2%", debt: "49%" },
  { country: "Mexico", gdp: "+2.4%", inflation: "4.6%", policy: "11.00%", unemp: "2.8%", currentAccount: "-1.4%", debt: "46%" },
  { country: "South Korea", gdp: "+2.3%", inflation: "2.9%", policy: "3.50%", unemp: "2.8%", currentAccount: "+1.3%", debt: "54%" },
  { country: "Spain", gdp: "+2.1%", inflation: "3.3%", policy: "4.50%", unemp: "11.7%", currentAccount: "+2.6%", debt: "107%" },
  { country: "Indonesia", gdp: "+5.0%", inflation: "2.8%", policy: "6.25%", unemp: "5.3%", currentAccount: "+0.2%", debt: "39%" }
];

// Map data is now fetched dynamically from the backend

export default function GlobalOverviewPage() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [tooltipContent, setTooltipContent] = useState("");
  const [chartData, setChartData] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [mapData, setMapData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [chartRes, mapRes] = await Promise.all([
          api.getSeries('Global', activeTab),
          api.getDashboardMap(activeTab)
        ]);
        setChartData(chartRes);
        // Format backend mapData to match what WorldMap expects ({ name, value })
        const formattedMapData = mapRes.map(item => ({
          name: item.country,
          value: item.value
        }));
        setMapData(formattedMapData);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      }
    }
    fetchData();
  }, [activeTab]);

  const handleExport = () => {
    const headers = ['Country', 'GDP Growth', 'Inflation', 'Policy Rate', 'Unemployment', 'Current Account', 'Debt to GDP'];
    const rows = countryData.map(c => [
      c.country, c.gdp, c.inflation, c.policy, c.unemp, c.currentAccount, c.debt
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'global_overview_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="global-overview">
      <div className="page-header">
        <div>
          <h1 className="page-title">Global Overview</h1>
          <p className="page-subtitle">Macroeconomic health across regions and economies.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn--secondary"><Filter size={16} /> Filters</button>
          <button className="btn btn--primary" onClick={handleExport}><Download size={16} /> Export</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(tab => (
          <button 
            key={tab} 
            className={`tab ${activeTab === tab ? 'tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="dashboard__kpis">
        {KPIS.map((kpi, i) => (
          <KPICard key={i} {...kpi} className="span-2" />
        ))}
      </div>

      <div className="dashboard__main-row">
        {/* Main Chart */}
        <div className="dashboard__chart-card" style={{ flex: 2 }}>
          <div className="dashboard__chart-header">
            <h3>{activeTab} Trend Comparison</h3>
            <button className="btn btn--icon" onClick={() => setIsFullscreen(true)} style={{ marginLeft: 'auto' }} aria-label="Fullscreen">
              <Maximize2 size={16} />
            </button>
          </div>
          {chartData.length > 0 ? (
            <AreaChartComponent 
              data={chartData} 
              xKey="year" 
              dataKey="value" 
              name="Global Average" 
              color="#12B981" 
              gradientId="globalGrad" 
            />
          ) : (
            <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
              Loading Data...
            </div>
          )}
        </div>

        {/* Heatmap / Map Placeholder */}
        <div className="dashboard__chart-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="dashboard__chart-header" style={{ marginBottom: 0 }}>
            <h3>Regional Heatmap</h3>
            {tooltipContent && <span style={{ fontSize: 13, fontWeight: 600, color: '#6D5DFC' }}>{tooltipContent}</span>}
          </div>
          <div className="heatmap-placeholder" style={{ background: 'transparent' }}>
            <WorldMap data={mapData} setTooltipContent={setTooltipContent} />
          </div>
        </div>
      </div>

      {/* Regional Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <h3 style={{ marginBottom: 16 }}>Country Breakdown</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Country</th>
              <th>GDP Growth</th>
              <th>Inflation</th>
              <th>Policy Rate</th>
              <th>Unemployment</th>
              <th>Current Account</th>
              <th>Debt to GDP</th>
            </tr>
          </thead>
          <tbody>
            {countryData.map((row, i) => (
              <tr key={i}>
                <td className="font-semibold">{row.country}</td>
                <td className={row.gdp.includes('-') ? "text-warning" : "text-success"}>{row.gdp}</td>
                <td>{row.inflation}</td>
                <td>{row.policy}</td>
                <td>{row.unemp}</td>
                <td className={row.currentAccount.includes('-') ? "text-warning" : "text-success"}>{row.currentAccount}</td>
                <td>{row.debt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fullscreen Chart Modal */}
      <FullscreenModal 
        isOpen={isFullscreen} 
        onClose={() => setIsFullscreen(false)}
        title={`${activeTab} Trend Comparison`}
      >
        <div style={{ height: '100%', minHeight: 400 }}>
          {chartData.length > 0 && (
            <AreaChartComponent 
              data={chartData} 
              xKey="year" 
              dataKey="value" 
              name="Global Average" 
              color="#12B981" 
              gradientId="globalGradFS" 
              height="100%"
            />
          )}
        </div>
      </FullscreenModal>
    </div>
  );
}
