/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FilmProvider } from './hooks/useFilmContext';
import { AuthProvider, useAuth } from './hooks/useAuth';
import DashboardLayout from './components/layout/DashboardLayout';
import FilmRouteSync from './components/layout/FilmRouteSync';
import Overview from './pages/Overview';
import Campaigns from './pages/Campaigns';
import Clients from './pages/Clients';
import AudienceDNA from './pages/AudienceDNA';
import BoxPredict from './pages/BoxPredict';
import LiveTicker from './pages/LiveTicker';
import Library from './pages/Library';
import FIBGenerator from './pages/FIBGenerator';
import CineForge from './pages/CineForge';
import LandingPage from './pages/LandingPage';
import Discussion from './pages/Discussion';
import VisibilityTracker from './pages/VisibilityTracker';
import AdminDashboard from './pages/AdminDashboard';
import { LogIn } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthorized, logout } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-black-1 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-crimson-surface border-t-crimson rounded-full animate-spin" />
    </div>
  );

  if (!user) return <LandingPage />;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black-1 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-bold text-white-primary mb-4">Akses Terbatas</h1>
        <p className="text-white-tertiary max-w-md mb-8 leading-relaxed">
          Portal ini hanya ditujukan untuk klien resmi Kinema. Jika Anda merasa ini adalah kesalahan, silakan hubungi tim support Kinema.
        </p>
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => logout()}
            className="bg-crimson hover:bg-crimson-rich text-white px-10 py-4 rounded-full font-bold transition-all shadow-lg shadow-crimson/20"
          >
            Keluar & Kembali ke Beranda
          </button>
          <button 
            onClick={() => window.location.href = 'mailto:hello@kinema.id'}
            className="text-white-tertiary hover:text-white-primary text-sm font-medium transition-colors"
          >
            Hubungi Support
          </button>
        </div>
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
              <Route path="clients" element={<Clients />} />
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="library" element={<Library />} />

              {/* Film-scoped routes — URL is canonical, hydrates activeClient+activeFilm. */}
              <Route path="clients/:clientId/films/:filmId" element={<FilmRouteSync />}>
                <Route index element={<Navigate to="audience-dna" replace />} />
                <Route path="audience-dna" element={<AudienceDNA />} />
                <Route path="box-predict" element={<BoxPredict />} />
                <Route path="visibility-tracker" element={<VisibilityTracker />} />
                <Route path="live-ticker" element={<LiveTicker />} />
                <Route path="cineforge" element={<CineForge />} />
                <Route path="fib" element={<FIBGenerator />} />
              </Route>

              {/* Legacy flat routes — still work, read activeFilm from context.
                  Kept for back-compat with bookmarks and sidebar fallback. */}
              <Route path="audience-dna" element={<AudienceDNA />} />
              <Route path="box-predict" element={<BoxPredict />} />
              <Route path="visibility-tracker" element={<VisibilityTracker />} />
              <Route path="live-ticker" element={<LiveTicker />} />
              <Route path="cineforge" element={<CineForge />} />
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
