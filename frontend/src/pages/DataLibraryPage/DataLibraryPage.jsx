import React from 'react';
import { Database, Search, Download } from 'lucide-react';

const SOURCES = [
  { id: 1, name: 'IMF eLibrary', datasets: '45', update: 'Daily' },
  { id: 2, name: 'World Bank Open Data', datasets: '120', update: 'Weekly' },
  { id: 3, name: 'OECD Data', datasets: '65', update: 'Daily' },
  { id: 4, name: 'FRED (Federal Reserve)', datasets: '500k+', update: 'Real-time' },
];

const downloadMockData = (sourceName) => {
  const headers = ['Date', 'Country', 'Indicator', 'Value', 'Source'];
  const countries = ['United States', 'Euro Area', 'Japan', 'China', 'United Kingdom', 'India', 'Germany'];
  const indicators = [
    { name: 'GDP Growth', min: -5, max: 8, suffix: '%' },
    { name: 'Inflation', min: -1, max: 12, suffix: '%' },
    { name: 'Unemployment', min: 3, max: 12, suffix: '%' },
    { name: 'Policy Rate', min: -0.5, max: 8, suffix: '%' },
    { name: 'Manufacturing PMI', min: 40, max: 60, suffix: '' }
  ];

  const rows = [];
  const currentDate = new Date();
  
  // Generate 5 years of monthly data for each country and indicator combination
  for (let yearOffset = 5; yearOffset >= 0; yearOffset--) {
    for (let month = 0; month < 12; month++) {
      // Stop if we reach future months in the current year
      if (yearOffset === 0 && month > currentDate.getMonth()) break;
      
      const year = currentDate.getFullYear() - yearOffset;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;

      countries.forEach(country => {
        indicators.forEach(ind => {
          // Add some randomness to the value
          const value = (Math.random() * (ind.max - ind.min) + ind.min).toFixed(2) + ind.suffix;
          rows.push([dateStr, country, ind.name, value, sourceName]);
        });
      });
    }
  }

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${sourceName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_extract.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function DataLibraryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Library</h1>
          <p className="page-subtitle">Manage the 500+ institutional sources connected to Hexaware.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Source Name</th>
              <th>Datasets Connected</th>
              <th>Update Frequency</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {SOURCES.map(src => (
              <tr key={src.id}>
                <td className="font-semibold text-brand flex align-center gap-2"><Database size={16} /> {src.name}</td>
                <td className="font-bold">{src.datasets}</td>
                <td className="text-muted">{src.update}</td>
                <td><span className="badge bg-success-light text-success">Active</span></td>
                <td>
                  <button className="btn btn--secondary btn--sm" onClick={() => downloadMockData(src.name)}>
                    <Download size={14} /> Download CSV
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
