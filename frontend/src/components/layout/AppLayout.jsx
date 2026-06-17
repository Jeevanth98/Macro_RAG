import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import './AppLayout.css';

export default function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="app-layout__content">
        {children}
      </main>
    </div>
  );
}
