import React from 'react';
import { User, Bell, Key, Palette, Save } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account and platform preferences.</p>
        </div>
        <button className="btn btn--primary"><Save size={16} /> Save Changes</button>
      </div>

      <div className="card flex flex-col gap-5">
        <h3 className="flex align-center gap-2 border-b pb-3"><User size={18} /> Profile</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold mb-1 block">Full Name</label>
            <input type="text" className="input" defaultValue="Monish" style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px' }} />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Email Address</label>
            <input type="email" className="input" defaultValue="monish@example.com" style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px' }} />
          </div>
        </div>
      </div>

      <div className="card flex flex-col gap-5">
        <h3 className="flex align-center gap-2 border-b pb-3"><Key size={18} /> API Keys</h3>
        <p className="text-sm text-muted">Use these keys to access the Hexaware FastAPI backend programmatically.</p>
        <div className="flex gap-2">
          <input type="password" value="sk_test_1234567890abcdef" readOnly style={{ flex: 1, padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-secondary)' }} />
          <button className="btn btn--secondary">Reveal</button>
        </div>
      </div>
    </div>
  );
}
