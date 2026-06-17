const API_BASE_URL = 'http://localhost:8000/api/v1';

export const api = {
  // Dashboard
  getDashboardKPIs: async () => {
    const res = await fetch(`${API_BASE_URL}/dashboard/kpis`);
    if (!res.ok) throw new Error('Failed to fetch KPIs');
    return res.json();
  },
  getDashboardInsights: async () => {
    const res = await fetch(`${API_BASE_URL}/dashboard/insights`);
    if (!res.ok) throw new Error('Failed to fetch insights');
    return res.json();
  },
  getDashboardChart: async () => {
    const res = await fetch(`${API_BASE_URL}/dashboard/chart`);
    if (!res.ok) throw new Error('Failed to fetch chart data');
    return res.json();
  },
  getDashboardMap: async (indicator = 'GDP Growth') => {
    const res = await fetch(`${API_BASE_URL}/dashboard/map?indicator=${encodeURIComponent(indicator)}`);
    if (!res.ok) throw new Error('Failed to fetch map data');
    return res.json();
  },
  getWatchlist: async () => {
    const res = await fetch(`${API_BASE_URL}/dashboard/watchlist`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch watchlist');
    return res.json();
  },
  addWatchlist: async (country, indicator) => {
    const res = await fetch(`${API_BASE_URL}/dashboard/watchlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country, indicator })
    });
    if (!res.ok) throw new Error('Failed to add to watchlist');
    return res.json();
  },
  deleteWatchlist: async (id) => {
    const res = await fetch(`${API_BASE_URL}/dashboard/watchlist/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete watchlist item');
    return res.json();
  },
  updateWatchlistAlert: async (id, alertStatus, triggerValue) => {
    const res = await fetch(`${API_BASE_URL}/dashboard/watchlist/${id}/alert`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertStatus, triggerValue })
    });
    if (!res.ok) throw new Error('Failed to update alert');
    return res.json();
  },
  
  // Copilot
  askCopilot: async (query, mode = 'detailed') => {
    const res = await fetch(`${API_BASE_URL}/copilot/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, mode })
    });
    if (!res.ok) throw new Error('Failed to fetch from copilot');
    return res.json();
  },
  
  // Reports
  generateReport: async (options = {}) => {
    const res = await fetch(`${API_BASE_URL}/report/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    if (!res.ok) throw new Error('Failed to generate report');
    return res.json();
  },

  // Data
  getCountries: async () => {
    const res = await fetch(`${API_BASE_URL}/data/countries`);
    if (!res.ok) throw new Error('Failed to fetch countries');
    return res.json();
  },
  getIndicators: async () => {
    const res = await fetch(`${API_BASE_URL}/data/indicators`);
    if (!res.ok) throw new Error('Failed to fetch indicators');
    return res.json();
  },
  getSeries: async (country, indicator) => {
    const res = await fetch(`${API_BASE_URL}/data/series/${encodeURIComponent(country)}/${encodeURIComponent(indicator)}`);
    if (!res.ok) throw new Error('Failed to fetch series');
    return res.json();
  }
};
