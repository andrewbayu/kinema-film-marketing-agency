import React, { useState, useEffect } from 'react';
import BoxPredictForm from '../components/forms/BoxPredictForm';
import ScenarioCard from '../components/ui/ScenarioCard';
import SensitivityBar from '../components/ui/SensitivityBar';
import { runBoxPredict } from '../lib/gemini';
import { useFilmContext } from '../hooks/useFilmContext';
import { BoxPredictInput, BoxPredictResult } from '../lib/types';
import { TrendingUp, AlertTriangle, ChevronRight, FileDown, Info, BrainCircuit, Users, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { dbService } from '../services/dbService';

export default function BoxPredict() {
  const navigate = useNavigate();
  const { audienceDNAOutput, boxPredictOutput, setBoxPredictOutput, activeFilm } = useFilmContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          releaseWindow: data.releaseWindow,
          logline: data.logline,
          leadCast: data.leadCast,
          ipType: data.ipType,
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
        <BoxPredictForm onSubmit={handlePredict} isLoading={loading} />
        {error && (
          <div className="mt-6 p-4 bg-crimson-surface border border-crimson/20 rounded-card-sm text-crimson text-[13px] font-medium flex gap-2">
            <Info className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
      </section>

      {/* Results Section */}
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
                 <p className="text-[14px] text-ink-tertiary max-w-sm">Calculating multipliers, competition, and audience resonance... (est. 8 seconds)</p>
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

                   <div className="pt-6 border-t border-border-subtle space-y-3">
                      <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest">WINDOW RECOMMENDATION</div>
                      <p className="text-[13px] text-green-kala font-medium leading-relaxed">
                        {boxPredictOutput.releaseWindowRecommendation}
                      </p>
                   </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex gap-4">
                 <button 
                  onClick={() => navigate(`/fib/${activeFilm?.id || 'new'}`)}
                  className="px-12 py-4 bg-crimson text-white rounded-button font-bold flex items-center justify-center gap-2 hover:bg-crimson-rich transition-colors uppercase tracking-wide"
                 >
                   Generate FIB Generator →
                 </button>
                 <button className="px-8 py-4 bg-transparent border border-border-strong text-ink-primary rounded-button font-bold flex items-center justify-center gap-2 hover:bg-white/5 transition-colors uppercase tracking-wide">
                    <FileDown className="w-5 h-5" />
                    Export BoxPredict Report
                 </button>
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
  );
}

