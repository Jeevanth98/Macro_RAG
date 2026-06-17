import React, { useState, useEffect } from 'react';
import { Search, Globe2, ArrowRight, ArrowLeft, TrendingUp, AlertTriangle, Info, CheckSquare, Square, BarChart2 } from 'lucide-react';
import AreaChartComponent from '../../components/charts/AreaChart';
import { api } from '../../services/api';
import './CountriesPage.css';

const COUNTRIES = [
  { id: 'US', name: 'United States', region: 'North America', gdp: '$26.9T', growth: '+2.4%', cpi: '3.4%', rate: '5.50%', risk: 'Low' },
  { id: 'CN', name: 'China', region: 'Asia', gdp: '$17.7T', growth: '+5.3%', cpi: '0.1%', rate: '3.45%', risk: 'Medium' },
  { id: 'JP', name: 'Japan', region: 'Asia', gdp: '$4.2T', growth: '+1.9%', cpi: '2.5%', rate: '0.10%', risk: 'Low' },
  { id: 'DE', name: 'Germany', region: 'Europe', gdp: '$4.4T', growth: '-0.3%', cpi: '2.2%', rate: '4.00%', risk: 'Low' },
  { id: 'IN', name: 'India', region: 'Asia', gdp: '$3.7T', growth: '+7.8%', cpi: '4.8%', rate: '6.50%', risk: 'Medium' },
  { id: 'UK', name: 'United Kingdom', region: 'Europe', gdp: '$3.3T', growth: '+0.1%', cpi: '2.3%', rate: '5.25%', risk: 'Low' },
];

const COUNTRY_DETAILS = {
  'US': {
    pros: ['Deep and highly liquid capital markets', 'Global reserve currency status', 'Innovation-driven tech sector leadership'],
    cons: ['Elevated government debt-to-GDP levels', 'Persistent inflation pressures', 'Political polarization affecting fiscal policy'],
    rationale: 'The US remains the cornerstone of global portfolios, offering unparalleled liquidity and tech sector exposure, though fiscal sustainability warrants long-term monitoring.',
    events: [
      { time: 'Today', text: 'Federal Reserve maintains policy rate at 5.25%-5.50%, citing sticky core inflation.' },
      { time: 'Last Week', text: 'Non-farm payrolls beat expectations, adding 272k jobs and highlighting labor market resilience.' },
      { time: 'Last Month', text: 'Q1 GDP growth revised down slightly to 1.3%, driven by lower consumer spending estimates.' }
    ]
  },
  'CN': {
    pros: ['Massive domestic consumer market', 'Global leader in EV and renewable supply chains', 'Significant policy easing room'],
    cons: ['Ongoing property sector structural challenges', 'Geopolitical and trade tensions', 'Deflationary pressures and weak domestic demand'],
    rationale: 'China offers attractive valuations and policy stimulus potential, but requires careful navigation of geopolitical risks and property sector restructuring.',
    events: [
      { time: 'Today', text: 'PBOC signals potential reserve requirement ratio (RRR) cuts to boost liquidity.' },
      { time: 'Last Week', text: 'Exports surged by 7.6% YoY, driven by strong auto and electronics shipments.' },
      { time: 'Last Month', text: 'Government announces new funding facility to support distressed property developers.' }
    ]
  },
  'JP': {
    pros: ['Corporate governance reforms unlocking shareholder value', 'Negative interest rate policy exit signaling normalization', 'Stable political environment'],
    cons: ['Aging demographics and shrinking workforce', 'High government debt levels (>250% of GDP)', 'Vulnerability to yen volatility'],
    rationale: 'Japan presents a compelling restructuring story with improving corporate returns, though currency risks and demographic headwinds persist.',
    events: [
      { time: 'Today', text: 'Bank of Japan hints at potential rate hikes later this year if inflation holds.' },
      { time: 'Last Week', text: 'Nikkei 225 index reaches record highs, driven by foreign inflows and tech stocks.' },
      { time: 'Last Month', text: 'Ministry of Finance intervenes in FX markets to support the weakening yen.' }
    ]
  },
  'DE': {
    pros: ['Strong manufacturing and export base', 'Fiscally conservative government policies', 'Key anchor of the Eurozone economy'],
    cons: ['Energy transition costs and structural industrial shifts', 'Aging infrastructure and digitalization lags', 'Heavy reliance on global trade'],
    rationale: 'Germany is a cyclical, export-oriented play that stands to benefit from global industrial recovery, but faces near-term structural energy and auto sector challenges.',
    events: [
      { time: 'Today', text: 'Manufacturing PMI misses estimates, indicating continued industrial contraction.' },
      { time: 'Last Week', text: 'Government passes new subsidy package for green energy transition projects.' },
      { time: 'Last Month', text: 'Inflation drops to 2.2%, increasing pressure on the ECB to begin rate cuts.' }
    ]
  },
  'IN': {
    pros: ["World's fastest-growing major economy", 'Favorable demographic dividend', 'Significant infrastructure and manufacturing investments'],
    cons: ['Regulatory complexities and bureaucratic hurdles', 'Vulnerability to global oil price shocks', 'High youth unemployment rates'],
    rationale: 'India is a premier structural growth story with strong demographics and supply-chain diversification benefits, though valuations are currently at a premium.',
    events: [
      { time: 'Today', text: 'RBI holds repo rate at 6.5%, maintaining focus on inflation target.' },
      { time: 'Last Week', text: 'Q4 GDP growth accelerates to 7.8%, driven by robust manufacturing and construction.' },
      { time: 'Last Month', text: 'Foreign direct investment (FDI) rules relaxed in the space and tech sectors.' }
    ]
  },
  'UK': {
    pros: ['Globally competitive financial services sector', 'Attractive equity market valuations vs peers', 'Strong legal and institutional framework'],
    cons: ['Post-Brexit trade frictions and labor shortages', 'Sluggish productivity growth', 'High consumer debt burden'],
    rationale: 'The UK market offers deep value and high dividend yields, making it attractive for income-seeking investors despite near-term macroeconomic sluggishness.',
    events: [
      { time: 'Today', text: 'Bank of England signals readiness to cut rates as inflation hits 2.3%.' },
      { time: 'Last Week', text: 'Retail sales drop unexpectedly due to unusually wet weather.' },
      { time: 'Last Month', text: 'Government announces new tax incentives to boost business investment.' }
    ]
  }
};

