import React, { useState } from 'react';
import { Film, MapPin, Building2, TrendingUp, TrendingDown, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ShowtimeSnapshot } from '../../lib/types';
import { cn } from '../../lib/utils';
import { InfoTooltip } from '../ui/InfoTooltip';

interface ShowtimePanelProps {
  snapshot: ShowtimeSnapshot | null;
  isDeepCityScanning: boolean;
  onDeepCityScan: () => void;
}

const PHASE_LABELS = {
  'pre-release': { label: 'Showtime Allocation', tag: 'Industry confidence (pre-release)', color: 'text-blue-400' },
  'release-week': { label: 'Opening Distribution', tag: 'Release week deployment', color: 'text-amber-400' },
  'post-release': { label: 'Showtime Velocity', tag: 'Demand response (post-release)', color: 'text-green-400' }
};

export function ShowtimePanel({ snapshot, isDeepCityScanning, onDeepCityScan }: ShowtimePanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (!snapshot || snapshot.totalShows === 0) {
    return (
      <div className="bg-black-1 border border-border-subtle rounded-card p-8">
        <div className="flex items-center gap-3 mb-4">
          <Film className="w-5 h-5 text-crimson" />
          <h4 className="text-[16px] font-black text-ink-primary uppercase italic">Showtime Allocation</h4>
          <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-green-500/10 text-green-500">✓ jadwalnonton.com</span>
        </div>
        <p className="text-[12px] text-ink-tertiary italic leading-relaxed">
          Belum ada jadwal terdeteksi di jadwalnonton.com untuk film ini. Biasanya cinema baru memuat jadwal H-14 sampai H-7 sebelum release. Coba scan lagi mendekati tanggal release.
        </p>
      </div>
    );
  }

  const phase = PHASE_LABELS[snapshot.phase];
  const velocity = snapshot.velocity ?? 0;
  const isPositive = velocity >= 0;

  return (
    <div className="bg-black-1 border border-border-subtle rounded-card p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Film className="w-5 h-5 text-crimson" />
            <h4 className="text-[16px] font-black text-ink-primary uppercase italic">{phase.label}</h4>
            <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-green-500/10 text-green-500">
              ✓ jadwalnonton.com
            </span>
          </div>
          <div className={cn("text-[10px] font-mono uppercase tracking-wider", phase.color)}>
            {phase.tag}
            {snapshot.daysToRelease !== undefined && snapshot.daysToRelease !== null && (
              <span className="ml-2 text-ink-tertiary">
                · {snapshot.daysToRelease > 0 ? `H-${snapshot.daysToRelease}` : snapshot.daysToRelease === 0 ? 'H-0 (release day)' : `D+${Math.abs(snapshot.daysToRelease)}`}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onDeepCityScan}
          disabled={isDeepCityScanning}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
            isDeepCityScanning
              ? "bg-black-3 text-ink-tertiary cursor-not-allowed"
              : "bg-black-2 border border-border-subtle hover:border-crimson/50 text-ink-tertiary hover:text-crimson"
          )}
        >
          {isDeepCityScanning ? <RefreshCw className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
          {isDeepCityScanning ? 'Scanning all cities...' : 'Scan All Cities'}
        </button>
      </div>

      {/* Key Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Shows"
          value={snapshot.totalShows.toLocaleString('id-ID')}
          info="Total showtimes terhitung dari semua bioskop + format yang ter-scan."
          accent="text-ink-primary"
        />
        <StatCard
          label="Cinemas"
          value={snapshot.totalCinemas.toLocaleString('id-ID')}
          info="Jumlah bioskop unik yang memutar film ini."
          accent="text-ink-primary"
        />
        <StatCard
          label="Cities"
          value={snapshot.totalCities.toLocaleString('id-ID')}
          info={snapshot.scanMode === 'default' ? "Hanya Jakarta yang ter-scan (default mode). Klik 'Scan All Cities' untuk Tier-1 nasional." : "Kota unik dengan jadwal aktif."}
          accent="text-ink-primary"
        />
        <StatCard
          label="Velocity"
          value={`${isPositive ? '+' : ''}${velocity}%`}
          info="Perubahan total showtimes vs snapshot terakhir. Positif = bioskop tambah jam tayang (demand naik). Negatif = jam tayang dipotong."
          accent={isPositive ? "text-green-500" : "text-crimson"}
          icon={isPositive ? TrendingUp : TrendingDown}
        />
      </div>

      {/* Top Cities & Top Chains */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border-subtle/30">
        <div className="space-y-3">
          <h5 className="text-[10px] font-mono font-black text-ink-tertiary uppercase tracking-widest flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            Top Cities
          </h5>
          <div className="space-y-2">
            {snapshot.byCity.slice(0, 5).map(c => {
              const pct = (c.count / snapshot.totalShows) * 100;
              return (
                <div key={c.city} className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-ink-secondary capitalize">{c.city}</span>
                    <span className="text-ink-tertiary font-mono">{c.count} shows</span>
                  </div>
                  <div className="h-1.5 bg-black-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      className="h-full bg-gradient-to-r from-crimson to-crimson-rich"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <h5 className="text-[10px] font-mono font-black text-ink-tertiary uppercase tracking-widest flex items-center gap-2">
            <Building2 className="w-3 h-3" />
            Cinema Chains
          </h5>
          <div className="space-y-2">
            {snapshot.byChain.slice(0, 5).map(c => {
              const pct = (c.count / snapshot.totalShows) * 100;
              return (
                <div key={c.chain} className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-ink-secondary">{c.chain}</span>
                    <span className="text-ink-tertiary font-mono">{c.count} shows</span>
                  </div>
                  <div className="h-1.5 bg-black-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tier breakdown */}
      <div className="grid grid-cols-4 gap-2 pt-4 border-t border-border-subtle/30">
        {(['regular', 'premium', 'imax', 'other'] as const).map(tier => (
          <div key={tier} className="bg-black-2 p-3 rounded-lg border border-border-subtle/30 text-center">
            <div className="text-[18px] font-black text-ink-primary font-mono">{snapshot.byTier[tier] || 0}</div>
            <div className="text-[8px] text-ink-tertiary uppercase font-bold tracking-wider mt-1">{tier === 'imax' ? 'IMAX' : tier}</div>
          </div>
        ))}
      </div>

      {/* Expandable cinema list */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-black-2 border border-border-subtle/50 rounded-lg hover:border-crimson/30 transition-colors"
      >
        <span className="text-[11px] font-mono font-black text-ink-tertiary uppercase tracking-wider">
          {expanded ? 'Hide' : 'Show'} cinema-level breakdown ({snapshot.shows.length} entries)
        </span>
        {expanded ? <ChevronUp className="w-4 h-4 text-ink-tertiary" /> : <ChevronDown className="w-4 h-4 text-ink-tertiary" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
              {snapshot.shows.map((s, i) => (
                <div key={`${s.cinema}-${s.format}-${i}`} className="flex justify-between items-start gap-4 p-3 bg-black-2/50 border border-border-subtle/30 rounded-lg text-[11px]">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-ink-secondary truncate">{s.cinema}</div>
                    <div className="text-ink-tertiary text-[10px] flex items-center gap-2 mt-0.5">
                      <span>{s.city}</span>
                      <span>·</span>
                      <span className="text-crimson/80">{s.format}</span>
                      {s.price > 0 && <><span>·</span><span>Rp {s.price.toLocaleString('id-ID')}</span></>}
                    </div>
                  </div>
                  <div className="text-ink-tertiary text-[10px] font-mono text-right flex-shrink-0">
                    {s.showtimes.length} {s.showtimes.length === 1 ? 'show' : 'shows'}
                    <div className="text-ink-tertiary/60 text-[9px] mt-0.5">{s.showtimes.slice(0, 3).join(' · ')}{s.showtimes.length > 3 && ` +${s.showtimes.length - 3}`}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, info, accent = 'text-ink-primary', icon: Icon }: { label: string; value: string; info?: string; accent?: string; icon?: any }) {
  return (
    <div className="bg-black-2 p-4 rounded-lg border border-border-subtle/30 space-y-1">
      <div className="text-[9px] font-mono font-bold text-ink-tertiary uppercase tracking-wider flex items-center gap-1">
        {label}
        {info && <InfoTooltip content={info} />}
      </div>
      <div className={cn("text-[24px] font-black font-mono leading-none flex items-center gap-1", accent)}>
        {Icon && <Icon className="w-4 h-4" />}
        {value}
      </div>
    </div>
  );
}
