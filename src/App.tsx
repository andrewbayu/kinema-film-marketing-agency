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
import FIBGenerator from './pages/FIBGenerator';
import LandingPage from './pages/LandingPage';
import { LogIn } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-black-1 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-crimson-surface border-t-crimson rounded-full animate-spin" />
    </div>
  );

  if (!user) return <LandingPage />;

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
              <Route path="fib/:filmId" element={<FIBGenerator />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </FilmProvider>
      </AuthProvider>
    </Router>
  );
}
