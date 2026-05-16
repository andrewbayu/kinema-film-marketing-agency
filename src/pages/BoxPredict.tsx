import React, { useState, useEffect, useRef } from 'react';
import BoxPredictForm from '../components/forms/BoxPredictForm';
import ScenarioCard from '../components/ui/ScenarioCard';
import SensitivityBar from '../components/ui/SensitivityBar';
import { runBoxPredict } from '../lib/gemini';
import { useFilmContext } from '../hooks/useFilmContext';
import { BoxPredictInput, BoxPredictResult } from '../lib/types';
import { TrendingUp, AlertTriangle, ChevronRight, FileDown, Info, BrainCircuit, Users, History, Loader2, Printer, ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { dbService } from '../services/dbService';
import { toPng } from 'html-to-image';
import LoadingOverlay from '../components/ui/LoadingOverlay';

export default function BoxPredict() {
  const navigate = useNavigate();
  const { audienceDNAOutput, boxPredictOutput, setBoxPredictOutput, activeFilm } = useFilmContext();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Load latest result if available for active film
  useEffect(() => {
    if (activeFilm?.id && !boxPredictOutput) {
      loadLatestPredict();
    }
  }, [activeFilm?.id]);

  const loadLatestPredict = async () => {
    if (!activeFilm) return;
    try {
      const latest = await dbService.getLatestBoxPredict(activeFilm.id);
      if (latest) setBoxPredictOutput(latest);
    } catch (err) {
      console.error("Error loading latest predict", err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportImage = async () => {
    if (!reportRef.current || !boxPredictOutput) return;
    
    setExporting(true);
    // Brief delay to ensure any animations or rendering are finished
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const element = reportRef.current;
      
      const dataUrl = await toPng(element, {
        quality: 1,
        backgroundColor: '#0a0a0a',
        pixelRatio: 2,
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          margin: '0',
          padding: '0',
        },
        filter: (node: HTMLElement) => {
          const classList = node.classList;
          return classList ? !classList.contains('print-hidden') : true;
        }
      });
      
      const link = document.createElement('a');
      link.download = `KINEMA-BoxPredict-${activeFilm?.title.replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Image Export failed", err);
    } finally {
      setExporting(false);
    }
  };

  const handlePredict = async (data: BoxPredictInput) => {
    if (!audienceDNAOutput) return;
    
    setLoading(true);
    setError(null);
    try {
      // Competitors string to array
      const formattedData = {
        ...data,
        competitors: typeof data.competitors === 'string' ? (data.competitors as string).split(',').map(s => s.trim()) : data.competitors
      };

      const result = await runBoxPredict(
        {
          title: data.title,
          genre: data.genre,
          budgetTier: data.budgetTier,
          logline: data.logline,
          leadCast: data.leadCast,
          ipType: data.ipType,
          director: data.director,
          releaseWindow: data.releaseWindow,
          releaseDate: data.releaseDate
        },
        formattedData,
        audienceDNAOutput
      );
      setBoxPredictOutput(result);

      // Save to Firestore if we have an active film
      if (activeFilm?.id) {
        await dbService.saveBoxPredict(activeFilm.id, result);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to run BoxPredict™ simulation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!audienceDNAOutput) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6 max-w-2xl mx-auto">
        <div className="w-20 h-20 rounded-full bg-crimson-surface border border-crimson/20 flex items-center justify-center">
           <Users className="w-10 h-10 text-crimson" />
        </div>
        <div className="space-y-2">
          <h2 className="text-[20px] font-bold text-ink-primary">AudienceDNA™ Incomplete</h2>
          <p className="text-[14px] text-ink-tertiary">
            BoxPredict™ requires audience context for accurate simulations. 
            Please run AudienceDNA™ analysis first.
          </p>
        </div>
        <button 
          onClick={() => navigate('/audience-dna')}
          className="px-8 py-3 bg-crimson text-white rounded-button font-bold hover:bg-crimson-rich transition-all flex items-center gap-2"
        >
          Go to AudienceDNA™
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      <LoadingOverlay 
        isVisible={loading}
        type="predict"
        title="Simulating Box Office"
        subtitle="Calculating admissions scenarios and market sentiment sensitivity..."
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-[20px] font-bold text-ink-primary">BoxPredict™ Simulation</h2>
          <p className="text-[13px] text-ink-tertiary">Predict admissions & optimize releases through AI scenario simulations.</p>
        </div>
        {activeFilm && (
          <span className="text-[10px] font-mono bg-crimson/10 text-crimson px-2 py-1 rounded border border-crimson/20">
            CAMPAIGN: {activeFilm.title}
          </span>
        )}
      </div>

      {/* Form Section */}
      <section className="bg-black-4 border border-border-subtle p-8 rounded-card-lg relative">
        <BoxPredictForm onSubmit={handlePredict} isLoading={loading} initialData={activeFilm} />
        {error && (
          <div className="mt-8 p-6 bg-crimson-surface/40 border border-crimson/20 rounded-card-lg text-crimson flex flex-col items-center text-center gap-4">
            <AlertTriangle className="w-8 h-8 opacity-50" />
            <div className="space-y-1">
              <h4 className="text-[15px] font-bold uppercase tracking-tight">Simulation Failed</h4>
              <p className="text-[13px] text-ink-secondary max-w-sm">
                BoxPredict™ failed to complete the analysis. This is often due to high demand or complex market data retrieval.
              </p>
            </div>
            <button 
              onClick={() => {
                const form = document.querySelector('form');
                if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
              }}
              className="px-6 py-2 bg-crimson text-white rounded-button text-[12px] font-bold hover:bg-crimson-rich transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </section>

      {/* Results Section */}
      <div ref={reportRef} className="bg-black p-8 rounded-card-lg border border-border-subtle">
        <AnimatePresence mode="wait">
        {loading ? (
             <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 flex flex-col items-center justify-center space-y-6"
             >
               <div className="relative">
                  <div className="w-20 h-20 border-4 border-crimson-surface border-t-crimson rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <TrendingUp className="w-8 h-8 text-crimson animate-pulse" />
                  </div>
               </div>
               <div className="text-center space-y-2">
                 <h3 className="text-[18px] font-bold text-ink-primary">AI Analyzing Scenario</h3>
                 <p className="text-[14px] text-ink-tertiary max-w-sm">Calculating multipliers, competition, and audience resonance... (est. 15–25 seconds)</p>
                 <div className="flex justify-center gap-1 mt-2">
                   <motion.div 
                     animate={{ opacity: [0.3, 1, 0.3] }} 
                     transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                     className="w-1.5 h-1.5 bg-crimson rounded-full" 
                   />
                   <motion.div 
                     animate={{ opacity: [0.3, 1, 0.3] }} 
                     transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                     className="w-1.5 h-1.5 bg-crimson rounded-full" 
                   />
                   <motion.div 
                     animate={{ opacity: [0.3, 1, 0.3] }} 
                     transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                     className="w-1.5 h-1.5 bg-crimson rounded-full" 
                   />
                 </div>
               </div>
             </motion.div>
          ) : boxPredictOutput ? (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              <div className="grid grid-cols-3 gap-8">
                <ScenarioCard type="bear" data={boxPredictOutput.scenarios.bear} />
                <ScenarioCard type="base" data={boxPredictOutput.scenarios.base} />
                <ScenarioCard type="bull" data={boxPredictOutput.scenarios.bull} />
              </div>

              <div className="grid grid-cols-[1fr_400px] gap-8">
                {/* Sensitivity Analysis */}
                <div className="bg-black-4 border border-border-subtle rounded-card-lg p-8 space-y-8">
                   <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                     <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest">SENSITIVITY ANALYSIS</div>
                     <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black-6 border border-border-subtle rounded font-mono text-[9px] text-ink-tertiary">
                       <History className="w-3 h-3" />
                       AUTOSAVED
                     </div>
                   </div>
                   <div className="space-y-6">
                      {boxPredictOutput.sensitivity.map((s, i) => (
                        <div key={i}><SensitivityBar label={s.dimension} impact={s.impact} direction={s.direction} /></div>
                      ))}
                   </div>
                </div>

                {/* Risk Flags */}
                <div className="bg-black-4 border border-border-subtle rounded-card-lg p-8 space-y-6">
                   <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest border-b border-border-subtle pb-4">RISK FLAGS & ALERTS</div>
                   <div className="space-y-4">
                      {boxPredictOutput.riskFlags.map((flag, i) => (
                        <div key={i} className="flex gap-3 text-[13px] text-ink-primary font-medium p-3 bg-black-3 border border-border-default rounded-card-sm">
                           <AlertTriangle className="w-4 h-4 text-orange-kala shrink-0 mt-0.5" />
                           {flag}
                        </div>
                      ))}
                   </div>

                   <div className="pt-6 border-t border-border-subtle space-y-4">
                      {boxPredictOutput.weeklyDecayRate && (
                        <div>
                          <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest mb-1">STABILIZATION PREDICTION</div>
                          <div className="flex items-center gap-2">
                             <div className="text-[20px] font-bold text-ink-primary font-mono tracking-tighter">{boxPredictOutput.weeklyDecayRate}</div>
                             <div className="text-[10px] text-ink-tertiary uppercase leading-tight">Est. Weekly<br/>Hold Drop</div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest">WINDOW RECOMMENDATION</div>
                        <p className="text-[13px] text-green-kala font-medium leading-relaxed">
                          {boxPredictOutput.releaseWindowRecommendation}
                        </p>
                      </div>

                      {boxPredictOutput.geographicalTargeting && (
                         <div className="space-y-3 pt-2">
                           <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest">GEO TARGETING</div>
                           <div className="flex flex-wrap gap-2">
                              {boxPredictOutput.geographicalTargeting.map((city, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-white/5 border border-border-subtle rounded text-[11px] text-ink-secondary">
                                  {city}
                                </span>
                              ))}
                           </div>
                         </div>
                      )}
                   </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col md:flex-row gap-6 pt-8 border-t border-border-subtle print:hidden">
                 <div className="flex-1 space-y-4">
                    <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest px-1">NEXT PHASE</div>
                    <button 
                      onClick={() => navigate(`/fib/${activeFilm?.id || 'new'}`)}
                      className="w-full md:w-auto px-12 py-5 bg-crimson text-white rounded-button font-bold flex items-center justify-center gap-2 hover:bg-crimson-rich transition-all uppercase tracking-wide shadow-lg shadow-crimson/20"
                    >
                      Generate FIB Generator →
                    </button>
                 </div>

                 <div className="space-y-4">
                    <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest px-1">EXPORT REPORT</div>
                    <div className="flex gap-2">
                      <button 
                        onClick={handlePrint}
                        className="px-6 py-4 bg-white/5 border border-border-strong text-ink-primary rounded-button font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors uppercase tracking-wide text-[12px]"
                      >
                        <Printer className="w-4 h-4" />
                        Print PDF
                      </button>
                      <button 
                        onClick={handleExportImage}
                        disabled={exporting}
                        className="px-6 py-4 bg-white/5 border border-border-strong text-ink-primary rounded-button font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors uppercase tracking-wide text-[12px] disabled:opacity-50"
                      >
                        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                        {exporting ? 'Exporting...' : 'PNG'}
                      </button>
                    </div>
                 </div>
              </div>
            </motion.div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-black-3/30 border border-dashed border-border-subtle rounded-card-lg">
              <div className="w-16 h-16 rounded-full bg-black-4 flex items-center justify-center border border-border-subtle">
                 <TrendingUp className="w-8 h-8 text-ink-tertiary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[16px] font-bold text-ink-secondary">Ready for simulation</h3>
                <p className="text-[13px] text-ink-tertiary">Click the button above to run the box office prediction.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

