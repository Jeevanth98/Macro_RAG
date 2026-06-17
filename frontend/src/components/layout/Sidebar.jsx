import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Globe2,
  BarChart3,
  MapPin,
  Bookmark,
  Sparkles,
  SlidersHorizontal,
  CalendarDays,
  Activity,
  FileText,
  Database,
  Settings,
  ChevronDown,
  Zap,
  ArrowRight,
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/global-overview', icon: Globe2, label: 'Global Overview' },
  { to: '/indicators', icon: BarChart3, label: 'Indicators' },
  { to: '/countries', icon: MapPin, label: 'Countries' },
  { to: '/watchlist', icon: Bookmark, label: 'Watchlist' },
  { to: '/copilot', icon: Sparkles, label: 'AI Copilot' },
  { to: '/screeners', icon: SlidersHorizontal, label: 'Screeners' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { to: '/simulation', icon: Activity, label: 'Simulation' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/data-library', icon: Database, label: 'Data Library' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar__logo">
        <span className="sidebar__logo-text">Hexaware</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            <item.icon size={19} strokeWidth={1.8} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* AI Promo Card */}
      <div className="sidebar__promo">
        <div className="sidebar__promo-icon">
          <Zap size={20} />
        </div>
        <div className="sidebar__promo-content">
          <strong>AI-POWERED</strong>
          <br />
          <span>MACRO INSIGHTS</span>
          <p>Turning complex data into actionable intelligence.</p>
        </div>
        <button className="sidebar__promo-btn">
          Explore Insights <ArrowRight size={14} />
        </button>
      </div>

      {/* User Profile */}
      <div className="sidebar__user">
        <div className="sidebar__user-avatar">AM</div>
        <div className="sidebar__user-info">
          <span className="sidebar__user-name">Monish</span>
          <span className="sidebar__user-role">Macro Analyst</span>
        </div>
        <ChevronDown size={16} className="sidebar__user-chevron" />
      </div>
    </aside>
  );
}