const PERFORMANCE_CONTEXT = {
  'GDP Growth YoY': {
    top5: [
      { name: 'India', value: '+7.8%', reason: 'Driven by robust manufacturing, infrastructure investments, and demographic dividend.' },
      { name: 'China', value: '+5.3%', reason: 'Benefiting from strong auto/EV exports despite domestic property sector drags.' },
      { name: 'United States', value: '+2.4%', reason: 'Resilient consumer spending and tight labor markets supporting growth.' },
      { name: 'Brazil', value: '+2.0%', reason: 'Strong agricultural exports and early monetary easing boosting activity.' },
      { name: 'Japan', value: '+1.9%', reason: 'Weak yen boosting export competitiveness and corporate earnings.' }
    ],
    bottom5: [
      { name: 'Germany', value: '-0.3%', reason: 'Industrial contraction and energy transition costs weighing heavily.' },
      { name: 'United Kingdom', value: '+0.1%', reason: 'Post-Brexit trade frictions and sticky inflation dragging productivity.' },
      { name: 'South Africa', value: '+0.4%', reason: 'Persistent power outages and logistics constraints limiting output.' },
      { name: 'Argentina', value: '-2.5%', reason: 'Severe hyperinflation and fiscal austerity measures contracting the economy.' },
      { name: 'Sweden', value: '-0.2%', reason: 'High interest rate sensitivity in the housing market dampening domestic demand.' }
    ]
  },
  'Inflation Rate': {
    top5: [
      { name: 'Argentina', value: '250%', reason: 'Severe macroeconomic imbalances and currency devaluation.' },
      { name: 'Turkey', value: '68%', reason: 'Unorthodox monetary policies and currency depreciation.' },
      { name: 'Egypt', value: '35%', reason: 'Currency devaluations and high import costs.' },
      { name: 'Nigeria', value: '31%', reason: 'Removal of fuel subsidies and currency reforms.' },
      { name: 'Pakistan', value: '20%', reason: 'Energy tariff hikes and IMF program conditions.' }
    ],
    bottom5: [
      { name: 'China', value: '0.1%', reason: 'Deflationary pressures from weak domestic demand and property sector.' },
      { name: 'Thailand', value: '-0.8%', reason: 'Government energy subsidies capping consumer prices.' },
      { name: 'Switzerland', value: '1.2%', reason: 'Strong currency insulating from imported inflation.' },
      { name: 'Japan', value: '2.5%', reason: 'Controlled inflation due to lingering deflationary mindset.' },
      { name: 'Saudi Arabia', value: '2.7%', reason: 'Price controls and strong currency peg.' }
    ]
  },
  'Unemployment Rate': {
    top5: [
      { name: 'Japan', value: '2.6%', reason: 'Aging demographics leading to structural labor shortages.' },
      { name: 'South Korea', value: '2.8%', reason: 'Strong manufacturing base and low birth rates tightening labor supply.' },
      { name: 'Switzerland', value: '4.1%', reason: 'Highly skilled workforce and flexible labor market policies.' },
      { name: 'United States', value: '3.9%', reason: 'Resilient service sector and steady job creation despite higher rates.' },
      { name: 'United Kingdom', value: '4.3%', reason: 'Tight labor market dynamics post-Brexit and early retirements.' }
    ],
    bottom5: [
      { name: 'South Africa', value: '32.9%', reason: 'Structural economic challenges, power crises, and skills mismatch.' },
      { name: 'Spain', value: '11.7%', reason: 'Heavy reliance on seasonal tourism and rigid labor regulations.' },
      { name: 'Greece', value: '10.4%', reason: 'Lingering long-term effects of the sovereign debt crisis.' },
      { name: 'Turkey', value: '8.7%', reason: 'Macroeconomic instability and currency depreciation impacting business investment.' },
      { name: 'Brazil', value: '7.8%', reason: 'Uneven economic recovery and large informal labor market segment.' }
    ]
  },
  'Government Debt to GDP': {
    top5: [
      { name: 'Russia', value: '19.7%', reason: 'Sanctions limiting external borrowing and conservative fiscal policy.' },
      { name: 'Saudi Arabia', value: '23.8%', reason: 'Strong oil revenues and massive sovereign wealth buffers.' },
      { name: 'Sweden', value: '31.2%', reason: 'Strict fiscal frameworks and strong public finances.' },
      { name: 'Indonesia', value: '39.0%', reason: 'Constitutional fiscal deficit limits and steady commodity export revenues.' },
      { name: 'Switzerland', value: '41.4%', reason: 'Fiscal debt brake rule strictly limiting public deficits.' }
    ],
    bottom5: [
      { name: 'Japan', value: '255%', reason: 'Decades of fiscal stimulus to combat deflation and support aging population.' },
      { name: 'Greece', value: '160%', reason: 'Legacy of the Eurozone sovereign debt crisis and bailouts.' },
      { name: 'Italy', value: '137%', reason: 'Sluggish long-term growth and persistently high structural deficits.' },
      { name: 'United States', value: '123%', reason: 'Persistent fiscal deficits, pandemic stimulus, and mandatory spending growth.' },
      { name: 'France', value: '110%', reason: 'High public sector spending and extensive social welfare costs.' }
    ]
  }
};

