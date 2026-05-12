import React, { useState, useEffect, useRef } from 'react';
import FilmProfileForm from '../components/forms/FilmProfileForm';
import SegmentCard from '../components/ui/SegmentCard';
import { runAudienceDNA } from '../lib/gemini';
import { useFilmContext } from '../hooks/useFilmContext';
import { FilmProfileInput, AudienceDNAResult } from '../lib/types';
import { Users, Info, ChevronRight, FileDown, BrainCircuit, History, AlertTriangle, Loader2, Printer, ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { dbService } from '../services/dbService';
import { toPng } from 'html-to-image';
import LoadingOverlay from '../components/ui/LoadingOverlay';

export default function AudienceDNA() {
  const navigate = useNavigate();
  const { audienceDNAOutput, setAudienceDNAOutput, activeFilm } = useFilmContext();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Load latest result if available for active film
  useEffect(() => {
    if (activeFilm?.id && !audienceDNAOutput) {
      loadLatestDNA();
    }
  }, [activeFilm?.id]);

  const loadLatestDNA = async () => {
    if (!activeFilm) return;
    try {
      const latest = await dbService.getLatestAudienceDNA(activeFilm.id);
      if (latest) setAudienceDNAOutput(latest);
    } catch (err) {
      console.error("Error loading latest DNA", err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportImage = async () => {
    if (!reportRef.current || !audienceDNAOutput) return;
    
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
        // Filtering out any problematic nodes if necessary
        filter: (node: HTMLElement) => {
          const classList = node.classList;
          return classList ? !classList.contains('print-hidden') : true;
        }
      });
      
      const link = document.createElement('a');
      link.download = `KINEMA-AudienceDNA-${activeFilm?.title.replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Image Export failed", err);
    } finally {
      setExporting(false);
    }
  };

  const handleAnalyze = async (data: FilmProfileInput) => {
    setLoading(true);
    setError(null);
    try {
      const result = await runAudienceDNA(data);
      setAudienceDNAOutput(result);
      
      // Save to Firestore if we have an active film
      if (activeFilm?.id) {
        await dbService.saveAudienceDNA(activeFilm.id, result);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to run AI analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-[380px_1fr] gap-8 h-full max-w-7xl mx-auto">
      <LoadingOverlay 
        isVisible={loading} 
        type="audience"
        title="Analyzing Audience DNA"
        subtitle="Processing Kinema behavioral datasets to identify high-resonance segments..."
      />
      {/* Left: Input Form */}
      <aside className="space-y-6">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-bold text-ink-primary">Film Profile Input</h2>
            {activeFilm && (
              <span className="text-[10px] font-mono bg-crimson/10 text-crimson px-2 py-0.5 rounded border border-crimson/20">
                CAMPAIGN: {activeFilm.title}
              </span>
            )}
          </div>
          <p className="text-[13px] text-ink-tertiary">Complete details for AudienceDNA™</p>
        </div>
        <div className="bg-black-4 border border-border-subtle p-6 rounded-card-lg">
          <FilmProfileForm 
            onSubmit={handleAnalyze} 
            isLoading={loading}
            submitLabel="Analyze Audience →"
            initialData={activeFilm}
          />
        </div>
        
        {error && (
          <div className="p-5 bg-crimson-surface/50 border border-crimson/20 rounded-card-md text-crimson space-y-3">
            <div className="flex gap-2 text-[13px] font-bold items-center uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Analysis Error
            </div>
            <p className="text-[13px] text-ink-secondary leading-relaxed opacity-90">
              The AI simulation timed out or encountered an issue. This usually happens when the market data search takes too long.
            </p>
            <button 
              onClick={() => handleAnalyze(activeFilm as FilmProfileInput)}
              className="w-full py-2 bg-crimson text-white rounded-button text-[12px] font-bold hover:bg-crimson-rich transition-colors"
            >
              Retry Simulation
            </button>
          </div>
        )}
      </aside>

      {/* Right: Results Area */}
      <section className="min-h-0 flex flex-col print:p-0">
        <div ref={reportRef} className="flex-1 p-8 bg-black rounded-card-lg border border-border-subtle overflow-y-auto">
          <AnimatePresence mode="wait">
            {!audienceDNAOutput && !loading ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-4 bg-black-3/30 border border-dashed border-border-subtle rounded-card-lg"
            >
              <div className="w-16 h-16 rounded-full bg-black-4 flex items-center justify-center border border-border-subtle">
                 <Users className="w-8 h-8 text-ink-tertiary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[16px] font-bold text-ink-secondary">No data yet</h3>
                <p className="text-[13px] text-ink-tertiary">Fill in the film profile on the left and click "Analyze Audience".</p>
              </div>
            </motion.div>
          ) : loading ? (
             <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center space-y-6"
             >
               <div className="relative">
                  <div className="w-20 h-20 border-4 border-crimson-surface border-t-crimson rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <BrainCircuit className="w-8 h-8 text-crimson animate-pulse" />
                  </div>
               </div>
               <div className="text-center space-y-2">
                 <h3 className="text-[18px] font-bold text-ink-primary">AI is Working</h3>
                 <p className="text-[14px] text-ink-tertiary max-w-sm">Analyzing Indonesian audience profiles based on the Kinema dataset... (est. 10–20 seconds)</p>
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
          ) : (
            <motion.div 
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                    <h2 className="text-[18px] font-bold text-ink-primary uppercase tracking-tight">IDENTIFIED SEGMENTS</h2>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black-6 border border-border-subtle rounded font-mono text-[10px] text-ink-tertiary">
                      <History className="w-3 h-3" />
                      AUTOSAVED
                    </div>
                   </div>
                   <div className="text-[12px] font-mono text-ink-tertiary">Primary Segment: <span className="text-white uppercase px-1.5 py-0.5 bg-black-4 border border-border-subtle rounded">{audienceDNAOutput.primarySegment}</span></div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  {audienceDNAOutput.segments.map((s, i) => (
                    <div key={i}><SegmentCard segment={s} /></div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black-4 border border-border-subtle rounded-card-lg p-8 space-y-4">
                  <h3 className="text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest">KEY INSIGHT</h3>
                  <p className="text-[15px] text-ink-primary leading-relaxed font-body whitespace-pre-wrap">
                    {audienceDNAOutput.insight}
                  </p>
                </div>

                {audienceDNAOutput.interestCore && (
                  <div className="bg-black-4 border border-border-subtle rounded-card-lg p-8 space-y-4">
                    <h3 className="text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest">INTEREST CORE™</h3>
                    <div className="flex flex-wrap gap-2">
                       {audienceDNAOutput.interestCore.map((interest, idx) => (
                         <div key={idx} className="px-3 py-1.5 bg-white/5 border border-border-subtle rounded-button flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-crimson" />
                            <span className="text-[13px] font-medium text-ink-secondary">{interest}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-4 print:hidden">
                 <button 
                  onClick={() => navigate('/box-predict')}
                  className="flex-1 py-4 bg-crimson text-white rounded-button font-bold flex items-center justify-center gap-2 hover:bg-crimson-rich transition-colors uppercase tracking-wide shadow-lg shadow-crimson/20"
                 >
                   Continue to BoxPredict™
                   <ChevronRight className="w-5 h-5" />
                 </button>
                 
                 <div className="flex gap-2 shrink-0">
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
                      {exporting ? '...' : 'PNG'}
                    </button>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

