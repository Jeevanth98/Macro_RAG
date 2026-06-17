import React, { useState, useEffect } from 'react';
import { Plus, Bell, MoreHorizontal, ArrowUpRight, ArrowDownRight, Trash2, X } from 'lucide-react';
import { api } from '../../services/api';

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [countries, setCountries] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedIndicator, setSelectedIndicator] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchWatchlist();
    fetchOptions();
    // Request notification permission if not granted
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  const fetchOptions = async () => {
    try {
      const c = await api.getCountries();
      const i = await api.getIndicators();
      setCountries(c);
      setIndicators(i);
      if (c.length > 0) setSelectedCountry(c[0].name);
      if (i.length > 0) setSelectedIndicator(i[0].name);
    } catch (err) {
      console.error("Failed to fetch options", err);
    }
  };

  const fetchWatchlist = async () => {
    try {
      const data = await api.getWatchlist();
      setWatchlist(data);
    } catch (err) {
      console.error("Failed to fetch watchlist:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIndicator = () => {
    setIsModalOpen(true);
  };

  const submitAddIndicator = async () => {
    if (!selectedCountry || !selectedIndicator) return;
    setIsSubmitting(true);
    try {
      await api.addWatchlist(selectedCountry, selectedIndicator);
      await fetchWatchlist();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to add indicator", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this indicator from your Watchlist?")) {
      try {
        await api.deleteWatchlist(id);
        setWatchlist(watchlist.filter(item => item.id !== id));
      } catch (err) {
        console.error("Failed to delete", err);
      }
    }
  };

  const handleSetAlert = async (item) => {
    const triggerVal = window.prompt(`Set trigger value for ${item.indicator} (${item.country}):`, item.latest.replace(/[^0-9.-]/g, ''));
    if (triggerVal) {
      try {
        // Optimistic UI update
        const val = parseFloat(triggerVal);
        setWatchlist(watchlist.map(w => w.id === item.id ? { ...w, alertStatus: 'Active', triggerValue: val } : w));
        
        // Backend update
        await api.updateWatchlistAlert(item.id, 'Active', val);
        
        // Simulate the market hitting the trigger shortly after
        setTimeout(() => {
          if (Notification.permission === "granted") {
            new Notification("Market Alert Triggered!", {
              body: `${item.indicator} for ${item.country} just hit your trigger value of ${val}!`,
              icon: '/favicon.ico'
            });
          } else {
            alert(`ALERT: ${item.indicator} for ${item.country} just hit your trigger value of ${val}!`);
          }
        }, 3000);
      } catch (err) {
        console.error("Failed to update alert", err);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Watchlist</h1>
          <p className="page-subtitle">Track your key macroeconomic indicators in real-time.</p>
        </div>
        <button className="btn btn--primary" onClick={handleAddIndicator}><Plus size={16} /> Add Indicator</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Indicator Name</th>
              <th>Country</th>
              <th>Latest Value</th>
              <th>Change</th>
              <th>Alerts</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr>
            ) : watchlist.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Your watchlist is empty.</td></tr>
            ) : watchlist.map(item => (
              <tr key={item.id}>
                <td className="font-semibold text-brand">{item.indicator}</td>
                <td>{item.country}</td>
                <td className="font-extrabold">{item.latest}</td>
                <td>
                  <span className={`badge ${item.changeType === 'up' ? 'text-success bg-success-light' : item.changeType === 'down' ? 'text-danger bg-danger-light' : 'text-muted bg-secondary'}`}>
                    {item.changeType === 'up' && <ArrowUpRight size={14} />}
                    {item.changeType === 'down' && <ArrowDownRight size={14} />}
                    {item.change}
                  </span>
                </td>
                <td>
                  {item.alertStatus === 'Active' ? (
                    <span className="badge bg-success-light text-success" style={{ display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>
                      <Bell size={12} /> Active ({item.triggerValue})
                    </span>
                  ) : (
                    <button className="btn btn--secondary btn--sm" onClick={() => handleSetAlert(item)}>
                      <Bell size={14} /> Set
                    </button>
                  )}
                </td>
                <td>
                  <button className="btn btn--ghost" style={{ padding: 4, color: 'var(--danger-color)' }} onClick={() => handleDelete(item.id)} title="Remove from Watchlist">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 400, maxWidth: '90%', position: 'relative' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <X size={20} className="text-muted" />
            </button>
            <h3 style={{ marginBottom: 24 }}>Add to Watchlist</h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Country / Region</label>
              <select 
                value={selectedCountry} 
                onChange={(e) => setSelectedCountry(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-color)' }}
              >
                {countries.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Indicator</label>
              <select 
                value={selectedIndicator} 
                onChange={(e) => setSelectedIndicator(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-color)' }}
              >
                {indicators.map(i => <option key={i.code} value={i.name}>{i.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn--secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn btn--primary" onClick={submitAddIndicator} disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Indicator'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
