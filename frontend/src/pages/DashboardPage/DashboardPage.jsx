import React, { useState, useEffect } from 'react';
import { Settings2, ArrowRight, CalendarDays, ExternalLink, Maximize2 } from 'lucide-react';
import KPICard from '../../components/widgets/KPICard';
import InsightCard from '../../components/widgets/InsightCard';
import CopilotWidget from '../../components/widgets/CopilotWidget';
import AreaChartComponent from '../../components/charts/AreaChart';
import WorldMap from '../../components/charts/WorldMap';
import FullscreenModal from '../../components/ui/FullscreenModal';
import { api } from '../../services/api';
import './DashboardPage.css';

const events = [
  { date: 'MAY 15', title: 'US Retail Sales MoM', time: '12:30 PM GMT' },
  { date: 'MAY 16', title: 'Euro Area CPI YoY Final', time: '10:00 AM GMT' },
  { date: 'MAY 17', title: 'China GDP Growth YoY', time: '03:00 AM GMT' },
];

const dataSources = [
  { name: '500+', label: 'Data Sources' },
  { name: '200+', label: 'Countries' },
  { name: '10M+', label: 'Time Series' },
  { name: '1MIN', label: 'Data Latency' },
];

const sourceLogos = ['IMF', 'WORLD BANK', 'OECD', 'BIS', 'Eurostat', 'UN Comtrade', '& More'];

