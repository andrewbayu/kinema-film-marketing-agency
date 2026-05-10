import React, { useState, useEffect } from 'react';
import MetricCard from '../components/ui/MetricCard';
import CityOccupancyRow from '../components/ui/CityOccupancyRow';
import { mockFilms, mockTickerData } from '../lib/mockData';
import { formatCurrency, formatNumber, cn } from '../lib/utils';
import { useFilmContext } from '../hooks/useFilmContext';
import { ChevronDown, RefreshCw, Clock } from 'lucide-react';

export default function LiveTicker() {
  const { activeFilm, setActiveFilm } = useFilmContext();
  const [tickerData, setTickerData] = useState(mockTickerData);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-6">
        <MetricCard 
          label="Est. Total Admission"
          value={formatNumber(tickerData.totalAdmission)}
          sub="Daily · Accumulated"
          valueColor="green"
        />
        <MetricCard 
          label="Est. Revenue"
          value={formatCurrency(tickerData.revenue)}
          sub="Gross Revenue (IDR)"
          valueColor="green"
        />
        <MetricCard 
          label="Avg Occupancy"
          value={`${tickerData.avgOccupancy}%`}
          sub="640 National Studios"
          valueColor={tickerData.avgOccupancy < 60 ? 'orange' : 'default'}
        />
        <MetricCard 
          label="Hourly Trend"
          value={tickerData.trend === 'up' ? '↑ UP' : tickerData.trend === 'down' ? '↓ DOWN' : '→ STEADY'}
          sub="Based on booking pace"
          valueColor={tickerData.trend === 'up' ? 'green' : tickerData.trend === 'down' ? 'crimson' : 'default'}
        />
      </div>

      {/* City Table */}
      <div className="space-y-4">
        <div className="text-[11px] font-mono font-bold text-ink-tertiary uppercase tracking-widest pl-2">CITIES WITH HIGHEST OCCUPANCY</div>
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
            DATA UPDATED EVERY 4–6 HOURS FROM TIX ID, M-TIX, AND CGV.
         </div>
         <p className="text-[12px] text-ink-tertiary italic max-w-lg">
            Last updated: {new Date().toLocaleString('en-US')} WIB. 
            Occupancy projections are calculated using KALA's predictive model based on current booking velocity.
         </p>
      </div>
    </div>
  );
}

