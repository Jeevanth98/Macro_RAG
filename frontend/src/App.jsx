import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage/LoginPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import GlobalOverviewPage from './pages/GlobalOverviewPage/GlobalOverviewPage';
import IndicatorsPage from './pages/IndicatorsPage/IndicatorsPage';
import CountriesPage from './pages/CountriesPage/CountriesPage';
import CopilotPage from './pages/CopilotPage/CopilotPage';
import WatchlistPage from './pages/WatchlistPage/WatchlistPage';
import ScreenersPage from './pages/ScreenersPage/ScreenersPage';
import SimulationPage from './pages/SimulationPage/SimulationPage';
import CalendarPage from './pages/CalendarPage/CalendarPage';
import ReportsPage from './pages/ReportsPage/ReportsPage';
import DataLibraryPage from './pages/DataLibraryPage/DataLibraryPage';
import ApprovalsPage from './pages/ApprovalsPage/ApprovalsPage';
import SettingsPage from './pages/SettingsPage/SettingsPage';
import QualityCenterPage from './pages/QualityCenterPage/QualityCenterPage';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Authenticated routes (wrapped with AppLayout) */}
        <Route path="/dashboard" element={<AppLayout><DashboardPage /></AppLayout>} />
        
        {/* Phase 2 Pages */}
        <Route path="/global-overview" element={<AppLayout><GlobalOverviewPage /></AppLayout>} />
        <Route path="/indicators" element={<AppLayout><IndicatorsPage /></AppLayout>} />
        <Route path="/countries" element={<AppLayout><CountriesPage /></AppLayout>} />
        
        {/* Phase 3 Pages */}
        <Route path="/copilot" element={<AppLayout><CopilotPage /></AppLayout>} />
        <Route path="/quality-center" element={<AppLayout><QualityCenterPage /></AppLayout>} />
        <Route path="/watchlist" element={<AppLayout><WatchlistPage /></AppLayout>} />
        
        {/* Phase 4 & 5 Pages */}
        <Route path="/screeners" element={<AppLayout><ScreenersPage /></AppLayout>} />
        <Route path="/simulation" element={<AppLayout><SimulationPage /></AppLayout>} />
        <Route path="/calendar" element={<AppLayout><CalendarPage /></AppLayout>} />
        <Route path="/reports" element={<AppLayout><ReportsPage /></AppLayout>} />
        <Route path="/data-library" element={<AppLayout><DataLibraryPage /></AppLayout>} />
        <Route path="/approvals" element={<AppLayout><ApprovalsPage /></AppLayout>} />
        <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