export default function DashboardPage() {
  const [tooltipContent, setTooltipContent] = useState("");
  const [kpiData, setKpiData] = useState([]);
  const [fullChartData, setFullChartData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [chartRange, setChartRange] = useState('5Y');
  const [insights, setInsights] = useState([]);
  const [mapData, setMapData] = useState([]);
  const [mapIndicator, setMapIndicator] = useState('GDP Growth');
  const [watchlistData, setWatchlistData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullscreenChart, setFullscreenChart] = useState(null); // 'main', 'map', 'yield'

  useEffect(() => {
    async function loadData() {
      try {
        const [kpis, ch, ins, mp, wl] = await Promise.all([
          api.getDashboardKPIs(),
          api.getDashboardChart(),
          api.getDashboardInsights(),
          api.getDashboardMap(mapIndicator),
          api.getWatchlist()
        ]);
        setKpiData(kpis);
        setFullChartData(ch);
        filterChartData(ch, chartRange);
        setInsights(ins);
        setMapData(mp);
        setWatchlistData(wl);
      } catch (e) {
        console.error("Failed to load dashboard data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function updateMap() {
      try {
        const mp = await api.getDashboardMap(mapIndicator);
        setMapData(mp);
      } catch (e) {
        console.error("Failed to load map data:", e);
      }
    }
    updateMap();
  }, [mapIndicator]);

  const filterChartData = (data, range) => {
    if (!data || data.length === 0) return;
    let sliceLen = data.length;
    switch (range) {
      case '1Y': sliceLen = 250; break;
      case '3Y': sliceLen = 750; break;
      case '5Y': sliceLen = 1250; break;
      case '10Y': sliceLen = 2500; break;
      case 'ALL': sliceLen = data.length; break;
    }
    setChartData(data.slice(-sliceLen));
  };

  const handleRangeChange = (range) => {
    setChartRange(range);
    filterChartData(fullChartData, range);
  };

  return (
    <div className="dashboard">
      {/* ── Section 1: Welcome ────────────────────────────────────── */}
      <div className="dashboard__welcome">
        <div>
          <h1 className="dashboard__greeting">Good morning, Monish 👋</h1>
          <p className="dashboard__subtitle">Global markets at a glance. AI-driven insights for smarter decisions.</p>
        </div>
        <button className="btn btn--ghost">
          <Settings2 size={16} /> Customize
        </button>
      </div>

      {/* ── Section 2: KPI Cards ──────────────────────────────────── */}
      <div className="dashboard__kpis stagger-children">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="kpi-card" style={{ opacity: 0.5 }}>Loading...</div>
          ))
        ) : (
          kpiData.map((kpi, i) => (
            <KPICard
              key={i}
              title={kpi.title}
              period={kpi.period}
              value={kpi.value}
              subtitle={kpi.subtitle}
              trend={kpi.trend}
              sparklineData={kpi.sparkline}
              sparklineColor={kpi.sparklineColor}
              className="animate-fade-in-up"
            />
          ))
        )}
      </div>

      {/* ── Section 3: Main Chart + AI Copilot + Insights ─────────── */}
      <div className="dashboard__main-row">
        {/* Chart Area */}
        <div className="dashboard__chart-section">
          <div className="dashboard__chart-card">
            <div className="dashboard__chart-header">
              <div className="dashboard__chart-title">
                <h3>Global Benchmark Trend</h3>
                <span className="dashboard__chart-info">ⓘ</span>
                <button className="btn btn--icon" onClick={() => setFullscreenChart('main')} style={{ marginLeft: 8 }} aria-label="Fullscreen">
                  <Maximize2 size={16} />
                </button>
              </div>
              <div className="dashboard__chart-controls">
                {['1Y', '3Y', '5Y', '10Y', 'ALL'].map((range) => (
                  <button 
                    key={range} 
                    className={`dashboard__range-btn ${range === chartRange ? 'dashboard__range-btn--active' : ''}`}
                    onClick={() => handleRangeChange(range)}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            
            {chartData.length > 0 ? (
              <AreaChartComponent
                data={chartData}
                xKey="year"
                dataKey="value"
                color="#6D5DFC"
                height={320}
                showForecast={false}
                name="Value"
              />
            ) : (
              <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                {loading ? 'Loading Chart...' : 'No Chart Data'}
              </div>
            )}
          </div>
        </div>

        {/* AI Copilot */}
        <div className="dashboard__copilot-section">
          <CopilotWidget />
        </div>

        {/* Right Sidebar: Insights + Events */}
        <div className="dashboard__right-sidebar">
          <div className="dashboard__insights-panel">
            <div className="dashboard__panel-header">
              <h4>Recent Insights</h4>
            </div>
            {insights.map((insight, i) => (
              <InsightCard key={i} {...insight} />
            ))}
            <a href="/copilot" className="dashboard__view-all">
              View All Insights <ArrowRight size={14} />
            </a>
          </div>

          <div className="dashboard__events-panel">
            <div className="dashboard__panel-header">
              <h4>Upcoming Events</h4>
              <a href="/calendar" className="text-brand" style={{ fontSize: 13 }}>View Calendar <ArrowRight size={12} /></a>
            </div>
            {events.map((event, i) => (
              <div key={i} className="dashboard__event-item">
                <div className="dashboard__event-date">
                  <span className="dashboard__event-month">{event.date.split(' ')[0]}</span>
                  <span className="dashboard__event-day">{event.date.split(' ')[1]}</span>
                </div>
                <div className="dashboard__event-info">
                  <span className="dashboard__event-title">{event.title}</span>
                  <span className="dashboard__event-time">{event.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 4: Bottom Row ─────────────────────────────────── */}
      <div className="dashboard__bottom-row">
        {/* Macro Heatmap */}
        <div className="dashboard__bottom-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="dashboard__panel-header" style={{ marginBottom: 8 }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Macro Heatmap
              {tooltipContent && <span style={{ fontSize: 12, color: '#6D5DFC', fontWeight: 'bold' }}>{tooltipContent}</span>}
              <button className="btn btn--icon" onClick={() => setFullscreenChart('map')} style={{ marginLeft: 'auto' }} aria-label="Fullscreen">
                <Maximize2 size={16} />
              </button>
            </h4>
            <select className="dashboard__select" value={mapIndicator} onChange={(e) => setMapIndicator(e.target.value)}>
              <option value="GDP Growth">GDP Growth</option>
              <option value="Inflation">Inflation</option>
              <option value="Unemployment">Unemployment</option>
            </select>
          </div>
          <div className="dashboard__map-placeholder" style={{ background: 'transparent', flex: 1, padding: 0 }}>
            {mapData.length > 0 ? (
              <WorldMap data={mapData} setTooltipContent={setTooltipContent} />
            ) : (
               <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                {loading ? 'Loading Map...' : 'No Map Data'}
              </div>
            )}
            <div className="dashboard__map-gradient" style={{ position: 'absolute', bottom: 10 }}>
              <span>{'< -2%'}</span>
              <span>-2%</span>
              <span>0%</span>
              <span>2%</span>
              <span>{'> 4%'}</span>
            </div>
          </div>
        </div>

        {/* Yield Curve */}
        <div className="dashboard__bottom-card">
          <div className="dashboard__panel-header">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Yield Curve — United States
              <button className="btn btn--icon" onClick={() => setFullscreenChart('yield')} style={{ marginLeft: 'auto' }} aria-label="Fullscreen">
                <Maximize2 size={16} />
              </button>
            </h4>
            <div className="dashboard__yield-legend">
              <span>● Now</span>
              <span style={{ color: 'var(--text-muted)' }}>● 1M Ago</span>
            </div>
          </div>
          <div className="dashboard__yield-placeholder">
            <svg viewBox="-30 0 430 200" width="100%" height="160">
              {/* Grid and Y-axis */}
              <text x="-25" y="44" fill="#94A3B8" fontSize="11">5.5%</text>
              <line x1="10" y1="40" x2="380" y2="40" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
              
              <text x="-25" y="99" fill="#94A3B8" fontSize="11">5.0%</text>
              <line x1="10" y1="95" x2="380" y2="95" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
              
              <text x="-25" y="154" fill="#94A3B8" fontSize="11">4.5%</text>
              <line x1="10" y1="150" x2="380" y2="150" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />

              <path d="M 20 150 Q 80 130 120 110 Q 180 80 250 60 Q 320 45 380 40" fill="none" stroke="#6D5DFC" strokeWidth="2.5" />
              <path d="M 20 140 Q 80 125 120 115 Q 180 100 250 90 Q 320 80 380 75" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="5 3" />
              
              {/* X-axis labels */}
              <text x="20" y="195" fill="#94A3B8" fontSize="11">3M</text>
              <text x="60" y="195" fill="#94A3B8" fontSize="11">6M</text>
              <text x="110" y="195" fill="#94A3B8" fontSize="11">1Y</text>
              <text x="160" y="195" fill="#94A3B8" fontSize="11">2Y</text>
              <text x="220" y="195" fill="#94A3B8" fontSize="11">5Y</text>
              <text x="280" y="195" fill="#94A3B8" fontSize="11">10Y</text>
              <text x="350" y="195" fill="#94A3B8" fontSize="11">30Y</text>
            </svg>
          </div>
        </div>

        {/* Cross-Asset Impact + Watchlist */}
        <div className="dashboard__bottom-card dashboard__watchlist-card">
          <div className="dashboard__panel-header" style={{ marginBottom: 8 }}>
            <h4>Watchlist</h4>
            <span className="dashboard__watchlist-badge">★</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Indicator</th>
                <th>Country/Region</th>
                <th>Latest</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {watchlistData.map((row, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{row.indicator}</td>
                  <td>{row.country}</td>
                  <td style={{ fontWeight: 600 }}>{row.latest}</td>
                  <td className={row.changeType === 'up' ? 'trend-up' : row.changeType === 'down' ? 'trend-down' : 'trend-neutral'}>
                    {row.change}
                  </td>
                </tr>
              ))}
              {watchlistData.length === 0 && !loading && (
                <tr><td colSpan="4" style={{textAlign: 'center', color: '#94A3B8'}}>No watchlist data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 5: Data Sources Banner ────────────────────────── */}
      <div className="dashboard__sources-banner">
        <div className="dashboard__sources-left">
          <span className="dashboard__sources-label">DATA.</span>
          <span className="dashboard__sources-label dashboard__sources-label--bold">EVERYWHERE.</span>
        </div>
        <div className="dashboard__sources-stats">
          {dataSources.map((src, i) => (
            <div key={i} className="dashboard__source-stat">
              <span className="dashboard__source-value">{src.name}</span>
              <span className="dashboard__source-label">{src.label}</span>
            </div>
          ))}
        </div>
        <div className="dashboard__sources-logos">
          {sourceLogos.map((logo, i) => (
            <span key={i} className="dashboard__source-logo">{logo}</span>
          ))}
        </div>
      </div>

      {/* Fullscreen Modals */}
      <FullscreenModal 
        isOpen={fullscreenChart === 'main'} 
        onClose={() => setFullscreenChart(null)}
        title="Global Benchmark Trend"
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="dashboard__chart-controls" style={{ alignSelf: 'flex-end', marginBottom: 16 }}>
            {['1Y', '3Y', '5Y', '10Y', 'ALL'].map((range) => (
              <button 
                key={range} 
                className={`dashboard__range-btn ${range === chartRange ? 'dashboard__range-btn--active' : ''}`}
                onClick={() => handleRangeChange(range)}
              >
                {range}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            {chartData.length > 0 && (
              <AreaChartComponent
                data={chartData}
                xKey="year"
                dataKey="value"
                color="#6D5DFC"
                height="100%"
                showForecast={false}
                name="Value"
              />
            )}
          </div>
        </div>
      </FullscreenModal>

      <FullscreenModal 
        isOpen={fullscreenChart === 'map'} 
        onClose={() => setFullscreenChart(null)}
        title={`Macro Heatmap - ${mapIndicator}`}
      >
        <div style={{ height: '100%', position: 'relative' }}>
          {tooltipContent && <div style={{ position: 'absolute', top: 0, left: 0, fontSize: 16, color: '#6D5DFC', fontWeight: 'bold', zIndex: 10 }}>{tooltipContent}</div>}
          <div style={{ height: 'calc(100% - 40px)' }}>
            {mapData.length > 0 ? (
              <WorldMap data={mapData} setTooltipContent={setTooltipContent} />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                {loading ? 'Loading Map...' : 'No Map Data'}
              </div>
            )}
          </div>
          <div className="dashboard__map-gradient" style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)' }}>
            <span>{'< -2%'}</span>
            <span>-2%</span>
            <span>0%</span>
            <span>2%</span>
            <span>{'> 4%'}</span>
          </div>
        </div>
      </FullscreenModal>

      <FullscreenModal 
        isOpen={fullscreenChart === 'yield'} 
        onClose={() => setFullscreenChart(null)}
        title="Yield Curve — United States"
      >
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="-30 0 430 200" width="80%" height="80%" style={{ maxHeight: 600 }}>
            {/* Grid and Y-axis */}
            <text x="-25" y="44" fill="#94A3B8" fontSize="11">5.5%</text>
            <line x1="10" y1="40" x2="380" y2="40" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
            
            <text x="-25" y="99" fill="#94A3B8" fontSize="11">5.0%</text>
            <line x1="10" y1="95" x2="380" y2="95" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
            
            <text x="-25" y="154" fill="#94A3B8" fontSize="11">4.5%</text>
            <line x1="10" y1="150" x2="380" y2="150" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />

            <path d="M 20 150 Q 80 130 120 110 Q 180 80 250 60 Q 320 45 380 40" fill="none" stroke="#6D5DFC" strokeWidth="2.5" />
            <path d="M 20 140 Q 80 125 120 115 Q 180 100 250 90 Q 320 80 380 75" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="5 3" />
            
            {/* X-axis labels */}
            <text x="20" y="195" fill="#94A3B8" fontSize="11">3M</text>
            <text x="60" y="195" fill="#94A3B8" fontSize="11">6M</text>
            <text x="110" y="195" fill="#94A3B8" fontSize="11">1Y</text>
            <text x="160" y="195" fill="#94A3B8" fontSize="11">2Y</text>
            <text x="220" y="195" fill="#94A3B8" fontSize="11">5Y</text>
            <text x="280" y="195" fill="#94A3B8" fontSize="11">10Y</text>
            <text x="350" y="195" fill="#94A3B8" fontSize="11">30Y</text>
          </svg>
        </div>
      </FullscreenModal>
    </div>
  );
}
