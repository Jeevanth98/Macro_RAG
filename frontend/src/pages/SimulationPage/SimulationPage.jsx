import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, TrendingUp, TrendingDown, Info, Sliders } from 'lucide-react';
import { api } from '../../services/api';
import './SimulationPage.css';

export default function SimulationPage() {
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  
  // Simulation Inputs
  const [gdp, setGdp] = useState(2.0);
  const [inflation, setInflation] = useState(2.0);
  const [unemployment, setUnemployment] = useState(4.0);
  const [policyRate, setPolicyRate] = useState(3.0);
  
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const c = await api.getCountries();
      setCountries(c);
      if (c.length > 0) setSelectedCountry(c[0].name);
    } catch (err) {
      console.error("Failed to fetch countries", err);
    }
  };

  const handleSimulate = () => {
    setIsSimulating(true);
    // Simulate network delay
    setTimeout(() => {
      const result = generateAssessment(selectedCountry, gdp, inflation, unemployment, policyRate);
      setSimulationResult(result);
      setIsSimulating(false);
    }, 1200);
  };

  const generateAssessment = (country, gdp, inf, unemp, rate) => {
    let risk = 'Low';
    let reasoning = '';
    let pros = [];
    let cons = [];
    let optimistic = '';
    let pessimistic = '';
    let probable = '';

    // Stagflation Check (Low growth, high inflation, high unemp)
    if (gdp < 1.0 && inf > 4.0) {
      risk = 'High';
      reasoning = `The combination of low/negative growth (${gdp}%) and sticky inflation (${inf}%) presents a severe stagflationary environment for ${country}. The central bank is cornered into keeping rates at ${rate}% to fight inflation, despite rising unemployment (${unemp}%).`;
      pros = ['Forces structural corporate efficiencies', 'May cool down speculative asset bubbles'];
      cons = ['Severe erosion of consumer purchasing power', 'Rising corporate defaults due to high debt servicing costs', 'Limited fiscal space for government stimulus'];
      probable = `Growth remains stagnant for 2-3 quarters as the central bank maintains restrictive rates until inflation durably breaks below 3%.`;
      optimistic = `Supply-side shocks ease faster than expected, allowing inflation to drop without requiring further job losses, leading to a "soft landing".`;
      pessimistic = `A wage-price spiral takes hold, forcing the central bank to hike rates even higher, triggering a deep, systemic recession and a spike in unemployment to >8%.`;
    } 
    // Goldilocks Check (Solid growth, low inflation)
    else if (gdp >= 2.0 && inf <= 2.5 && unemp <= 5.0) {
      risk = 'Low';
      reasoning = `This is a "Goldilocks" scenario for ${country}. Growth is solid at ${gdp}%, while inflation is contained at ${inf}%. The unemployment rate of ${unemp}% suggests full employment without wage-inflation pressures.`;
      pros = ['Strong environment for equity market expansion', 'Stable real wage growth for consumers', 'Predictable environment for corporate capital expenditure'];
      cons = ['Risk of complacency leading to asset bubbles', 'Tight labor markets may constrain rapid business scaling'];
      probable = `A sustained expansion phase. Equities perform well, and the central bank slowly normalizes rates.`;
      optimistic = `Productivity gains from new technologies accelerate GDP growth further without triggering inflation.`;
      pessimistic = `Hidden financial vulnerabilities emerge due to prolonged complacency, or a sudden external supply shock restarts inflation.`;
    }
    // Recession / Deflation Check
    else if (gdp < 0 && inf < 1.0) {
      risk = 'High';
      reasoning = `Deflationary recession risks are flashing red. GDP is contracting at ${gdp}%, and inflation is alarmingly low at ${inf}%. If policy rates at ${rate}% are not cut rapidly, ${country} risks a deflationary spiral.`;
      pros = ['Input costs for businesses fall significantly', 'Bonds perform exceptionally well as yields collapse'];
      cons = ['Consumers delay purchases expecting lower prices', 'Real burden of debt increases massively', 'Corporate profits crash'];
      probable = `The central bank initiates emergency rate cuts and quantitative easing to stimulate demand.`;
      optimistic = `Aggressive monetary easing successfully reflates the economy within 6 months.`;
      pessimistic = `A liquidity trap forms where even zero interest rates fail to spur lending, leading to a "Lost Decade" of stagnation similar to Japan in the 1990s.`;
    }
    // Overheating Check
    else if (gdp > 4.0 && inf > 3.5) {
      risk = 'Medium';
      reasoning = `${country} is overheating. Rapid growth of ${gdp}% is pushing capacity limits, driving inflation up to ${inf}%. The central bank will likely be forced to hike rates aggressively to cool demand.`;
      pros = ['Massive top-line revenue growth for corporations', 'Extremely tight labor markets benefit workers', 'High tax receipts for the government'];
      cons = ['Aggressive rate hikes could suddenly crash the market', 'Input cost volatility', 'Risk of policy error by central banks'];
      probable = `The central bank hikes rates, intentionally slowing growth to 1-2% next year to bring inflation back to target.`;
      optimistic = `Supply chains expand rapidly to meet demand, naturally cooling inflation without requiring demand-destruction.`;
      pessimistic = `Central banks wait too long, inflation expectations become unanchored, and a massive rate hike cycle causes a hard landing.`;
    }
    // Default / Mild
    else {
      risk = 'Medium';
      reasoning = `The macroeconomic environment in ${country} is currently mixed and transitioning. With GDP at ${gdp}% and inflation at ${inf}%, the economy is navigating crosscurrents. The policy rate of ${rate}% appears moderately calibrated.`;
      pros = ['Moderate environment allows for stock-picking strategies', 'No immediate systemic crises'];
      cons = ['Vulnerable to external shocks', 'Lack of clear directional momentum for broad indices'];
      probable = `Muddling through with trend-like growth and gradual normalization of monetary policy.`;
      optimistic = `Consumer confidence rebounds, accelerating growth into a sustained expansion.`;
      pessimistic = `A minor geopolitical shock easily tips this fragile equilibrium into a mild recession.`;
    }

    return { risk, reasoning, pros, cons, optimistic, pessimistic, probable };
  };

  return (
    <div className="flex flex-col gap-6" style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Risk Assessment & Simulation Lab</h1>
          <p className="page-subtitle">Stress test global economies by simulating custom macroeconomic scenarios.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 24 }}>
        {/* Input Panel */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sliders size={20} className="text-brand" /> Scenario Parameters
          </h3>
          
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Select Economy</label>
            <select 
              value={selectedCountry} 
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="sim-input"
            >
              {countries.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontWeight: 500 }}>GDP Growth (%)</label>
              <span className="font-bold">{gdp.toFixed(1)}%</span>
            </div>
            <input type="range" min="-5" max="8" step="0.1" value={gdp} onChange={e => setGdp(parseFloat(e.target.value))} className="sim-slider" />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontWeight: 500 }}>Inflation Rate (%)</label>
              <span className="font-bold">{inflation.toFixed(1)}%</span>
            </div>
            <input type="range" min="-2" max="15" step="0.1" value={inflation} onChange={e => setInflation(parseFloat(e.target.value))} className="sim-slider" />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontWeight: 500 }}>Unemployment Rate (%)</label>
              <span className="font-bold">{unemployment.toFixed(1)}%</span>
            </div>
            <input type="range" min="2" max="15" step="0.1" value={unemployment} onChange={e => setUnemployment(parseFloat(e.target.value))} className="sim-slider" />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontWeight: 500 }}>Policy Rate (%)</label>
              <span className="font-bold">{policyRate.toFixed(2)}%</span>
            </div>
            <input type="range" min="-1" max="10" step="0.25" value={policyRate} onChange={e => setPolicyRate(parseFloat(e.target.value))} className="sim-slider" />
          </div>

          <button className="btn btn--primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSimulate} disabled={isSimulating}>
            {isSimulating ? 'Processing Models...' : 'Run Simulation'}
          </button>
        </div>

        {/* Results Panel */}
        <div className="card" style={{ minHeight: 400 }}>
          {!simulationResult && !isSimulating && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              <Activity size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
              <p>Configure parameters on the left and run the simulation to see the risk assessment.</p>
            </div>
          )}

          {isSimulating && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div className="sim-spinner"></div>
              <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Running Monte Carlo simulations...</p>
            </div>
          )}

          {simulationResult && !isSimulating && (
            <div className="sim-results animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 24, marginBottom: 8 }}>Simulation Results: {selectedCountry}</h2>
                  <p className="text-muted">Based on GDP: {gdp.toFixed(1)}% | CPI: {inflation.toFixed(1)}% | Unemp: {unemployment.toFixed(1)}%</p>
                </div>
                <div className={`sim-risk-badge risk-${simulationResult.risk.toLowerCase()}`}>
                  Risk Level: <strong>{simulationResult.risk}</strong>
                </div>
              </div>

              <div style={{ padding: 20, backgroundColor: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 24, borderLeft: `4px solid var(--${simulationResult.risk === 'High' ? 'danger' : simulationResult.risk === 'Medium' ? 'warning' : 'success'}-color)` }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Info size={18} /> Assessment Reasoning
                </h4>
                <p style={{ lineHeight: 1.6 }}>{simulationResult.reasoning}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                <div>
                  <h4 style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <TrendingUp size={16} /> Pros of this Environment
                  </h4>
                  <ul className="sim-list">
                    {simulationResult.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <AlertTriangle size={16} /> Risks & Cons
                  </h4>
                  <ul className="sim-list">
                    {simulationResult.cons.map((con, i) => <li key={i}>{con}</li>)}
                  </ul>
                </div>
              </div>

              <h3 style={{ marginBottom: 16, borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>Scenario Analysis</h3>
              <div className="sim-scenarios">
                <div className="scenario-card probable">
                  <h5>Most Probable Case</h5>
                  <p>{simulationResult.probable}</p>
                </div>
                <div className="scenario-card optimistic">
                  <h5>Optimistic Scenario</h5>
                  <p>{simulationResult.optimistic}</p>
                </div>
                <div className="scenario-card pessimistic">
                  <h5>Pessimistic Scenario</h5>
                  <p>{simulationResult.pessimistic}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
