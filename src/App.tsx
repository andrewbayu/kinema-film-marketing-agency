/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FilmProvider } from './hooks/useFilmContext';
import { AuthProvider, useAuth } from './hooks/useAuth';
import DashboardLayout from './components/layout/DashboardLayout';
import Overview from './pages/Overview';
import Campaigns from './pages/Campaigns';
import AudienceDNA from './pages/AudienceDNA';
import BoxPredict from './pages/BoxPredict';
import LiveTicker from './pages/LiveTicker';
import Library from './pages/Library';
import FIBGenerator from './pages/FIBGenerator';
import LandingPage from './pages/LandingPage';
import Discussion from './pages/Discussion';
import AdminDashboard from './pages/AdminDashboard';
import { LogIn } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthorized } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-black-1 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-crimson-surface border-t-crimson rounded-full animate-spin" />
    </div>
  );

  if (!user) return <LandingPage />;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black-1 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-white-primary mb-4">Unauthorized Access</h1>
        <p className="text-white-tertiary max-w-md mb-8">
          This portal is restricted to authorized clients only. If you believe this is an error, please contact KALA support.
        </p>
        <button 
          onClick={() => window.location.href = '/'}
          className="bg-crimson hover:bg-crimson-rich text-white px-8 py-3 rounded-full font-bold transition-all"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-black-1 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-crimson-surface border-t-crimson rounded-full animate-spin" />
    </div>
  );

  if (!user || !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <FilmProvider>
          <Routes>
            <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<Overview />} />
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="audience-dna" element={<AudienceDNA />} />
              <Route path="box-predict" element={<BoxPredict />} />
              <Route path="live-ticker" element={<LiveTicker />} />
              <Route path="library" element={<Library />} />
              <Route path="fib/:filmId" element={<FIBGenerator />} />
            </Route>
            <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/discussion" element={<Discussion />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </FilmProvider>
      </AuthProvider>
    </Router>
  );
}
