import React, { useEffect } from 'react';
import { 
  TrendingUp, 
  Search, 
  Share2, 
  MessageSquare, 
  Clock, 
  Zap, 
  AlertCircle,
  BarChart3,
  Globe,
  RefreshCw,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFilmContext } from '../hooks/useFilmContext';
import { useAuth } from '../hooks/useAuth';
import { dbService } from '../services/dbService';
import { performVisibilityScan } from '../lib/gemini';
import { VisibilityTrackerResult } from '../lib/types';
import { cn } from '../lib/utils';
import { formatBigNumber } from '../lib/format';
import LoadingOverlay from '../components/ui/LoadingOverlay';

import { useVisibilityTracker } from '../hooks/useVisibilityTracker';
import { MetricCard } from '../components/visibility/MetricCard';
import { InfoTooltip } from '../components/ui/InfoTooltip';
import { ShowtimePanel } from '../components/visibility/ShowtimePanel';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const METRIC_INFO = {
  searchMomentum: "Sinyal REAL: minat pencarian Google Trends Indonesia (indeks relatif 0–100, 7 hari terakhir). Ini proxy demand — BUKAN jumlah tiket. Yang penting bentuk kurvanya: naik = momentum membangun jelang rilis, turun = mendingin.",
  p50Admissions: "Estimasi jumlah penonton (tiket terjual) berdasarkan performa film sejenis dalam database benchmark KINEMA.",
  visibilityGap: "Selisih antara reach saat ini dengan target reach yang dibutuhkan. Angka negatif menunjukkan campaign perlu akselerasi strategis.",
  readiness: "Status kesiapan campaign mencapai target plateau 7 hari sebelum tayang perdana. Titik kritis penentu kesuksesan opening weekend."
};

