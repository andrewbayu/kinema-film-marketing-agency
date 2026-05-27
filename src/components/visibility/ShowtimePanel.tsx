import React, { useMemo, useState } from 'react';
import { Film, MapPin, Building2, TrendingUp, TrendingDown, RefreshCw, ChevronDown, ChevronUp, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ShowtimeSnapshot } from '../../lib/types';
import { cn } from '../../lib/utils';
import { InfoTooltip } from '../ui/InfoTooltip';
import { computeShowtimeDeltas } from '../../lib/showtimeDeltas';
import { generateShowtimeSummary, ShowtimeDeltaSummary } from '../../lib/gemini';

interface ShowtimePanelProps {
  snapshot: ShowtimeSnapshot | null;
  history: ShowtimeSnapshot[];
  filmTitle: string;
  isDeepCityScanning: boolean;
  onDeepCityScan: () => void;
}

const PHASE_LABELS = {
  'pre-release': { label: 'Showtime Allocation', tag: 'Industry confidence (pre-release)', color: 'text-blue-400' },
  'release-week': { label: 'Opening Distribution', tag: 'Release week deployment', color: 'text-amber-400' },
  'post-release': { label: 'Showtime Velocity', tag: 'Demand response (post-release)', color: 'text-green-400' }
};

export function ShowtimePanel({ snapshot, history, filmTitle, isDeepCityScanning, onDeepCityScan }: ShowtimePanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  const [summary, setSummary] = useState<ShowtimeDeltaSummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const delta = useMemo(() => computeShowtimeDeltas(history), [history]);

  const toggleCity = (city: string) => {
    setExpandedCities(prev => {
      const next = new Set(prev);
      if (next.has(city)) next.delete(city);
      else next.add(city);
      return next;
    });
  };

  const handleGenerateSummary = async () => {
    if (!delta?.hasComparison) return;
    setIsGeneratingSummary(true);
    setSummaryError(null);
    try {
      const result = await generateShowtimeSummary(filmTitle, delta);
      setSummary(result);
    } catch (err: any) {
      setSummaryError(err?.message || 'Gagal generate AI summary.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

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
  const hasDelta = delta?.hasComparison === true;
  const isPositive = hasDelta ? (delta!.totalDelta >= 0) : ((snapshot.velocity ?? 0) >= 0);
  const velocityValue = hasDelta ? delta!.totalDeltaPct : (snapshot.velocity ?? 0);

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
        {hasDelta ? (
          <StatCard
            label={`Δ vs ${delta!.gapLabel}`}
            value={`${isPositive ? '+' : ''}${velocityValue}%`}
            info={`Perubahan total showtimes dibanding snapshot ${delta!.gapLabel}. Positif = bioskop tambah jam tayang (demand naik). Negatif = jam tayang dipotong.`}
            accent={isPositive ? "text-green-500" : "text-crimson"}
            icon={isPositive ? TrendingUp : TrendingDown}
          />
        ) : (
          <StatCard
            label="Δ Day-over-Day"
            value="—"
            info="Butuh snapshot dari hari sebelumnya untuk hitung delta. Scan lagi besok untuk lihat perubahan alokasi per kota."
            accent="text-ink-tertiary"
          />
        )}
      </div>

      {/* Top Cities & Top Chains */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border-subtle/30">
        <div className="space-y-3">
          <h5 className="text-[10px] font-mono font-black text-ink-tertiary uppercase tracking-widest flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            Top Cities
            {hasDelta && (
              <span className="text-ink-tertiary/60 normal-case tracking-normal font-mono text-[9px]">
                · Δ vs {delta!.gapLabel}
              </span>
            )}
          </h5>
          <div className="space-y-2">
            {snapshot.byCity.slice(0, 5).map(c => {
              const pct = (c.count / snapshot.totalShows) * 100;
              const cityDelta = hasDelta ? delta!.cities.find(d => d.city === c.city) : undefined;
              const cinemaDeltas = hasDelta ? delta!.cinemasByCity[c.city] : undefined;
              const isCityExpanded = expandedCities.has(c.city);
              const canExpand = hasDelta && cinemaDeltas && cinemaDeltas.length > 0;
              return (
                <div key={c.city} className="space-y-1">
                  <button
                    onClick={() => canExpand && toggleCity(c.city)}
                    disabled={!canExpand}
                    className={cn(
                      "w-full flex justify-between items-center text-[11px] gap-2",
                      canExpand && "hover:text-ink-primary cursor-pointer"
                    )}
                  >
                    <span className="text-ink-secondary capitalize flex items-center gap-1.5 min-w-0">
                      {canExpand && (isCityExpanded
                        ? <ChevronUp className="w-3 h-3 text-ink-tertiary flex-shrink-0" />
                        : <ChevronDown className="w-3 h-3 text-ink-tertiary flex-shrink-0" />
                      )}
                      <span className="truncate">{c.city}</span>
                    </span>
                    <span className="flex items-center gap-2 flex-shrink-0">
                      {cityDelta && <DeltaBadge delta={cityDelta.delta} />}
                      <span className="text-ink-tertiary font-mono">{c.count} shows</span>
                    </span>
                  </button>
                  <div className="h-1.5 bg-black-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      className="h-full bg-gradient-to-r from-crimson to-crimson-rich"
                    />
                  </div>
                  <AnimatePresence>
                    {canExpand && isCityExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 ml-4 pl-3 border-l border-border-subtle/40 space-y-1.5 py-1">
                          {cinemaDeltas!.slice(0, 8).map(cin => (
                            <div key={`${cin.cinema}-${cin.city}`} className="flex justify-between items-center gap-2 text-[10px]">
                              <span className="text-ink-tertiary truncate flex-1">{cin.cinema}</span>
                              <span className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-ink-tertiary/60 font-mono">
                                  {cin.previousCount}→{cin.currentCount}
                                </span>
                                <DeltaBadge delta={cin.delta} compact />
                              </span>
                            </div>
                          ))}
                          {cinemaDeltas!.length > 8 && (
                            <div className="text-[9px] text-ink-tertiary/50 italic pt-1">
                              + {cinemaDeltas!.length - 8} bioskop lainnya
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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

      {/* AI Summary */}
      <div className="pt-4 border-t border-border-subtle/30">
        {!summary && !isGeneratingSummary && !summaryError && (
          <div className="flex items-center justify-between gap-4 p-4 bg-black-2/50 border border-border-subtle/30 rounded-lg">
            <div className="flex items-start gap-3 min-w-0">
              <Sparkles className="w-4 h-4 text-crimson flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-[11px] font-black text-ink-primary uppercase tracking-wider">AI Summary</div>
                <div className="text-[10px] text-ink-tertiary mt-0.5 leading-relaxed">
                  {hasDelta
                    ? `Generate ringkasan eksekutif 3 poin perubahan alokasi vs ${delta!.gapLabel}.`
                    : 'Butuh minimal 2 hari snapshot untuk generate summary. Scan lagi besok.'}
                </div>
              </div>
            </div>
            <button
              onClick={handleGenerateSummary}
              disabled={!hasDelta}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex-shrink-0",
                hasDelta
                  ? "bg-crimson hover:bg-crimson-rich text-white"
                  : "bg-black-3 text-ink-tertiary cursor-not-allowed"
              )}
            >
              <Sparkles className="w-3 h-3" />
              Generate
            </button>
          </div>
        )}
        {isGeneratingSummary && (
          <div className="flex items-center gap-3 p-4 bg-black-2/50 border border-border-subtle/30 rounded-lg">
            <RefreshCw className="w-4 h-4 text-crimson animate-spin" />
            <span className="text-[11px] text-ink-secondary italic">Menganalisis perubahan alokasi...</span>
          </div>
        )}
        {summaryError && (
          <div className="flex items-start gap-3 p-4 bg-crimson/5 border border-crimson/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-crimson flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold text-crimson">Gagal generate summary</div>
              <div className="text-[10px] text-ink-tertiary mt-1">{summaryError}</div>
              <button
                onClick={handleGenerateSummary}
                className="mt-2 text-[10px] font-black uppercase tracking-wider text-crimson hover:text-crimson-rich"
              >
                Coba lagi →
              </button>
            </div>
          </div>
        )}
        {summary && (
          <div className="p-4 bg-black-2/50 border border-border-subtle/30 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-crimson" />
                <span className="text-[11px] font-black text-ink-primary uppercase tracking-wider">AI Summary</span>
                <span className="text-[9px] text-ink-tertiary font-mono">
                  · {new Date(summary.generatedAt).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                </span>
              </div>
              <button
                onClick={handleGenerateSummary}
                className="text-[9px] font-mono text-ink-tertiary hover:text-crimson uppercase tracking-wider"
              >
                Regenerate
              </button>
            </div>
            <ol className="space-y-2.5">
              {summary.points.map((point, i) => (
                <li key={i} className="flex gap-3 text-[11px] text-ink-secondary leading-relaxed">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-crimson/10 text-crimson text-[10px] font-black flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
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

function DeltaBadge({ delta, compact = false }: { delta: number; compact?: boolean }) {
  if (delta === 0) {
    return (
      <span className={cn(
        "font-mono font-black rounded",
        compact ? "text-[8px] px-1" : "text-[9px] px-1.5 py-0.5",
        "bg-ink-tertiary/10 text-ink-tertiary"
      )}>
        ±0
      </span>
    );
  }
  const positive = delta > 0;
  return (
    <span className={cn(
      "font-mono font-black rounded inline-flex items-center gap-0.5",
      compact ? "text-[8px] px-1" : "text-[9px] px-1.5 py-0.5",
      positive ? "bg-green-500/10 text-green-500" : "bg-crimson/10 text-crimson"
    )}>
      {positive ? '↑' : '↓'}{Math.abs(delta)}
    </span>
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
