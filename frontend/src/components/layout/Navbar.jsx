import React from 'react';
import { Search, Plus, Bell, HelpCircle, Settings, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './Navbar.css';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="navbar">
      <div className="navbar__search">
        <Search size={18} className="navbar__search-icon" />
        <input
          type="text"
          placeholder="Search indicators, countries, topics..."
          className="navbar__search-input"
        />
        <div className="navbar__search-shortcut">
          <kbd>⌘</kbd><kbd>K</kbd>
        </div>
      </div>

      <div className="navbar__actions">
        <button className="navbar__action-btn navbar__add-btn">
          <Plus size={18} />
          <span>Add to Watchlist</span>
        </button>

        <button className="navbar__icon-btn" title="Notifications">
          <Bell size={20} />
          <span className="navbar__badge">3</span>
        </button>

        <button 
          className="navbar__icon-btn theme-toggle-btn" 
          onClick={toggleTheme} 
          title={theme === 'classic' ? 'Switch to Night Mode' : 'Switch to Classic Mode'}
        >
          {theme === 'classic' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <button className="navbar__icon-btn" title="Help">
          <HelpCircle size={20} />
        </button>

        <button className="navbar__icon-btn" title="Settings">
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
}
