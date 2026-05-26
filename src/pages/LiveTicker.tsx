import React, { useState, useEffect } from 'react';
import MetricCard from '../components/ui/MetricCard';
import CityOccupancyRow from '../components/ui/CityOccupancyRow';
import { mockFilms, mockTickerData } from '../lib/mockData';
import { formatCurrency, formatNumber, cn } from '../lib/utils';
import { useFilmContext } from '../hooks/useFilmContext';
import { dbService } from '../services/dbService';
import { ShowtimeSnapshot } from '../lib/types';
import { ChevronDown, RefreshCw, Clock, Film, TrendingUp, TrendingDown } from 'lucide-react';

export default function LiveTicker() {
  const { activeFilm, setActiveFilm } = useFilmContext();
  const [tickerData, setTickerData] = useState(mockTickerData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showtime, setShowtime] = useState<ShowtimeSnapshot | null>(null);
  const [loadingShowtime, setLoadingShowtime] = useState(false);

  useEffect(() => {
    if (!activeFilm?.id) {
      setShowtime(null);
      return;
    }
    setLoadingShowtime(true);
    dbService.getLatestShowtimeSnapshot(activeFilm.id)
      .then(setShowtime)
      .catch(err => console.warn("Showtime fetch failed:", err))
      .finally(() => setLoadingShowtime(false));
  }, [activeFilm?.id]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Simulate real-time update
      setTickerData(prev => ({
        ...prev,
        lastUpdated: 'Just now',
        totalAdmission: prev.totalAdmission + Math.floor(Math.random() * 50),
        avgOccupancy: Math.min(100, Math.max(0, prev.avgOccupancy + (Math.random() > 0.5 ? 1 : -1)))
      }));
      setIsRefreshing(false);
    }, 1000);
    // Also refresh showtime
    if (activeFilm?.id) {
      dbService.getLatestShowtimeSnapshot(activeFilm.id).then(setShowtime).catch(() => {});
    }
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Selection & Meta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
           <div className="relative group">
              <select 
                value={activeFilm?.id}
                onChange={(e) => setActiveFilm(mockFilms.find(f => f.id === e.target.value) || null)}
                className="appearance-none bg-black-4 border border-border-strong rounded-button px-5 py-3 pr-12 text-[15px] font-bold text-white outline-none cursor-pointer hover:border-crimson transition-all"
              >
                {mockFilms.map(f => (
                  <option key={f.id} value={f.id}>{f.title}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary pointer-events-none group-hover:text-crimson transition-colors" />
           </div>

           <div className="flex items-center gap-2 px-4 py-1.5 bg-black-3 rounded-full border border-border-subtle">
              <div className="w-1.5 h-1.5 rounded-full bg-green-kala animate-pulse-dot" />
              <span className="text-[11px] font-mono font-bold text-ink-tertiary">UPDATE: {tickerData.lastUpdated.toUpperCase()}</span>
           </div>
        </div>

        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 text-ink-secondary hover:text-white transition-colors text-[13px] font-medium"
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin text-crimson")} />
          Refresh Data
        </button>
      </div>

      {/* Showtime Allocation — REAL data from jadwalnonton.com */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Film className="w-4 h-4 text-crimson" />
            <div className="text-[11px] font-mono font-bold text-ink-tertiary uppercase tracking-widest">Showtime Allocation</div>
            <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-green-500/10 text-green-500">✓ jadwalnonton.com</span>
          </div>
          {showtime && (
            <span className="text-[10px] font-mono text-ink-tertiary">
              Snapshot: {new Date(showtime.scannedAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              {showtime.scanMode === 'default' && ' · Jakarta only'}
              {showtime.scanMode === 'deep' && ' · Tier-1 nasional'}
            </span>
          )}
        </div>

        {showtime && showtime.totalShows > 0 ? (
          <>
            <div className="grid grid-cols-4 gap-6">
              <MetricCard
                label="Total Showtimes"
                value={formatNumber(showtime.totalShows)}
                sub={`${showtime.totalCinemas} cinemas · ${showtime.totalCities} cities`}
                valueColor="default"
              />
              <MetricCard
                label="Velocity"
                value={`${(showtime.velocity ?? 0) >= 0 ? '+' : ''}${showtime.velocity ?? 0}%`}
                sub="vs previous snapshot"
                valueColor={(showtime.velocity ?? 0) > 0 ? 'green' : (showtime.velocity ?? 0) < 0 ? 'crimson' : 'default'}
              />
              <MetricCard
                label="IMAX / Premium"
                value={`${showtime.byTier.imax + showtime.byTier.premium}`}
                sub={`Regular: ${showtime.byTier.regular}`}
                valueColor="default"
              />
              <MetricCard
                label="Phase"
                value={showtime.phase === 'pre-release' ? 'PRE' : showtime.phase === 'release-week' ? 'OPENING' : 'POST'}
                sub={showtime.daysToRelease !== undefined && showtime.daysToRelease !== null
                  ? (showtime.daysToRelease > 0 ? `H-${showtime.daysToRelease}` : showtime.daysToRelease === 0 ? 'release day' : `D+${Math.abs(showtime.daysToRelease)}`)
                  : 'unknown'}
                valueColor={showtime.phase === 'release-week' ? 'orange' : 'default'}
              />
            </div>

            {/* City distribution table */}
            <div className="bg-black-4 border border-border-subtle rounded-card-lg overflow-hidden pb-4">
              <div className="grid grid-cols-[1fr_200px_80px_60px_100px] gap-6 px-6 py-4 border-b border-border-subtle text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest bg-black-3/50">
                <div>City</div>
                <div>Share Distribution</div>
                <div className="text-center">Shows</div>
                <div className="text-center">Tier</div>
                <div className="text-right">Chain Mix</div>
              </div>
              <div className="divide-y divide-border-subtle">
                {showtime.byCity.slice(0, 10).map((c) => {
                  const share = (c.count / showtime.totalShows) * 100;
                  return (
                    <div key={c.city} className="grid grid-cols-[1fr_200px_80px_60px_100px] gap-6 items-center px-6 py-4 hover:bg-white/5 transition-colors">
                      <div className="text-[14px] font-bold text-ink-primary capitalize">{c.city}</div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-crimson transition-all duration-1000" style={{ width: `${share}%` }} />
                        </div>
                      </div>
                      <div className="text-[13px] font-mono font-bold text-center text-ink-secondary">{c.count}</div>
                      <div className="text-[10px] font-mono text-center text-ink-tertiary uppercase">{c.tier}</div>
                      <div className="text-[10px] font-mono text-right text-ink-tertiary">{share.toFixed(1)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-black-4 border border-border-subtle rounded-card-lg p-8 text-center space-y-2">
            <p className="text-[14px] text-ink-secondary">
              {loadingShowtime
                ? "Loading showtime data..."
                : "No showtime snapshot yet for this campaign."}
            </p>
            {!loadingShowtime && (
              <p className="text-[11px] text-ink-tertiary italic">
                Showtime data is captured during Visibility Tracker scans. Go to Visibility Tracker and run a Deep Scan to populate this section.
              </p>
            )}
          </div>
        )}
      </div>

      {/* DEPRECATED: Mock occupancy data — kept for design reference until real booking integration */}
      <div className="space-y-4 opacity-50">
        <div className="flex items-center gap-2">
          <div className="text-[11px] font-mono font-bold text-ink-tertiary uppercase tracking-widest pl-2">Booking-Based Occupancy (Mock — Pending Real Integration)</div>
          <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-glow/30 text-orange-kala">WIP</span>
        </div>
        <div className="grid grid-cols-4 gap-6">
          <MetricCard label="Est. Total Admission" value={formatNumber(tickerData.totalAdmission)} sub="Daily · Mock data" valueColor="default" />
          <MetricCard label="Est. Revenue" value={formatCurrency(tickerData.revenue)} sub="Mock data" valueColor="default" />
          <MetricCard label="Avg Occupancy" value={`${tickerData.avgOccupancy}%`} sub="Mock data" valueColor="default" />
          <MetricCard label="Hourly Trend" value={tickerData.trend === 'up' ? '↑ UP' : tickerData.trend === 'down' ? '↓ DOWN' : '→ STEADY'} sub="Mock data" valueColor="default" />
        </div>
        <div className="bg-black-4 border border-border-subtle rounded-card-lg overflow-hidden pb-4">
          <div className="grid grid-cols-[1fr_200px_80px_60px_100px] gap-6 px-6 py-4 border-b border-border-subtle text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest bg-black-3/50">
            <div>City</div>
            <div>Visual Load</div>
            <div className="text-center">Load %</div>
            <div className="text-center">Trend</div>
            <div className="text-right">Alert</div>
          </div>
          <div className="divide-y divide-border-subtle">
            {tickerData.cities.map((city, i) => (
              <CityOccupancyRow key={i} {...city} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="pt-10 border-t border-border-subtle flex flex-col items-center gap-4 text-center">
         <div className="flex items-center gap-2 text-[10px] font-mono text-ink-tertiary">
            <Clock className="w-3 h-3" />
            Showtime data via jadwalnonton.com (real). Booking-based occupancy/admission is mock pending TIX/M-Tix integration.
         </div>
         <p className="text-[12px] text-ink-tertiary italic max-w-lg">
            Last updated: {showtime ? new Date(showtime.scannedAt).toLocaleString('en-US') : new Date().toLocaleString('en-US')} WIB.
         </p>
      </div>
    </div>
  );
}

