import React, { useState, useEffect } from 'react';
import FilmProfileForm from '../components/forms/FilmProfileForm';
import SegmentCard from '../components/ui/SegmentCard';
import { runAudienceDNA } from '../lib/gemini';
import { useFilmContext } from '../hooks/useFilmContext';
import { FilmProfileInput, AudienceDNAResult } from '../lib/types';
import { Users, Info, ChevronRight, FileDown, BrainCircuit, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { dbService } from '../services/dbService';

export default function AudienceDNA() {
  const navigate = useNavigate();
  const { audienceDNAOutput, setAudienceDNAOutput, activeFilm } = useFilmContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError('Gagal menjalankan analisis AI. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-[380px_1fr] gap-8 h-full max-w-7xl mx-auto">
      {/* Left: Input Form */}
      <aside className="space-y-6">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-bold text-ink-primary">Input Profil Film</h2>
            {activeFilm && (
              <span className="text-[10px] font-mono bg-crimson/10 text-crimson px-2 py-0.5 rounded border border-crimson/20">
                CAMPAIGN: {activeFilm.title}
              </span>
            )}
          </div>
          <p className="text-[13px] text-ink-tertiary">Lengkapi detail untuk AudienceDNA™</p>
        </div>
        <div className="bg-black-4 border border-border-subtle p-6 rounded-card-lg">
          <FilmProfileForm 
            onSubmit={handleAnalyze} 
            isLoading={loading}
            submitLabel="Analisis Audiens →"
          />
        </div>
        
        {error && (
          <div className="p-4 bg-crimson-surface border border-crimson/20 rounded-card-sm text-crimson text-[13px] font-medium flex gap-2">
            <Info className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
      </aside>

      {/* Right: Results Area */}
      <section className="min-h-0 flex flex-col">
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
                <h3 className="text-[16px] font-bold text-ink-secondary">Belum ada data</h3>
                <p className="text-[13px] text-ink-tertiary">Isi profil film di sebelah kiri dan klik "Analisis Audiens".</p>
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
                 <h3 className="text-[18px] font-bold text-ink-primary">AI Sedang Bekerja</h3>
                 <p className="text-[14px] text-ink-tertiary max-w-sm">Menganalisis profil penonton Indonesia berdasarkan dataset KALA... (est. 5 detik)</p>
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
                    <h2 className="text-[18px] font-bold text-ink-primary uppercase tracking-tight">SEGMEN TERIDENTIFIKASI</h2>
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

              <div className="bg-black-4 border border-border-subtle rounded-card-lg p-8 space-y-4">
                <h3 className="text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest">INSIGHT UTAMA</h3>
                <p className="text-[15px] text-ink-primary leading-relaxed font-body whitespace-pre-wrap">
                  {audienceDNAOutput.insight}
                </p>
              </div>

              <div className="flex gap-4">
                 <button 
                  onClick={() => navigate('/box-predict')}
                  className="flex-1 py-4 bg-crimson text-white rounded-button font-bold flex items-center justify-center gap-2 hover:bg-crimson-rich transition-colors"
                 >
                   Lanjut ke BoxPredict™
                   <ChevronRight className="w-5 h-5" />
                 </button>
                 <button className="flex-1 py-4 bg-transparent border border-border-strong text-ink-primary rounded-button font-bold flex items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                    <FileDown className="w-5 h-5" />
                    Export Audience Report
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}

