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
        lastUpdated: 'Baru saja',
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
          sub="Harian · Terakumulasi"
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
          sub="640 Studio Nasional"
          valueColor={tickerData.avgOccupancy < 60 ? 'orange' : 'default'}
        />
        <MetricCard 
          label="Trend Per Jam"
          value={tickerData.trend === 'up' ? '↑ NAIK' : tickerData.trend === 'down' ? '↓ TURUN' : '→ STABIL'}
          sub="Berdasarkan booking pace"
          valueColor={tickerData.trend === 'up' ? 'green' : tickerData.trend === 'down' ? 'crimson' : 'default'}
        />
      </div>

      {/* City Table */}
      <div className="space-y-4">
        <div className="text-[11px] font-mono font-bold text-ink-tertiary uppercase tracking-widest pl-2">KOTA DENGAN OCCUPANCY TERTINGGI</div>
        <div className="bg-black-4 border border-border-subtle rounded-card-lg overflow-hidden pb-4">
          <div className="grid grid-cols-[1fr_200px_80px_60px_100px] gap-6 px-6 py-4 border-b border-border-subtle text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest bg-black-3/50">
            <div>Kota</div>
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
            DATA DIPERBARUI SETIAP 4–6 JAM DARI TIX ID, M-TIX, DAN CGV.
         </div>
         <p className="text-[12px] text-ink-tertiary italic max-w-lg">
            Terakhir diperbarui: {new Date().toLocaleString('id-ID')} WIB. 
            Proyeksi occupancy dihitung menggunakan model prediktif KALA berdasarkan velocity booking saat ini.
         </p>
      </div>
    </div>
  );
}

