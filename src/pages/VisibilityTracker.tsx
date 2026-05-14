import React, { useState, useEffect } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFilmContext } from '../hooks/useFilmContext';
import { dbService } from '../services/dbService';
import { performVisibilityScan } from '../lib/gemini';
import { VisibilityTrackerResult } from '../lib/types';
import { cn } from '../lib/utils';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function VisibilityTracker() {
  const { activeFilm } = useFilmContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestScan, setLatestScan] = useState<VisibilityTrackerResult | null>(null);
  const [history, setHistory] = useState<VisibilityTrackerResult[]>([]);
  const [cooldown, setCooldown] = useState<number | null>(null);
  const [isAutoScanning, setIsAutoScanning] = useState(false);

  useEffect(() => {
    if (activeFilm?.id) {
      loadVisibilityData();
    }
  }, [activeFilm?.id]);

  // Automated Scanning Logic (Every 4 hours)
  useEffect(() => {
    if (activeFilm && cooldown === null && !loading && !isAutoScanning) {
      console.log("Autonomous Scan Triggered: Cooldown expired.");
      handleDeepScan(true); // true = auto mode
    }
  }, [activeFilm, cooldown]);

  useEffect(() => {
    if (cooldown !== null && cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown(prev => (prev && prev > 0) ? prev - 1 : null);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const loadVisibilityData = async () => {
    if (!activeFilm?.id) return;
    try {
      setLoading(true);
      const data = await dbService.getLatestVisibilityScan(activeFilm.id);
      if (data) {
        setLatestScan(data);
        // Calculate cooldown
        const lastScanDate = new Date(data.lastScanAt);
        const fourHoursInMs = 4 * 60 * 60 * 1000;
        const diff = Date.now() - lastScanDate.getTime();
        if (diff < fourHoursInMs) {
          setCooldown(Math.ceil((fourHoursInMs - diff) / 1000));
        } else {
          setCooldown(null); // Explicitly null to trigger auto-scan
        }
      } else {
        setCooldown(null); // No data, trigger first scan
      }
      
      const historyData = await dbService.getVisibilityHistory(activeFilm.id);
      setHistory(historyData);
    } catch (err) {
      console.error("Error loading visibility data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeepScan = async (isAuto = false) => {
    if (!activeFilm || (cooldown !== null && !isAuto)) return;

    try {
      if (isAuto) setIsAutoScanning(true);
      else setLoading(true);
      
      setError(null);

      // Fetch benchmark data if exists
      const benchmark = await dbService.getLatestBoxPredict(activeFilm.id);
      const result = await performVisibilityScan(activeFilm, benchmark || undefined);
      
      // Save to Firebase
      await dbService.saveVisibilityScan(activeFilm.id, result);
      
      setLatestScan(result);
      setHistory(prev => [result, ...prev]);
      
      // Reset cooldown to 4 hours
      setCooldown(4 * 3600);
    } catch (err: any) {
      if (!isAuto) setError(err.message || "Failed to perform visibility scan.");
      console.error("Scan Error:", err);
    } finally {
      setLoading(false);
      setIsAutoScanning(false);
    }
  };

  if (!activeFilm) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <Globe className="w-16 h-16 text-black-3 mb-4" />
        <h2 className="text-2xl font-black text-ink-primary uppercase tracking-tighter">No Campaign Selected</h2>
        <p className="text-ink-tertiary max-w-sm">Please select an active campaign to monitor visibility metrics.</p>
      </div>
    );
  }

  const formatCooldown = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const sentimentData = latestScan ? [
    { name: 'Positive', value: latestScan.sentiment.positive, color: '#22c55e' },
    { name: 'Neutral', value: latestScan.sentiment.neutral, color: '#94a3b8' },
    { name: 'Negative', value: latestScan.sentiment.negative, color: '#ef4444' }
  ] : [];

  const sortedHistory = [...history]
    .filter(h => h && h.lastScanAt)
    .sort((a, b) => new Date(a.lastScanAt).getTime() - new Date(b.lastScanAt).getTime());

  // Chart domain logic
  const chartData = sortedHistory.map(h => ({
    ...h,
    timestamp: new Date(h.lastScanAt).getTime()
  }));

  const xDomain = chartData.length > 1 
    ? ['auto', 'auto'] 
    : chartData.length === 1 
      ? [chartData[0].timestamp - 86400000, chartData[0].timestamp + 86400000] // +/- 1 day for 1 point
      : [0, 0];

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
            
            {/* Funnel Stage Health */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Awareness Card */}
               <div className="bg-black-1 border border-border-subtle rounded-card p-8 group hover:border-crimson/20 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-mono font-black text-ink-tertiary tracking-widest uppercase">Stage 01: Awareness</h4>
                      <div className="text-[28px] font-black text-ink-primary italic">MARKET REACH</div>
                    </div>
                    <div className="p-3 bg-black-2 rounded-xl">
                       <Globe className="w-6 h-6 text-crimson" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                       <span className="text-[40px] font-black text-ink-primary font-mono leading-none">
                         {((latestScan?.funnel?.currentAwareness || 0) >= 1000000 
                           ? `${((latestScan?.funnel?.currentAwareness || 0) / 1000000).toFixed(1)}JT`
                           : (latestScan?.funnel?.currentAwareness || 0).toLocaleString('id-ID'))}
                       </span>
                       <div className="text-right">
                          <div className="text-[10px] font-bold text-ink-tertiary uppercase">Target Reach</div>
                          <div className="text-[14px] font-black text-ink-secondary">
                            {((latestScan?.funnel?.requiredAwareness || 0) >= 1000000
                              ? `${((latestScan?.funnel?.requiredAwareness || 0) / 1000000).toFixed(1)}JT`
                              : (latestScan?.funnel?.requiredAwareness || 0).toLocaleString('id-ID'))}
                          </div>
                       </div>
                    </div>
                    <div className="h-3 bg-black-2 rounded-full overflow-hidden border border-border-subtle/30">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, ((latestScan?.funnel?.currentAwareness || 0) / (latestScan?.funnel?.requiredAwareness || 1)) * 100)}%` }}
                        className="h-full bg-gradient-to-r from-crimson to-crimson-rich shadow-[0_0_15px_rgba(238,29,35,0.3)]" 
                       />
                    </div>
                    <p className="text-[11px] text-ink-tertiary italic leading-relaxed">
                      Film ini membutuhkan reach sebesar <span className="text-ink-primary font-bold">
                        {((latestScan?.funnel?.requiredAwareness || 0) >= 1000000
                          ? `${((latestScan?.funnel?.requiredAwareness || 0) / 1000000).toFixed(1)}JT`
                          : (latestScan?.funnel?.requiredAwareness || 0).toLocaleString('id-ID'))}
                      </span> unik di Indonesia untuk mengamankan skenario P50.
                    </p>
                  </div>
               </div>

               {/* Interest Card */}
               <div className="bg-black-1 border border-border-subtle rounded-card p-8 group hover:border-crimson/20 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-mono font-black text-ink-tertiary tracking-widest uppercase">Stage 02: Interest</h4>
                      <div className="text-[28px] font-black text-ink-primary italic">ENGAGED AUDIENCE</div>
                    </div>
                    <div className="p-3 bg-black-2 rounded-xl">
                       <Zap className="w-6 h-6 text-crimson" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                       <span className="text-[40px] font-black text-ink-primary font-mono leading-none">
                         {latestScan?.visibilityScore}%
                       </span>
                       <div className="text-right">
                          <div className="text-[10px] font-bold text-ink-tertiary uppercase">Indeks Konversi</div>
                          <div className="text-[14px] font-black text-ink-secondary">+{latestScan?.trajectory?.currentVelocity}%</div>
                       </div>
                    </div>
                    <div className="h-3 bg-black-2 rounded-full overflow-hidden border border-border-subtle/30">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${latestScan?.visibilityScore || 0}%` }}
                        className="h-full bg-gradient-to-r from-green-500 to-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)]" 
                       />
                    </div>
                    <p className="text-[11px] text-ink-tertiary italic leading-relaxed">
                      Ketertarikan audiens saat ini berada pada level <span className="text-ink-primary font-bold">{latestScan?.visibilityScore}%</span> dari ambang batas optimal peluncuran.
                    </p>
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
                    <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase mb-2">Target Admissions (P50)</div>
                    <div className="text-[28px] font-black text-ink-primary italic">
                      {((latestScan.funnel.p50Target || 0) >= 1000000
                        ? `${((latestScan.funnel.p50Target || 0) / 1000000).toFixed(1)}JT`
                        : (latestScan.funnel.p50Target || 0).toLocaleString('id-ID'))}
                    </div>
                    <div className="text-[10px] text-ink-tertiary mt-1 italic">Indonesian Benchmark Entry</div>
                  </div>
                  
                  <div className="bg-black-2 p-5 rounded-xl border border-border-subtle hover:border-crimson/30 transition-colors">
                    <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase mb-2">Required Reach</div>
                    <div className="text-[28px] font-black text-ink-primary italic">
                      {((latestScan.funnel.requiredAwareness || 0) >= 1000000
                        ? `${((latestScan.funnel.requiredAwareness || 0) / 1000000).toFixed(1)}JT`
                        : (latestScan.funnel.requiredAwareness || 0).toLocaleString('id-ID'))}
                    </div>
                    <div className="text-[10px] text-green-500 font-bold mt-1">Goal for H-7 Plateau</div>
                  </div>

                  <div className="bg-black-3 p-6 rounded-xl border border-border-subtle md:col-span-2 space-y-4">
                     <div className="flex justify-between items-center">
                       <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase italic">Visibility Gap to P50</div>
                       <div className="text-[16px] font-black text-crimson">-{latestScan.funnel.gapToP50}%</div>
                     </div>
                     <div className="h-3 bg-black-1 rounded-full overflow-hidden border border-border-subtle/30">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(0, 100 - latestScan.funnel.gapToP50)}%` }}
                          className="h-full bg-crimson shadow-[0_0_20px_rgba(238,29,35,0.4)]" 
                        />
                     </div>
                     <div className="flex items-center justify-between text-[10px] font-medium text-ink-tertiary uppercase font-mono">
                        <span>Current System Health</span>
                        <span className="text-crimson animate-pulse">Required Velocity: {latestScan.trajectory?.requiredDailyGrowth}% / day</span>
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
                        Sistem mendeteksi konversi <span className="text-ink-primary font-bold">Awareness to Interest</span> sebesar <span className="text-ink-primary font-bold">{latestScan.funnel.conversionRates.awarenessToInterest}%</span>. 
                        Butuh peningkatan intensitas di TikTok & IG untuk mencapai peak sebelum <span className="text-ink-primary font-bold">{latestScan.trajectory?.targetPeakDate ? new Date(latestScan.trajectory.targetPeakDate).toLocaleDateString() : 'H-7'}</span>.
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

            {/* Grounding Evidence: Transparency Log */}
            <div className="bg-black-1 border border-border-subtle rounded-card p-8">
               <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-ink-tertiary" />
                    <h4 className="text-[14px] font-black text-ink-primary uppercase italic">Grounding Evidence Log</h4>
                  </div>
                  <span className="text-[10px] font-mono text-ink-tertiary uppercase">Real-Time Data Sources</span>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {latestScan?.evidencePoints?.map((ev, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-black-2 border border-border-subtle/50 rounded-xl hover:border-crimson/30 transition-colors group">
                       <div className="p-2.5 bg-black-1 rounded-lg border border-border-subtle h-fit">
                          <ChevronRight className="w-3 h-3 text-crimson group-hover:translate-x-1 transition-transform" />
                       </div>
                       <div className="space-y-1">
                          <div className="text-[12px] font-bold text-ink-primary">{ev.dataPoint}</div>
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] font-mono text-ink-tertiary uppercase">{ev.source}</span>
                             <span className="text-[9px] text-ink-tertiary opacity-50">•</span>
                             <span className="text-[9px] text-ink-tertiary">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                          </div>
                       </div>
                    </div>
                  ))}
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
                  <h4 className="text-[11px] font-mono font-black text-ink-tertiary tracking-[0.2em] uppercase leading-none">H-7 READINESS</h4>
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
                value={latestScan?.metrics.searchVolume || 0} 
                icon={Search} 
                desc="Indonesian Intent Index"
              />
              <MetricCard 
                label="Social Buzz" 
                value={latestScan?.metrics.socialBuzz || 0} 
                icon={Share2} 
                desc="TikTok/IG Velocity"
              />
              <MetricCard 
                label="Media Hits" 
                value={latestScan?.metrics.mediaHits || 0} 
                icon={MessageSquare} 
                desc="PR News Coverage"
              />
              <MetricCard 
                label="Share of Voice" 
                value={latestScan?.metrics.shareOfVoice || 0} 
                icon={BarChart3} 
                desc="Competitive Dominance"
              />
            </div>

            {/* Sentiment Circle */}
            <div className="bg-black-1 border border-border-subtle rounded-card p-6 space-y-6">
              <h4 className="text-[11px] font-mono font-black text-ink-tertiary tracking-[0.2em] uppercase">Audience Sentiment</h4>
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
                  <span className="text-[18px] font-black text-ink-primary leading-none">{latestScan?.sentiment.positive}%</span>
                  <span className="text-[8px] text-ink-tertiary uppercase font-mono">Positive</span>
                </div>
              </div>
            </div>

            {/* Platform Performance List */}
            <div className="bg-black-1 border border-border-subtle rounded-card p-6 space-y-6">
               <h4 className="text-[11px] font-mono font-black text-ink-tertiary tracking-[0.2em] uppercase">Platform Health</h4>
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

function MetricCard({ label, value, icon: Icon, desc }: { label: string, value: number, icon: any, desc: string }) {
  return (
    <div className="bg-black-1 border border-border-subtle rounded-card p-4 group hover:border-crimson/30 transition-all flex items-center gap-4">
      <div className="p-2.5 bg-black-2 rounded-lg border border-border-subtle group-hover:bg-crimson/10 group-hover:border-crimson/30 transition-colors">
        <Icon className="w-4 h-4 text-ink-secondary group-hover:text-crimson transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold text-ink-tertiary uppercase tracking-wider truncate">{label}</h4>
          <span className="text-[18px] font-black text-ink-primary font-mono">{value}</span>
        </div>
        <p className="text-[10px] text-ink-tertiary truncate">{desc}</p>
      </div>
    </div>
  );
}