export default function VisibilityTracker() {
  const { activeFilm } = useFilmContext();
  const { isAdmin } = useAuth();
  const {
    loading,
    error,
    setError,
    latestScan,
    history,
    cooldown,
    isAutoScanning,
    isBackfilling,
    latestShowtime,
    showtimeHistory,
    isDeepCityScanning,
    handleDeepScan,
    handleBackfill,
    handleDeepCityScan
  } = useVisibilityTracker(activeFilm);

  // Automated Scanning Logic (Every 4 hours)
  useEffect(() => {
    if (activeFilm && cooldown === null && !loading && !isAutoScanning) {
      handleDeepScan(true); 
    }
  }, [activeFilm, cooldown]);

  if (!activeFilm) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <Globe className="w-16 h-16 text-black-3 mb-4" />
        <h2 className="text-2xl font-black text-ink-primary uppercase tracking-tighter">No Campaign Selected</h2>
        <p className="text-ink-tertiary max-w-sm">Please select an active campaign to monitor visibility metrics.</p>
      </div>
    );
  }

  const sentimentData = latestScan?.sentiment ? [
    { name: 'Positive', value: latestScan.sentiment.positive || 0, color: '#22c55e' },
    { name: 'Neutral', value: latestScan.sentiment.neutral || 0, color: '#94a3b8' },
    { name: 'Negative', value: latestScan.sentiment.negative || 0, color: '#ef4444' }
  ] : [];

  // Pacing-to-P50 data prep.
  // Hero series = the REAL daily Google Trends interest (0-100). Source: latest
  // scan's searchTrend if present; if the Trends API was down on the latest scan
  // (empty array), walk back through history to the most recent scan that DID
  // capture a series, and show it with a "stale" badge so it's not silently
  // out-of-date. Note: Google Trends normalizes the window so its peak == 100, so
  // what's meaningful here is the SHAPE (rising vs cooling), not the absolute level.
  const seriesSource = (() => {
    const found = history.find(h => (h.searchTrend ?? []).length > 0);
    if (!found) return { trend: [] as Array<{ date: string; value: number }>, isStale: false, sourceDate: undefined as string | undefined };
    const isLatest = found.lastScanAt === latestScan?.lastScanAt;
    return { trend: found.searchTrend ?? [], isStale: !isLatest, sourceDate: found.lastScanAt };
  })();

  const searchSeries = seriesSource.trend
    .filter(p => p && p.date)
    .map(p => ({ timestamp: new Date(p.date).getTime(), value: Math.max(0, Math.round(p.value || 0)) }))
    .filter(p => !Number.isNaN(p.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);

  const hasSeries = searchSeries.length > 0;
  const currentInterest = hasSeries ? searchSeries[searchSeries.length - 1].value : 0;
  const firstInterest = hasSeries ? searchSeries[0].value : 0;
  const interestDelta = currentInterest - firstInterest;
  const peakPoint = hasSeries
    ? searchSeries.reduce((m, p) => (p.value > m.value ? p : m), searchSeries[0])
    : null;

  // Pacing context (real, from prior tools — BoxPredict P50 + release-date math).
  const daysToH7 = latestScan?.trajectory?.daysToH7 ?? 0;
  const requiredDailyGrowth = latestScan?.trajectory?.requiredDailyGrowth ?? 0;
  const p50Target = latestScan?.funnel?.p50Target ?? 0;
  const targetPeakDate = latestScan?.trajectory?.targetPeakDate;

  // Honest momentum: compound daily growth of the REAL interest series over its
  // window, vs the growth the trajectory says is required to hit readiness by H-7.
  const windowDays = hasSeries
    ? Math.max(1, (searchSeries[searchSeries.length - 1].timestamp - searchSeries[0].timestamp) / 86400000)
    : 0;
  const realDailyGrowth = !hasSeries
    ? 0
    : firstInterest > 0
      ? Math.round((Math.pow(Math.max(1, currentInterest) / firstInterest, 1 / windowDays) - 1) * 100)
      : (currentInterest > 0 ? 100 : 0);
  const paceStatus: 'on-track' | 'at-risk' | 'critical' =
    !hasSeries ? 'critical'
      : realDailyGrowth >= requiredDailyGrowth ? 'on-track'
        : realDailyGrowth >= requiredDailyGrowth * 0.5 ? 'at-risk'
          : 'critical';
  const paceStatusMeta = {
    'on-track': { label: 'ON TRACK', dot: 'bg-green-500', color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30' },
    'at-risk': { label: 'AT RISK', dot: 'bg-yellow-500', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
    'critical': { label: 'CRITICAL', dot: 'bg-crimson', color: 'text-crimson', bg: 'bg-crimson/10', border: 'border-crimson/30' },
  }[paceStatus];

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  const formatDateStr = (s?: string) =>
    s ? new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const formatCooldown = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 font-sans">
      <LoadingOverlay 
        isVisible={loading} 
        type="forge" 
        title="Deep Scanning Content Visibility" 
        subtitle="Tracking search patterns, social buzz, and Indonesian media coverage..."
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-crimson/10 text-crimson px-2 py-0.5 rounded font-bold uppercase tracking-wider">Experimental</span>
            <div className="text-[10px] font-mono font-black text-crimson tracking-[0.3em] uppercase">Proactive Peak Engine™</div>
          </div>
          <h1 className="text-[48px] font-black text-ink-primary tracking-tighter leading-none uppercase">
            Market Visibility Index
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {(activeFilm?.title?.toLowerCase().includes("garuda") || isAdmin) && (
            <button
              onClick={handleBackfill}
              disabled={isBackfilling}
              className="bg-black-2 border border-border-subtle hover:border-crimson/50 text-[10px] font-black text-ink-tertiary hover:text-crimson px-4 py-2 rounded-lg transition-all flex items-center gap-2 group"
            >
              {isBackfilling ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <TrendingUp className="w-3 h-3 group-hover:scale-110 transition-transform" />
              )}
              {isBackfilling ? 'RESTORING...' : 'RESTORE HISTORICAL DATA (MAY 1-16)'}
            </button>
          )}
          <AnimatePresence>
            {isAutoScanning && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-crimson animate-pulse"
              >
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">Background Syncing...</span>
              </motion.div>
            )}
          </AnimatePresence>
          {cooldown !== null && (
            <div className="flex items-center gap-2 bg-black-2 px-4 py-2 rounded-full border border-border-subtle">
              <Clock className="w-4 h-4 text-ink-tertiary" />
              <span className="text-[11px] font-mono font-bold text-ink-secondary">NEXT AUTO-SYNC: {formatCooldown(cooldown)}</span>
            </div>
          )}
          <button 
            onClick={() => handleDeepScan(false)}
            disabled={loading || cooldown !== null}
            className={cn(
              "flex items-center gap-3 px-8 py-4 rounded-button font-black text-[14px] uppercase tracking-wider transition-all",
              (loading || cooldown !== null) 
                ? "bg-black-3 text-ink-tertiary cursor-not-allowed" 
                : "bg-crimson text-white hover:bg-crimson-rich shadow-xl shadow-crimson/20"
            )}
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
            Force Deep Scan
          </button>
        </div>
      </div>

      {!latestScan && !loading && !isAutoScanning ? (
        <div className="bg-black-1 border border-border-subtle rounded-card p-20 text-center space-y-6">
          <div className="mx-auto w-24 h-24 bg-crimson/5 rounded-full flex items-center justify-center">
            <Globe className="w-10 h-10 text-crimson animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-ink-primary uppercase italic">Initialize Visibility Engine</h3>
            <p className="text-ink-tertiary max-w-md mx-auto">
              Run a baseline scan to measure your film's presence across Google Trends, Social Media (TikTok/IG), and Indonesian News outlets.
            </p>
          </div>
          <button 
            onClick={() => handleDeepScan(false)}
            className="px-10 py-5 bg-crimson text-white rounded-button font-black uppercase shadow-2xl hover:scale-105 transition-transform"
          >
            Run Baseline Scan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Column: Key Stats & Funnel */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Market Reach Evolution Graph */}
            <div className="bg-black-1 border border-border-subtle rounded-card p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-crimson" />
                    <h4 className="text-[10px] font-mono font-black text-ink-tertiary tracking-widest uppercase">Pacing to P50 · Search Momentum</h4>
                  </div>
                  <div className="text-[28px] font-black text-ink-primary italic uppercase tracking-tighter flex items-center">
                    Search Interest Trend
                    <InfoTooltip content={METRIC_INFO.searchMomentum} />
                  </div>
                </div>

                <div className={cn("flex items-center gap-2 px-4 py-2 rounded-full border", paceStatusMeta.bg, paceStatusMeta.border)}>
                  <span className={cn("w-2 h-2 rounded-full", paceStatusMeta.dot)} />
                  <span className={cn("text-[11px] font-black tracking-widest uppercase", paceStatusMeta.color)}>{paceStatusMeta.label}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mb-4 text-[10px] font-mono uppercase tracking-wider text-ink-tertiary">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-crimson"></span>
                  Minat (Google Trends ID · 7 hari)
                </span>
                <span>H-7 plateau: <span className="text-ink-secondary font-bold">{formatDateStr(targetPeakDate)}</span></span>
                <span>Rilis: <span className="text-ink-secondary font-bold">{formatDateStr(activeFilm?.releaseDate)}</span></span>
              </div>

              {seriesSource.isStale && (
                <div className="mb-3 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-amber-400">
                  <AlertCircle className="w-3 h-3" />
                  <span>Trends API down · menampilkan data per <span className="font-bold">{formatDateStr(seriesSource.sourceDate)}</span></span>
                </div>
              )}

              <div className="h-[300px] w-full">
                {!hasSeries ? (
                  <div className="h-full w-full flex flex-col items-center justify-center text-center space-y-3 bg-black-2/30 rounded-xl border border-dashed border-border-subtle/50">
                    <Globe className="w-8 h-8 text-ink-tertiary/40" />
                    <div className="space-y-1">
                      <div className="text-[11px] font-black text-ink-secondary uppercase tracking-wider">Belum Ada Data Tren</div>
                      <div className="text-[10px] text-ink-tertiary italic max-w-xs">
                        Jalankan deep scan untuk memuat kurva minat Google Trends 7 hari terakhir.
                      </div>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={searchSeries} margin={{ top: 16, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ee1d23" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ee1d23" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis
                        dataKey="timestamp"
                        type="number"
                        scale="time"
                        domain={['dataMin', 'dataMax']}
                        stroke="#ffffff20"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#94a3b8' }}
                        tickFormatter={formatDate}
                      />
                      <YAxis
                        stroke="#ffffff20"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#94a3b8' }}
                        domain={[0, 100]}
                        tickFormatter={(val) => `${val}`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '8px' }}
                        labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px' }}
                        labelFormatter={(ts: number) => formatDate(ts)}
                        formatter={(val: number) => [`${val}/100`, 'Minat']}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        name="value"
                        stroke="#ee1d23"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorInterest)"
                        animationDuration={1200}
                        dot={searchSeries.length <= 10 ? { r: 3, fill: '#ee1d23', stroke: '#ee1d23' } : false}
                        activeDot={{ r: 6, fill: '#ee1d23', stroke: '#fff', strokeWidth: 2 }}
                      />
                      {peakPoint && (
                        <ReferenceLine
                          x={peakPoint.timestamp}
                          stroke="#eab308"
                          strokeDasharray="4 4"
                          label={{ value: `Puncak ${peakPoint.value}`, fill: '#eab308', fontSize: 9, position: 'top' }}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-border-subtle/30">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-ink-tertiary uppercase flex items-center">
                    Minat Saat Ini
                    <InfoTooltip content={METRIC_INFO.searchMomentum} />
                  </div>
                  <div className="text-[28px] font-black text-ink-primary font-mono leading-none">
                    {currentInterest}<span className="text-[14px] text-ink-tertiary">/100</span>
                  </div>
                  <div className={cn("text-[10px] font-bold", interestDelta >= 0 ? 'text-green-500' : 'text-crimson')}>
                    {interestDelta >= 0 ? '+' : ''}{interestDelta} vs awal window
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-ink-tertiary uppercase">Momentum / Hari</div>
                  <div className={cn("text-[28px] font-black font-mono leading-none", realDailyGrowth >= requiredDailyGrowth ? 'text-green-500' : 'text-yellow-500')}>
                    {realDailyGrowth >= 0 ? '+' : ''}{realDailyGrowth}%
                  </div>
                  <div className="text-[10px] text-ink-tertiary">butuh +{requiredDailyGrowth}%/hari</div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-ink-tertiary uppercase flex items-center">
                    Target Admissions (P50)
                    <InfoTooltip content={METRIC_INFO.p50Admissions} />
                  </div>
                  {p50Target > 0 ? (
                    <div className="text-[28px] font-black text-ink-primary font-mono leading-none">{formatBigNumber(p50Target)}</div>
                  ) : (
                    <div className="text-[13px] font-bold text-ink-tertiary italic pt-2">Jalankan BoxPredict dulu</div>
                  )}
                  <div className="text-[10px] text-ink-tertiary">tiket · skenario base</div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-ink-tertiary uppercase flex items-center">
                    Hari ke H-7
                    <InfoTooltip content={METRIC_INFO.readiness} />
                  </div>
                  <div className="text-[28px] font-black text-ink-primary font-mono leading-none">
                    {daysToH7}<span className="text-[14px] text-ink-tertiary">h</span>
                  </div>
                  <div className="text-[10px] text-ink-tertiary">rilis {formatDateStr(activeFilm?.releaseDate)}</div>
                </div>
              </div>
            </div>

            {/* Reverse Funnel Strategy Section */}
            {latestScan?.funnel && (
              <div className="bg-black-1 border border-border-subtle rounded-card p-8">
                <div className="flex items-center gap-3 mb-8">
                  <BarChart3 className="w-5 h-5 text-crimson" />
                  <h4 className="text-[16px] font-black text-ink-primary uppercase italic">Revenue Alignment: Reverse P50 Funnel</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-black-2 p-5 rounded-xl border border-border-subtle hover:border-crimson/30 transition-colors">
                    <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase mb-2">
                      Target Admissions (P50)
                      <InfoTooltip content={METRIC_INFO.p50Admissions} />
                    </div>
                    <div className="text-[28px] font-black text-ink-primary italic">
                      {formatBigNumber(latestScan.funnel.p50Target || 0)}
                    </div>
                    <div className="text-[10px] text-ink-tertiary mt-1 italic">Indonesian Benchmark Entry</div>
                  </div>
                  
                  <div className="bg-black-2 p-5 rounded-xl border border-border-subtle hover:border-crimson/30 transition-colors">
                    <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase mb-2">Required Reach</div>
                    <div className="text-[28px] font-black text-ink-primary italic">
                      {formatBigNumber(latestScan.funnel.requiredAwareness || 0)}
                    </div>
                    <div className="text-[10px] text-green-500 font-bold mt-1">Goal for H-7 Plateau</div>
                  </div>

                  <div className="bg-black-3 p-6 rounded-xl border border-border-subtle md:col-span-2 space-y-4">
                     <div className="flex justify-between items-center">
                       <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase italic">
                         Visibility Gap to P50
                         <InfoTooltip content={METRIC_INFO.visibilityGap} />
                       </div>
                       <div className="text-[16px] font-black text-crimson">-{latestScan?.funnel?.gapToP50 || 0}%</div>
                     </div>
                     <div className="h-3 bg-black-1 rounded-full overflow-hidden border border-border-subtle/30">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(0, 100 - (latestScan?.funnel?.gapToP50 || 0))}%` }}
                          className="h-full bg-crimson shadow-[0_0_20px_rgba(238,29,35,0.4)]" 
                        />
                     </div>
                     <div className="flex items-center justify-between text-[10px] font-medium text-ink-tertiary uppercase font-mono">
                        <span>Current System Health</span>
                        <span className="text-crimson animate-pulse">Required Velocity: {latestScan?.trajectory?.requiredDailyGrowth || 0}% / day</span>
                     </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="p-4 bg-crimson/5 border border-crimson/20 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-crimson mb-1">
                         <Zap className="w-4 h-4" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Growth Scenario</span>
                      </div>
                      <p className="text-[12px] text-ink-secondary leading-relaxed">
                        Sistem mendeteksi konversi <span className="text-ink-primary font-bold">Awareness to Interest</span> sebesar <span className="text-ink-primary font-bold">{latestScan?.funnel?.conversionRates?.awarenessToInterest || 0}%</span>. 
                        Butuh peningkatan intensitas di TikTok & IG untuk mencapai peak sebelum <span className="text-ink-primary font-bold">{latestScan?.trajectory?.targetPeakDate ? new Date(latestScan.trajectory.targetPeakDate).toLocaleDateString() : 'H-7'}</span>.
                      </p>
                   </div>
                   <div className="p-4 bg-black-2 border border-border-subtle rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-ink-tertiary mb-1">
                         <Search className="w-4 h-4" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Benchmarking Data</span>
                      </div>
                      <p className="text-[12px] text-ink-tertiary italic leading-relaxed">
                        "{latestScan.benchmarkContext}"
                      </p>
                   </div>
                </div>
              </div>
            )}

            {/* Showtime Allocation Panel (jadwalnonton.com) */}
            <ShowtimePanel
              snapshot={latestShowtime}
              history={showtimeHistory}
              filmTitle={activeFilm.title}
              isDeepCityScanning={isDeepCityScanning}
              onDeepCityScan={handleDeepCityScan}
            />

            {/* Grounding Evidence: Transparency Log */}
            <div className="bg-black-1 border border-border-subtle rounded-card p-8">
               <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-crimson" />
                    <h4 className="text-[14px] font-black text-ink-primary uppercase italic">Grounding Evidence Log</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-mono text-ink-tertiary uppercase tracking-wider">Live Grounding Active</span>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {latestScan?.evidencePoints?.map((ev, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-black-2/50 border border-border-subtle/50 rounded-xl hover:border-crimson/30 transition-all group relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-1 bg-crimson/10 border-bl border-crimson/20 rounded-bl">
                          <span className="text-[8px] font-black text-crimson uppercase px-1">Detected</span>
                       </div>
                       <div className="p-2.5 bg-black-1 rounded-lg border border-border-subtle h-fit">
                          <ChevronRight className="w-3 h-3 text-crimson group-hover:translate-x-1 transition-transform" />
                       </div>
                       <div className="space-y-1 pr-4">
                          <div className="text-[12px] font-bold text-ink-primary group-hover:text-crimson transition-colors">{ev.dataPoint}</div>
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] font-black text-crimson/70 uppercase tracking-tighter">{ev.source}</span>
                             <span className="text-[9px] text-ink-tertiary opacity-50 font-mono">•</span>
                             <span className="text-[9px] text-ink-tertiary font-mono">{new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="mt-6 flex items-center gap-2 p-3 bg-black-2 rounded-lg border border-dashed border-border-subtle/50">
                  <AlertCircle className="w-4 h-4 text-ink-tertiary opacity-50" />
                  <p className="text-[10px] text-ink-tertiary italic">
                    Data dikumpulkan melalui penelusuran mandiri oleh Peak Engine™. Angka pengikut/interaksi yang sangat tinggi seringkali merupakan akumulasi kumulatif di pasar lokal.
                  </p>
               </div>
            </div>
          </div>

          {/* Right Column: Platform Heatmaps & Trends */}
          <div className="space-y-8">
            
            {/* Trajectory Analysis Card */}
            {latestScan?.trajectory && (
              <div className={cn(
                "bg-black-1 border rounded-card p-6 space-y-4",
                latestScan.trajectory.status === 'on-track' ? "border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.05)]" : "border-crimson/30 shadow-[0_0_20px_rgba(238,29,35,0.05)]"
              )}>
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-mono font-black text-ink-tertiary tracking-[0.2em] uppercase leading-none">
                    H-7 READINESS
                    <InfoTooltip content={METRIC_INFO.readiness} />
                  </h4>
                  <div className={cn(
                    "text-[10px] font-black uppercase px-2 py-1 rounded",
                    latestScan.trajectory.status === 'on-track' ? "bg-green-500/10 text-green-500" : "bg-crimson/10 text-crimson"
                  )}>
                    {latestScan.trajectory.status}
                  </div>
                </div>
                
                <div className="space-y-1">
                   <div className="text-[32px] font-black text-ink-primary italic">-{latestScan.trajectory.daysToH7} DAYS</div>
                   <p className="text-[10px] text-ink-tertiary uppercase font-mono">Until Target Peak Plateau</p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-border-subtle/30">
                  <div className="space-y-1">
                    <div className="text-[18px] font-black text-ink-primary font-mono leading-none">+{latestScan.trajectory.requiredDailyGrowth}%</div>
                    <div className="text-[8px] text-ink-tertiary uppercase font-bold tracking-wider">Required Velocity</div>
                  </div>
                  <div className="space-y-1">
                    <div className={cn(
                      "text-[18px] font-black font-mono leading-none",
                      latestScan.trajectory.currentVelocity >= latestScan.trajectory.requiredDailyGrowth ? "text-green-500" : "text-crimson"
                    )}>
                      +{latestScan.trajectory.currentVelocity}%
                    </div>
                    <div className="text-[8px] text-ink-tertiary uppercase font-bold tracking-wider">Actual Velocity</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                   <TrendingUp className={cn(
                     "w-4 h-4",
                     latestScan.trajectory.status === 'on-track' ? "text-green-500" : "text-crimson"
                   )} />
                   <p className="text-[11px] text-ink-secondary italic font-medium leading-normal">
                     Target H-7: <span className="text-ink-primary font-bold">{new Date(latestScan.trajectory.targetPeakDate).toLocaleDateString()}</span>
                   </p>
                </div>
              </div>
            )}

            {/* Core Metrics */}
            <div className="space-y-4">
              <MetricCard
                label="Search Volume"
                value={latestScan?.metrics?.searchVolume || 0}
                icon={Search}
                desc="Google Trends Index (0-100)"
                info="Skor minat pencarian dari Google Trends Indonesia (7 hari terakhir). 0 = tidak ada minat terdeteksi, 100 = puncak periode."
                source="verified"
                sourceLabel="Google Trends ID"
              />
              <MetricCard
                label="Social Buzz"
                value={latestScan?.metrics?.socialBuzz || 0}
                icon={Share2}
                desc="TikTok/IG estimated buzz"
                info="Estimasi intensitas percakapan di TikTok/IG/X. Belum terhubung ke API platform — angka adalah estimasi AI berdasarkan KOL list di AudienceDNA + narasi web."
                source="ai-estimate"
                sourceLabel="AI Est."
              />
              <MetricCard
                label="Media Hits"
                value={latestScan?.metrics?.mediaHits || 0}
                icon={MessageSquare}
                desc="Artikel terdeteksi (Firecrawl)"
                info="Jumlah artikel rill yang menyebut film ini, dihitung via Firecrawl site-search di seluruh media universe (mainstream + niche) yang dipetakan oleh AudienceDNA."
                source="verified"
                sourceLabel="Firecrawl"
              />
              <MetricCard
                label="Share of Voice"
                value={latestScan?.metrics?.shareOfVoice || 0}
                icon={BarChart3}
                desc="vs kompetitor (estimasi)"
                info="Estimasi AI seberapa dominan film ini dibanding kompetitor genre serupa. Masih estimasi — belum ada data SOV terverifikasi."
                source="ai-estimate"
                sourceLabel="AI Est."
              />
            </div>

            {/* Sentiment Circle */}
            <div className="bg-black-1 border border-border-subtle rounded-card p-6 space-y-6">
              <h4 className="text-[11px] font-mono font-black text-ink-tertiary tracking-[0.2em] uppercase">
                Audience Sentiment
                <InfoTooltip content="Analisis sentimen positif, netral, dan negatif dari komentar publik di berbagai platform." />
              </h4>
              <div className="h-[150px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[18px] font-black text-ink-primary leading-none">{latestScan?.sentiment?.positive || 0}%</span>
                  <span className="text-[8px] text-ink-tertiary uppercase font-mono">Positive</span>
                </div>
              </div>
            </div>

            {/* Platform Performance List */}
            <div className="bg-black-1 border border-border-subtle rounded-card p-6 space-y-6">
               <h4 className="text-[11px] font-mono font-black text-ink-tertiary tracking-[0.2em] uppercase">
                 Platform Health
                 <InfoTooltip content="Tingkat visibilitas dan kesehatan kampanye di masing-masing platform spesifik." />
               </h4>
               <div className="space-y-6">
                  {latestScan?.platformPerformance?.map((p, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                         <div className="text-[12px] font-bold text-ink-primary">{p.platform}</div>
                         <div className={cn(
                            "text-[8px] font-bold uppercase px-1.5 py-0.5 rounded",
                            p.sentiment === 'Positive' ? "bg-green-500/10 text-green-500" :
                            p.sentiment === 'Negative' ? "bg-red-500/10 text-red-500" :
                            "bg-ink-tertiary/10 text-ink-tertiary"
                          )}>
                            {p.sentiment}
                          </div>
                      </div>
                      <div className="h-1.5 bg-black-2 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${p.buzzLevel}%` }}
                          className="h-full bg-crimson" 
                        />
                      </div>
                      {p.topContent && (
                        <p className="text-[10px] text-ink-tertiary leading-tight italic truncate">
                           "{p.topContent}"
                        </p>
                      )}
                    </div>
                  ))}
               </div>
            </div>

          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-crimson/10 border border-crimson/50 rounded flex items-center gap-3 text-crimson">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}
    </div>
  );
}
