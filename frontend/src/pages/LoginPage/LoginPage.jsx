import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  BarChart3,
  Brain,
  Globe2,
  Sun,
  Moon,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="login-page">
      {/* ── Left Section ─────────────────────────────────────────────── */}
      <div className="login-left">
        <div className="login-brand">
          <h2 className="login-brand__name">Hexaware</h2>
        </div>

        <div className="login-hero">
          <h1 className="login-hero__title">
            AI-Powered <br />
            <span>Macroeconomic</span> <br />
            Intelligence
          </h1>

          <p className="login-hero__subtitle">
            Transform global data into actionable insights <br />
            and stay ahead of what moves the world.
          </p>

          <div className="login-features">
            <div className="login-feature">
              <div className="login-feature__icon">
                <BarChart3 size={22} />
              </div>
              <div>
                <h4>Global Data. Real-Time.</h4>
                <p>500+ data sources. Updated in real time.</p>
              </div>
            </div>

            <div className="login-feature">
              <div className="login-feature__icon">
                <Brain size={22} />
              </div>
              <div>
                <h4>AI-Powered Insights</h4>
                <p>Advanced models find what others miss.</p>
              </div>
            </div>

            <div className="login-feature">
              <div className="login-feature__icon">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4>Trusted Worldwide</h4>
                <p>Built for institutions. Secured for scale.</p>
              </div>
            </div>
          </div>

          <div className="login-stats">
            <div className="login-stat">
              <h3>500+</h3>
              <p>Data Sources</p>
            </div>
            <div className="login-stat">
              <h3>200+</h3>
              <p>Countries</p>
            </div>
            <div className="login-stat">
              <h3>10M+</h3>
              <p>Time Series</p>
            </div>
            <div className="login-stat">
              <h3>1M+</h3>
              <p>Users</p>
            </div>
          </div>
        </div>

        {/* Globe & Floating Cards */}
        <div className="login-globe-area">
          <svg className="login-globe-svg" viewBox="0 0 600 340" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="map-glow" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#8A7BFF" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#6D5DFC" stopOpacity="0.0" />
              </radialGradient>
            </defs>

            {/* Background glow */}
            <rect width="600" height="340" fill="url(#map-glow)" />

            {/* Dotted continents - larger dots, more opaque */}
            {/* North America */}
            <g fill="#6D5DFC" fillOpacity="0.35">
              <circle cx="120" cy="90" r="2.5"/><circle cx="130" cy="85" r="2.5"/><circle cx="140" cy="82" r="2.5"/>
              <circle cx="110" cy="100" r="2.5"/><circle cx="120" cy="97" r="2.5"/><circle cx="130" cy="94" r="2.5"/>
              <circle cx="140" cy="91" r="2.5"/><circle cx="150" cy="88" r="2.5"/><circle cx="105" cy="110" r="2.5"/>
              <circle cx="115" cy="107" r="2.5"/><circle cx="125" cy="104" r="2.5"/><circle cx="135" cy="101" r="2.5"/>
              <circle cx="145" cy="98" r="2.5"/><circle cx="100" cy="120" r="2.5"/><circle cx="110" cy="117" r="2.5"/>
              <circle cx="120" cy="114" r="2.5"/><circle cx="130" cy="111" r="2.5"/><circle cx="140" cy="108" r="2.5"/>
              <circle cx="150" cy="105" r="2.5"/><circle cx="95" cy="130" r="2.5"/><circle cx="105" cy="127" r="2.5"/>
              <circle cx="115" cy="124" r="2.5"/><circle cx="125" cy="121" r="2.5"/><circle cx="135" cy="118" r="2.5"/>
              <circle cx="145" cy="115" r="2.5"/><circle cx="155" cy="112" r="2.5"/>
            </g>
            {/* South America */}
            <g fill="#6D5DFC" fillOpacity="0.35">
              <circle cx="165" cy="185" r="2.5"/><circle cx="175" cy="190" r="2.5"/><circle cx="185" cy="195" r="2.5"/>
              <circle cx="160" cy="195" r="2.5"/><circle cx="170" cy="200" r="2.5"/><circle cx="180" cy="205" r="2.5"/>
              <circle cx="155" cy="205" r="2.5"/><circle cx="165" cy="210" r="2.5"/><circle cx="175" cy="215" r="2.5"/>
              <circle cx="160" cy="220" r="2.5"/><circle cx="170" cy="225" r="2.5"/><circle cx="165" cy="235" r="2.5"/>
              <circle cx="160" cy="245" r="2.5"/><circle cx="155" cy="255" r="2.5"/><circle cx="150" cy="265" r="2.5"/>
            </g>
            {/* Europe */}
            <g fill="#6D5DFC" fillOpacity="0.35">
              <circle cx="280" cy="72" r="2.5"/><circle cx="290" cy="69" r="2.5"/><circle cx="300" cy="67" r="2.5"/>
              <circle cx="275" cy="82" r="2.5"/><circle cx="285" cy="79" r="2.5"/><circle cx="295" cy="77" r="2.5"/>
              <circle cx="305" cy="75" r="2.5"/><circle cx="315" cy="73" r="2.5"/><circle cx="270" cy="92" r="2.5"/>
              <circle cx="280" cy="89" r="2.5"/><circle cx="290" cy="87" r="2.5"/><circle cx="300" cy="85" r="2.5"/>
              <circle cx="310" cy="83" r="2.5"/><circle cx="320" cy="81" r="2.5"/><circle cx="275" cy="99" r="2.5"/>
              <circle cx="285" cy="97" r="2.5"/><circle cx="295" cy="95" r="2.5"/><circle cx="305" cy="93" r="2.5"/>
            </g>
            {/* Africa */}
            <g fill="#6D5DFC" fillOpacity="0.35">
              <circle cx="290" cy="145" r="2.5"/><circle cx="300" cy="143" r="2.5"/><circle cx="310" cy="141" r="2.5"/>
              <circle cx="285" cy="155" r="2.5"/><circle cx="295" cy="153" r="2.5"/><circle cx="305" cy="151" r="2.5"/>
              <circle cx="315" cy="149" r="2.5"/><circle cx="288" cy="165" r="2.5"/><circle cx="298" cy="163" r="2.5"/>
              <circle cx="308" cy="161" r="2.5"/><circle cx="291" cy="175" r="2.5"/><circle cx="301" cy="173" r="2.5"/>
              <circle cx="311" cy="171" r="2.5"/><circle cx="294" cy="185" r="2.5"/><circle cx="304" cy="183" r="2.5"/>
              <circle cx="298" cy="195" r="2.5"/><circle cx="302" cy="205" r="2.5"/><circle cx="305" cy="215" r="2.5"/>
            </g>
            {/* Asia */}
            <g fill="#6D5DFC" fillOpacity="0.35">
              <circle cx="350" cy="75" r="2.5"/><circle cx="360" cy="73" r="2.5"/><circle cx="370" cy="71" r="2.5"/>
              <circle cx="380" cy="69" r="2.5"/><circle cx="390" cy="67" r="2.5"/><circle cx="400" cy="65" r="2.5"/>
              <circle cx="345" cy="85" r="2.5"/><circle cx="355" cy="83" r="2.5"/><circle cx="365" cy="81" r="2.5"/>
              <circle cx="375" cy="79" r="2.5"/><circle cx="385" cy="77" r="2.5"/><circle cx="395" cy="75" r="2.5"/>
              <circle cx="405" cy="73" r="2.5"/><circle cx="415" cy="71" r="2.5"/><circle cx="340" cy="95" r="2.5"/>
              <circle cx="350" cy="93" r="2.5"/><circle cx="360" cy="91" r="2.5"/><circle cx="370" cy="89" r="2.5"/>
              <circle cx="380" cy="87" r="2.5"/><circle cx="390" cy="85" r="2.5"/><circle cx="400" cy="83" r="2.5"/>
              <circle cx="410" cy="81" r="2.5"/><circle cx="340" cy="105" r="2.5"/><circle cx="350" cy="103" r="2.5"/>
              <circle cx="360" cy="101" r="2.5"/><circle cx="370" cy="99" r="2.5"/><circle cx="380" cy="97" r="2.5"/>
              <circle cx="390" cy="95" r="2.5"/><circle cx="400" cy="93" r="2.5"/><circle cx="410" cy="91" r="2.5"/>
              <circle cx="345" cy="115" r="2.5"/><circle cx="355" cy="113" r="2.5"/><circle cx="365" cy="111" r="2.5"/>
              <circle cx="375" cy="109" r="2.5"/><circle cx="385" cy="107" r="2.5"/><circle cx="395" cy="105" r="2.5"/>
              <circle cx="355" cy="125" r="2.5"/><circle cx="365" cy="123" r="2.5"/><circle cx="375" cy="121" r="2.5"/>
              <circle cx="385" cy="119" r="2.5"/><circle cx="395" cy="117" r="2.5"/>
            </g>
            {/* Australia */}
            <g fill="#6D5DFC" fillOpacity="0.35">
              <circle cx="460" cy="215" r="2.5"/><circle cx="470" cy="213" r="2.5"/><circle cx="480" cy="211" r="2.5"/>
              <circle cx="490" cy="209" r="2.5"/><circle cx="455" cy="225" r="2.5"/><circle cx="465" cy="223" r="2.5"/>
              <circle cx="475" cy="221" r="2.5"/><circle cx="485" cy="219" r="2.5"/><circle cx="495" cy="217" r="2.5"/>
              <circle cx="460" cy="233" r="2.5"/><circle cx="470" cy="231" r="2.5"/><circle cx="480" cy="229" r="2.5"/>
              <circle cx="490" cy="227" r="2.5"/><circle cx="465" cy="240" r="2.5"/><circle cx="475" cy="238" r="2.5"/>
            </g>

            {/* Connection arcs */}
            <path d="M130,115 Q200,30 290,87" fill="none" stroke="#6D5DFC" strokeWidth="0.7" strokeOpacity="0.25" strokeDasharray="4,3" />
            <path d="M290,87 Q340,50 385,80" fill="none" stroke="#6D5DFC" strokeWidth="0.7" strokeOpacity="0.25" strokeDasharray="4,3" />
            <path d="M385,80 Q430,155 475,220" fill="none" stroke="#6D5DFC" strokeWidth="0.7" strokeOpacity="0.25" strokeDasharray="4,3" />
            <path d="M290,87 Q280,135 298,175" fill="none" stroke="#6D5DFC" strokeWidth="0.7" strokeOpacity="0.25" strokeDasharray="4,3" />
            <path d="M130,115 Q155,165 170,200" fill="none" stroke="#6D5DFC" strokeWidth="0.7" strokeOpacity="0.25" strokeDasharray="4,3" />
            <path d="M385,80 Q330,135 298,175" fill="none" stroke="#6D5DFC" strokeWidth="0.7" strokeOpacity="0.25" strokeDasharray="4,3" />
            <path d="M130,115 Q250,70 385,80" fill="none" stroke="#6D5DFC" strokeWidth="0.7" strokeOpacity="0.25" strokeDasharray="4,3" />

            {/* Country markers — each has: ring circle, dot, label */}
            {/* USA */}
            <circle cx="130" cy="115" r="12" fill="none" stroke="#6D5DFC" strokeWidth="0.5" strokeOpacity="0.3" />
            <circle cx="130" cy="115" r="4.5" fill="#6D5DFC" fillOpacity="0.85" />
            <text x="130" y="105" textAnchor="middle" fill="#4B42B3" fontSize="8" fontWeight="700" fillOpacity="0.95">USA</text>

            {/* Brazil */}
            <circle cx="170" cy="200" r="10" fill="none" stroke="#6D5DFC" strokeWidth="0.5" strokeOpacity="0.3" />
            <circle cx="170" cy="200" r="4" fill="#6D5DFC" fillOpacity="0.8" />
            <text x="170" y="191" textAnchor="middle" fill="#4B42B3" fontSize="7.5" fontWeight="700" fillOpacity="0.9">Brazil</text>

            {/* UK */}
            <circle cx="272" cy="78" r="9" fill="none" stroke="#6D5DFC" strokeWidth="0.5" strokeOpacity="0.3" />
            <circle cx="272" cy="78" r="3.5" fill="#6D5DFC" fillOpacity="0.8" />
            <text x="272" y="70" textAnchor="middle" fill="#4B42B3" fontSize="7" fontWeight="700" fillOpacity="0.9">UK</text>

            {/* Germany */}
            <circle cx="298" cy="80" r="9" fill="none" stroke="#6D5DFC" strokeWidth="0.5" strokeOpacity="0.3" />
            <circle cx="298" cy="80" r="3.5" fill="#6D5DFC" fillOpacity="0.8" />
            <text x="314" y="78" textAnchor="start" fill="#4B42B3" fontSize="7" fontWeight="700" fillOpacity="0.9">Germany</text>

            {/* India */}
            <circle cx="385" cy="130" r="12" fill="none" stroke="#6D5DFC" strokeWidth="0.5" strokeOpacity="0.3" />
            <circle cx="385" cy="130" r="4.5" fill="#6D5DFC" fillOpacity="0.85" />
            <text x="385" y="120" textAnchor="middle" fill="#4B42B3" fontSize="8" fontWeight="700" fillOpacity="0.95">India</text>

            {/* China */}
            <circle cx="410" cy="95" r="12" fill="none" stroke="#6D5DFC" strokeWidth="0.5" strokeOpacity="0.3" />
            <circle cx="410" cy="95" r="4.5" fill="#6D5DFC" fillOpacity="0.85" />
            <text x="410" y="85" textAnchor="middle" fill="#4B42B3" fontSize="8" fontWeight="700" fillOpacity="0.95">China</text>

            {/* Japan */}
            <circle cx="450" cy="90" r="9" fill="none" stroke="#6D5DFC" strokeWidth="0.5" strokeOpacity="0.3" />
            <circle cx="450" cy="90" r="3.5" fill="#6D5DFC" fillOpacity="0.8" />
            <text x="462" y="88" textAnchor="start" fill="#4B42B3" fontSize="7" fontWeight="700" fillOpacity="0.9">Japan</text>

            {/* Nigeria */}
            <circle cx="298" cy="175" r="9" fill="none" stroke="#6D5DFC" strokeWidth="0.5" strokeOpacity="0.3" />
            <circle cx="298" cy="175" r="3.5" fill="#6D5DFC" fillOpacity="0.8" />
            <text x="298" y="167" textAnchor="middle" fill="#4B42B3" fontSize="7" fontWeight="700" fillOpacity="0.9">Nigeria</text>

            {/* Australia */}
            <circle cx="475" cy="220" r="10" fill="none" stroke="#6D5DFC" strokeWidth="0.5" strokeOpacity="0.3" />
            <circle cx="475" cy="220" r="4" fill="#6D5DFC" fillOpacity="0.8" />
            <text x="475" y="212" textAnchor="middle" fill="#4B42B3" fontSize="7.5" fontWeight="700" fillOpacity="0.9">Australia</text>

            {/* Mexico */}
            <circle cx="105" cy="140" r="8" fill="none" stroke="#6D5DFC" strokeWidth="0.5" strokeOpacity="0.3" />
            <circle cx="105" cy="140" r="3" fill="#6D5DFC" fillOpacity="0.7" />
            <text x="105" y="153" textAnchor="middle" fill="#4B42B3" fontSize="6.5" fontWeight="600" fillOpacity="0.8">Mexico</text>

            {/* S. Korea */}
            <circle cx="440" cy="100" r="8" fill="none" stroke="#6D5DFC" strokeWidth="0.5" strokeOpacity="0.3" />
            <circle cx="440" cy="100" r="3" fill="#6D5DFC" fillOpacity="0.7" />
            <text x="440" y="113" textAnchor="middle" fill="#4B42B3" fontSize="6.5" fontWeight="600" fillOpacity="0.8">S.Korea</text>
          </svg>

          <div className="login-mini-card login-card-one animate-float" style={{ animationDelay: '0s' }}>
            <p>Global GDP Growth</p>
            <small>2024 Q1</small>
            <h3 className="text-success">+2.6%</h3>
            <svg viewBox="0 0 100 20" style={{ width: '100%', height: 24, marginTop: 8 }}>
              <path d="M0,15 Q10,5 20,10 T40,15 T60,5 T80,10 T100,2" fill="none" stroke="#12B981" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <div className="login-mini-card login-card-two animate-float" style={{ animationDelay: '0.5s' }}>
            <p>Policy Rate (Global Avg.)</p>
            <small>May 2024</small>
            <h3 style={{ color: '#6D5DFC' }}>5.25%</h3>
            <svg viewBox="0 0 100 20" style={{ width: '100%', height: 24, marginTop: 8 }}>
              <path d="M0,10 Q10,15 20,10 T40,5 T60,15 T80,10 T100,8" fill="none" stroke="#6D5DFC" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <div className="login-mini-card login-card-three animate-float" style={{ animationDelay: '1s' }}>
            <p>Global CPI YoY</p>
            <small>Apr 2024</small>
            <h3 className="text-success">+3.4%</h3>
            <svg viewBox="0 0 100 20" style={{ width: '100%', height: 24, marginTop: 8 }}>
              <path d="M0,18 Q15,10 30,15 T60,5 T80,8 T100,2" fill="none" stroke="#12B981" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <div className="login-mini-card login-card-four animate-float" style={{ animationDelay: '1.5s' }}>
            <p>Economic Surprise Index</p>
            <small>May 2024</small>
            <h3 className="text-success">+0.18</h3>
            <svg viewBox="0 0 100 20" style={{ width: '100%', height: 24, marginTop: 8 }}>
              <path d="M0,15 Q10,20 20,15 T40,5 T60,10 T80,5 T100,2" fill="none" stroke="#12B981" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Right Section ────────────────────────────────────────────── */}
      <div className="login-right">
        <div className="login-right__top">
          <button className="login-theme-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'classic' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button className="login-lang-btn">
            <Globe2 size={16} />
            <span>EN</span>
            <ChevronDown size={14} />
          </button>
        </div>

        <div className="login-card-container">
          <div className="login-form-card">
            <div className="login-form__header">
              <h2>Welcome back</h2>
              <p>Sign in to continue to <span className="text-brand font-bold">Hexaware</span></p>
            </div>

            <form onSubmit={handleSignIn}>
              <label className="login-label">Email address</label>
              <div className="input-group input-group--lg">
                <Mail size={20} />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="login-password-row">
                <label className="login-label">Password</label>
                <a href="#" className="login-forgot">Forgot password?</a>
              </div>
              <div className="input-group input-group--lg">
                <Lock size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-eye-btn"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <button type="submit" className="btn btn--primary btn--xl">
                Sign in
              </button>
            </form>

            <div className="divider" style={{ margin: '24px 0 20px' }}>
              <span className="divider__line"></span>
              <span className="divider__text">or continue with</span>
              <span className="divider__line"></span>
            </div>

            <div className="login-social-grid">
              <button className="login-social-btn">
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </button>
              <button className="login-social-btn">
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M11.4 24H0V12.6L11.4 0v5.4H24v7.2H11.4V24z" fill="#00A4EF"/></svg>
                Microsoft
              </button>
              <button className="login-social-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#333"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                Apple
              </button>
              <button className="login-social-btn">
                <Building2 size={18} />
                SSO
              </button>
            </div>

            <div className="login-security">
              <div className="login-security__icon">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4>Enterprise-grade security</h4>
                <p>SOC 2 Type II • ISO 27001 • GDPR Compliant</p>
              </div>
            </div>
          </div>

          <p className="login-signup-text">
            New to Hexaware? <a href="#">Create an account</a>
          </p>
        </div>
      </div>
    </div>
  );
}