export default function CountriesPage() {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonData, setComparisonData] = useState([]);

  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [rankingIndicator, setRankingIndicator] = useState('GDP Growth YoY');

  useEffect(() => {
    if (selectedCountry) {
      setIsLoading(true);
      const fetchIndicators = async () => {
        try {
          const indicators = ['GDP Growth', 'Inflation Rate', 'Policy Interest Rate', 'Unemployment Rate', 'Current Account', 'Government Debt'];
          const promises = indicators.map(ind => api.getSeries(selectedCountry.name, ind));
          const results = await Promise.all(promises);
          
          const formattedData = indicators.map((title, i) => ({
            title: title + (title.includes('Growth') || title.includes('Rate') || title.includes('Account') || title.includes('Debt') ? ' (%)' : ''),
            data: results[i]
          }));
          setChartData(formattedData);
        } catch (error) {
          console.error("Failed to fetch country data", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchIndicators();
    }
  }, [selectedCountry]);

  const handleViewComparison = async () => {
    setIsComparing(true);
    setIsLoading(true);
    try {
      const indicators = ['GDP Growth', 'Inflation Rate', 'Policy Interest Rate', 'Unemployment Rate'];
      const countries = COUNTRIES.filter(c => selectedForCompare.includes(c.id));
      
      const combinedData = [];
      for (const ind of indicators) {
        const indData = { title: ind, data: [], series: [] };
        let allYears = new Set();
        const colors = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];
        
        const promises = countries.map(c => api.getSeries(c.name, ind));
        const results = await Promise.all(promises);
        
        results.forEach((seriesRes, i) => {
          const c = countries[i];
          indData.series.push({ dataKey: c.id, name: c.name, color: colors[i % colors.length] });
          seriesRes.forEach(item => {
            allYears.add(item.year);
          });
        });
        
        const sortedYears = Array.from(allYears).sort((a,b) => Number(a)-Number(b));
        sortedYears.forEach(y => {
          const yearObj = { year: y };
          results.forEach((seriesRes, i) => {
             const found = seriesRes.find(item => item.year === y);
             if (found) yearObj[countries[i].id] = found.value;
          });
          indData.data.push(yearObj);
        });
        combinedData.push(indData);
      }
      setComparisonData(combinedData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isComparing) {
    return (
      <div className="countries-page">
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => setIsComparing(false)}>
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h1 className="page-title">Comparing Countries</h1>
            <p className="page-subtitle">{COUNTRIES.filter(c => selectedForCompare.includes(c.id)).map(c => c.name).join(', ')}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginTop: 24 }}>
          {isLoading ? (
             <div style={{ gridColumn: 'span 2', padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
               Loading comparison data...
             </div>
          ) : (
            comparisonData.map((ind, idx) => (
              <div key={idx} className="card">
                <h4 style={{ marginBottom: 16 }}>{ind.title}</h4>
                {ind.data && ind.data.length > 0 && (
                  <AreaChartComponent data={ind.data} xKey="year" showForecast={false} height={240} series={ind.series} />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (selectedCountry) {
    const details = COUNTRY_DETAILS[selectedCountry.id];

    return (
      <div className="countries-page">
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => setSelectedCountry(null)}>
            <ArrowLeft size={16} /> Back to Countries
          </button>
          <div>
            <h1 className="page-title">{selectedCountry.name} Economic Profile</h1>
            <p className="page-subtitle">{selectedCountry.region} | GDP: {selectedCountry.gdp} | Risk: {selectedCountry.risk}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 24 }}>
          {isLoading ? (
            <div style={{ gridColumn: 'span 3', padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading macroeconomic series...
            </div>
          ) : (
            chartData.map((ind, idx) => (
              <div key={idx} className="card">
                <h4 style={{ marginBottom: 16, fontSize: 14 }}>{ind.title}</h4>
                {ind.data && ind.data.length > 0 && (
                  <AreaChartComponent data={ind.data} xKey="year" dataKey="value" color="#6D5DFC" height={180} />
                )}
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginTop: 24 }}>
          <div className="card">
            <h3 style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Info size={20} className="text-brand" /> Investment Analysis
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
              <div>
                <h4 style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <TrendingUp size={16} /> Pros of Investing
                </h4>
                <ul style={{ paddingLeft: 20, color: 'var(--text-color)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {details.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                </ul>
              </div>
              <div>
                <h4 style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <AlertTriangle size={16} /> Risks & Cons
                </h4>
                <ul style={{ paddingLeft: 20, color: 'var(--text-color)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {details.cons.map((con, i) => <li key={i}>{con}</li>)}
                </ul>
              </div>
            </div>
            <div style={{ padding: 16, backgroundColor: 'rgba(109, 93, 252, 0.05)', borderRadius: 8, borderLeft: '4px solid #6D5DFC' }}>
              <strong>Investment Rationale:</strong> {details.rationale}
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Recent Economic Events</h3>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {details.events.map((event, i) => (
                <li key={i} style={{ padding: '12px 0', borderBottom: i < details.events.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <strong style={{ color: 'var(--text-color)' }}>{event.time}:</strong> <span style={{ color: 'var(--text-muted)' }}>{event.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="countries-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Country Profiles</h1>
          <p className="page-subtitle">Deep dive into 200+ economies with detailed macro profiles.</p>
        </div>
      </div>

      <div className="indicators-toolbar">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1, minWidth: 250 }}>
            <Search size={18} className="text-muted" />
            <input type="text" placeholder="Search countries (e.g. United States, Brazil)..." style={{ width: '100%' }} />
          </div>
          <select className="countries-filter" value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}>
            <option value="All Regions">All Regions</option>
            <option value="North America">North America</option>
            <option value="Europe">Europe</option>
            <option value="Asia">Asia</option>
          </select>
          <button 
            className={`btn ${compareMode ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => { setCompareMode(!compareMode); setSelectedForCompare([]); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <BarChart2 size={16} /> {compareMode ? 'Cancel Compare' : 'Compare Mode'}
          </button>
          {compareMode && selectedForCompare.length >= 2 && (
            <button className="btn btn--primary" onClick={handleViewComparison}>
              View Comparison ({selectedForCompare.length})
            </button>
          )}
        </div>
      </div>

      <div className="countries-grid">
        {COUNTRIES.filter(c => selectedRegion === 'All Regions' || c.region === selectedRegion).map(country => (
          <div key={country.id} className="country-card hover-lift">
            <div className="country-card__header">
              <div className="country-card__title">
                {compareMode && (
                  <div 
                    onClick={() => {
                       if (selectedForCompare.includes(country.id)) setSelectedForCompare(selectedForCompare.filter(id => id !== country.id));
                       else setSelectedForCompare([...selectedForCompare, country.id]);
                    }}
                    style={{ cursor: 'pointer', marginRight: 8, display: 'flex' }}
                  >
                    {selectedForCompare.includes(country.id) ? <CheckSquare size={18} className="text-brand" /> : <Square size={18} className="text-muted" />}
                  </div>
                )}
                <Globe2 size={20} className="text-brand" />
                <h3>{country.name}</h3>
              </div>
              <span className="badge">{country.region}</span>
            </div>
            
            <div className="country-card__stats">
              <div className="country-stat">
                <span className="stat-label">GDP Size</span>
                <span className="stat-value">{country.gdp}</span>
              </div>
              <div className="country-stat">
                <span className="stat-label">Growth YoY</span>
                <span className={`stat-value ${country.growth.startsWith('+') ? 'text-success' : 'text-danger'}`}>{country.growth}</span>
              </div>
              <div className="country-stat">
                <span className="stat-label">CPI YoY</span>
                <span className="stat-value">{country.cpi}</span>
              </div>
              <div className="country-stat">
                <span className="stat-label">Policy Rate</span>
                <span className="stat-value">{country.rate}</span>
              </div>
            </div>

            <button className="country-card__btn" onClick={() => setSelectedCountry(country)}>
              View Full Profile <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 40, marginBottom: 40 }} className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <h3 style={{ margin: 0 }}>Global Performance Rankings</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Select Indicator:</span>
            <select 
              className="dashboard__select" 
              value={rankingIndicator} 
              onChange={(e) => setRankingIndicator(e.target.value)}
              style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface)', fontWeight: 600 }}
            >
              <option value="GDP Growth YoY">GDP Growth YoY</option>
              <option value="Inflation Rate">Inflation Rate</option>
              <option value="Unemployment Rate">Unemployment Rate</option>
              <option value="Government Debt to GDP">Government Debt to GDP</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div>
            <h4 style={{ color: 'var(--success-color)', marginBottom: 16, fontSize: 16 }}>Top 5 Economies</h4>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {PERFORMANCE_CONTEXT[rankingIndicator].top5.map((item, i) => (
                <li key={i} style={{ padding: '16px 0', borderBottom: i < 4 ? '1px solid var(--border-color)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <strong style={{ fontSize: 15 }}>{item.name}</strong>
                    <strong className="text-success" style={{ fontSize: 15 }}>{item.value}</strong>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.reason}</div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ color: 'var(--danger-color)', marginBottom: 16, fontSize: 16 }}>Bottom 5 Economies</h4>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {PERFORMANCE_CONTEXT[rankingIndicator].bottom5.map((item, i) => (
                <li key={i} style={{ padding: '16px 0', borderBottom: i < 4 ? '1px solid var(--border-color)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <strong style={{ fontSize: 15 }}>{item.name}</strong>
                    <strong className="text-danger" style={{ fontSize: 15 }}>{item.value}</strong>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.reason}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
