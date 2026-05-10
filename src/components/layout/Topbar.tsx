import React from 'react';
import { useLocation } from 'react-router-dom';
import { useFilmContext } from '../../hooks/useFilmContext';
import { cn } from '../../lib/utils';

export default function Topbar() {
  const location = useLocation();
  const { activeFilm } = useFilmContext();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Overview';
    if (path.includes('campaigns')) return 'Campaigns';
    if (path.includes('audience-dna')) return 'AudienceDNA™';
    if (path.includes('box-predict')) return 'BoxPredict™';
    if (path.includes('live-ticker')) return 'Live Ticker';
    if (path.includes('fib')) return 'FIB Generator';
    return '';
  };

  const today = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const userInitial = "A"; // Mock user

  return (
    <header className="h-14 bg-black-2 border-b border-border-subtle sticky top-0 z-30 flex items-center justify-between px-6 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-[15px] font-semibold text-ink-primary">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-kala animate-pulse-dot" />
          <span className="text-[10px] font-mono text-green-kala">LIVE</span>
        </div>
        
        <span className="text-[12px] font-medium text-ink-tertiary">{today}</span>

        <div className="flex items-center gap-3 pl-6 border-l border-border-subtle">
           <div className="w-7 h-7 rounded-full bg-crimson-surface flex items-center justify-center border border-crimson/20">
             <span className="text-[12px] font-mono font-bold text-crimson uppercase">{userInitial}</span>
           </div>
        </div>
      </div>
    </header>
  );
}
