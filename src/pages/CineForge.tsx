import React, { useState, useEffect, useRef } from 'react';
import { useFilmContext } from '../hooks/useFilmContext';
import { generateCineForgeContent } from '../lib/gemini';
import { CineForgeResult, CineForgeContent } from '../lib/types';
import { dbService } from '../services/dbService';
import { 
  Sparkles, 
  Settings, 
  Plus, 
  ChevronRight, 
  Users, 
  Zap, 
  BarChart3, 
  Share2, 
  Layout, 
  Target, 
  MessageSquare, 
  Video, 
  Image as ImageIcon, 
  Type, 
  Layers,
  ArrowRight,
  TrendingUp,
  History,
  FileDown,
  Printer,
  Loader2,
  AlertTriangle,
  Link as LinkIcon,
  FileText,
  X,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { CineForgeSource as CineForgeSourceType } from '../lib/types';

export default function CineForge() {
  const navigate = useNavigate();
  const { activeFilm, audienceDNAOutput, cineForgeOutput, setCineForgeOutput } = useFilmContext();
  const [contentCount, setContentCount] = useState(6);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Dataset State
  const [sources, setSources] = useState<CineForgeSourceType[]>([]);
  const [newSourceValue, setNewSourceValue] = useState('');
  const [newSourceType, setNewSourceType] = useState<CineForgeSourceType['type']>('URL');

  useEffect(() => {
    if (activeFilm?.id && !cineForgeOutput) {
      loadLatestCineForge();
    }
  }, [activeFilm?.id]);

  const loadLatestCineForge = async () => {
    if (!activeFilm) return;
    try {
      const latest = await dbService.getLatestCineForge(activeFilm.id);
      if (latest) setCineForgeOutput(latest);
    } catch (err) {
      console.error("Error loading latest CineForge", err);
    }
  };

  const handleAddSource = () => {
    if (!newSourceValue.trim()) return;
    const newSource: CineForgeSourceType = {
      type: newSourceType,
      value: newSourceValue.trim(),
      label: newSourceValue.split('/').pop() || newSourceValue
    };
    setSources([...sources, newSource]);
    setNewSourceValue('');
  };

  const handleRemoveSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!activeFilm || !audienceDNAOutput) return;

    setLoading(true);
    setError(null);
    try {
      const result = await generateCineForgeContent(
        activeFilm,
        audienceDNAOutput,
        contentCount,
        sources
      );
      setCineForgeOutput(result);

      if (activeFilm.id) {
        await dbService.saveCineForge(activeFilm.id, result);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to generate CineForge™ content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportImage = async () => {
    if (!reportRef.current || !cineForgeOutput) return;
    
    setExporting(true);
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
      link.download = `KINEMA-CineForge-${activeFilm?.title.replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Image Export failed", err);
    } finally {
      setExporting(false);
    }
  };

  if (!audienceDNAOutput) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6 max-w-2xl mx-auto font-sans">
        <div className="w-20 h-20 rounded-full bg-crimson-surface border border-crimson/20 flex items-center justify-center">
           <Layout className="w-10 h-10 text-crimson" />
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-[20px] font-bold text-ink-primary">AudienceDNA™ Context Required</h2>
          <p className="text-[14px] text-ink-tertiary">
            CineForge™ generates content specifically mapped to your audience segments. 
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
    <div className="max-w-7xl mx-auto space-y-12 pb-20 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-[24px] font-black text-ink-primary tracking-tighter uppercase flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-crimson" />
            CineForge™ Content Engine
          </h2>
          <p className="text-[13px] text-ink-tertiary">AI-powered content repurposing & audience-centric creative generation.</p>
        </div>
        {activeFilm && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-mono bg-white/5 text-ink-secondary px-2 py-1 rounded border border-border-subtle uppercase tracking-widest">
              Context Aware: {activeFilm.title}
            </span>
          </div>
        )}
      </div>

      {/* Control Panel */}
      <section className="bg-black-4 border border-border-subtle p-8 rounded-card-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Zap className="w-48 h-48" />
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_400px_250px] gap-8 items-start">
          {/* 01 Config */}
          <div className="space-y-8">
            <div className="space-y-4">
               <h3 className="text-[11px] font-mono font-black text-ink-tertiary tracking-[0.2em] uppercase">01 — Content Settings</h3>
               <div className="space-y-6">
                 <div className="space-y-4">
                   <div className="flex justify-between items-end">
                      <label className="text-[14px] font-bold text-ink-primary">Content Density</label>
                      <span className="text-[20px] font-black font-mono text-crimson leading-none">{contentCount} Cards</span>
                   </div>
                   <input 
                     type="range" 
                     min="3" 
                     max="9" 
                     step="1" 
                     value={contentCount}
                     onChange={(e) => setContentCount(parseInt(e.target.value))}
                     className="w-full h-2 bg-black-2 rounded-lg appearance-none cursor-pointer accent-crimson"
                   />
                   <div className="flex justify-between text-[9px] font-mono text-ink-tertiary">
                     <span>MIN (3)</span>
                     <span>MAX (9)</span>
                   </div>
                 </div>
               </div>
            </div>
          </div>

          {/* 02 Dataset */}
          <div className="space-y-6 border-l border-border-subtle/50 pl-8">
            <div className="space-y-4">
               <h3 className="text-[11px] font-mono font-black text-ink-tertiary tracking-[0.2em] uppercase flex items-center gap-2">
                 02 — Source Dataset
                 <span className="text-[10px] bg-crimson/10 text-crimson px-1.5 py-0.5 rounded leading-none">Context Layer</span>
               </h3>
               
               <div className="space-y-4">
                 <div className="flex gap-2">
                   <select 
                     value={newSourceType}
                     onChange={(e) => setNewSourceType(e.target.value as any)}
                     className="bg-black-2 border border-border-subtle text-ink-primary text-[12px] px-2 py-2 rounded focus:outline-none focus:border-crimson transition-colors"
                   >
                     <option value="URL">URL</option>
                     <option value="Video">Video</option>
                     <option value="Article">Article</option>
                     <option value="Image">Asset</option>
                   </select>
                   <div className="flex-1 relative">
                     <input 
                       type="text"
                       value={newSourceValue}
                       onChange={(e) => setNewSourceValue(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleAddSource()}
                       placeholder={newSourceType === 'URL' ? "Paste YouTube/Article link..." : "Reference name..."}
                       className="w-full bg-black-2 border border-border-subtle text-ink-primary text-[12px] px-3 py-2 rounded focus:outline-none focus:border-crimson transition-colors pr-10"
                     />
                     <button 
                       onClick={handleAddSource}
                       className="absolute right-1 top-1 bottom-1 w-8 flex items-center justify-center bg-crimson/10 text-crimson rounded hover:bg-crimson hover:text-white transition-all"
                     >
                       <Plus className="w-4 h-4" />
                     </button>
                   </div>
                 </div>

                 {/* Sources List */}
                 <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                   {sources.length === 0 ? (
                     <div className="text-[11px] text-ink-tertiary italic p-3 border border-dashed border-border-subtle rounded text-center">
                       No source material added. AI will use generic film profile.
                     </div>
                   ) : (
                     sources.map((src, idx) => (
                       <div key={idx} className="flex items-center justify-between p-2 bg-black-2 border border-border-subtle rounded group">
                         <div className="flex items-center gap-2 min-w-0">
                           {src.type === 'URL' ? <LinkIcon className="w-3 h-3 text-crimson" /> : 
                            src.type === 'Video' ? <Video className="w-3 h-3 text-crimson" /> :
                            src.type === 'Article' ? <FileText className="w-3 h-3 text-crimson" /> :
                            <ImageIcon className="w-3 h-3 text-crimson" />}
                           <span className="text-[11px] font-medium text-ink-secondary truncate">{src.label}</span>
                         </div>
                         <button 
                           onClick={() => handleRemoveSource(idx)}
                           className="opacity-0 group-hover:opacity-100 p-1 hover:bg-crimson/10 text-ink-tertiary hover:text-crimson rounded transition-all"
                         >
                           <X className="w-3 h-3" />
                         </button>
                       </div>
                     ))
                   )}
                 </div>
                 
                 <div className="p-3 bg-white/5 border border-border-subtle rounded flex items-center gap-3">
                    <div className="p-2 bg-crimson/20 rounded">
                      <Upload className="w-4 h-4 text-crimson" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] font-bold text-ink-primary">Upload Brief / Screenplay</div>
                      <div className="text-[9px] text-ink-tertiary">Drop PDF, TXT or PNG for visual context</div>
                    </div>
                 </div>
               </div>
            </div>
          </div>

          {/* 03 Action */}
          <div className="flex flex-col gap-4 border-l border-border-subtle/50 pl-8">
            <button 
              onClick={handleGenerate}
              disabled={loading}
              className={cn(
                "w-full py-6 rounded-button font-black text-[13px] uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-2 shadow-xl",
                loading ? "bg-black-3 text-ink-tertiary cursor-not-allowed" : "bg-crimson text-white hover:bg-crimson-rich shadow-crimson/20"
              )}
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
              <span>{loading ? "Forging..." : "Forge Campaign"}</span>
            </button>
            <p className="text-[10px] text-center text-ink-tertiary leading-tight italic">
              AI will cross-reference AudienceDNA™ with {sources.length} source materials.
            </p>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <div ref={reportRef} className="space-y-12">
        <AnimatePresence mode="wait">
          {loading ? (
             <motion.div 
               key="loading"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="py-32 flex flex-col items-center justify-center space-y-8"
             >
               <div className="relative">
                  <div className="w-24 h-24 border-[6px] border-crimson-surface border-t-crimson rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <Sparkles className="w-10 h-10 text-crimson animate-pulse" />
                  </div>
               </div>
               <div className="text-center space-y-3">
                 <h3 className="text-[20px] font-black text-ink-primary uppercase tracking-tight font-sans">Forging Creative Assets</h3>
                 <p className="text-[14px] text-ink-tertiary max-w-md mx-auto leading-relaxed">
                   Analyzing trailer beats, mapping cast influence to segments, and crafting distribution-specific hooks...
                 </p>
                 <div className="flex justify-center gap-1.5 pt-4">
                   {[0, 1, 2].map(i => (
                     <motion.div 
                       key={i}
                       animate={{ 
                         scale: [1, 1.5, 1],
                         opacity: [0.3, 1, 0.3] 
                       }} 
                       transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                       className="w-2 h-2 bg-crimson rounded-full" 
                     />
                   ))}
                 </div>
               </div>
             </motion.div>
          ) : cineForgeOutput ? (
            <motion.div 
               key="results"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="space-y-12"
            >
              {/* Campaign Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-2 border-crimson pb-6">
                <div className="space-y-4">
                   <div className="space-y-1">
                     <div className="text-[10px] font-mono font-black text-crimson tracking-[0.3em] uppercase">Session: {cineForgeOutput.sessionTitle}</div>
                     <h1 className="text-[32px] font-black text-ink-primary tracking-tighter uppercase leading-none">{cineForgeOutput.campaignGoal}</h1>
                   </div>
                   {cineForgeOutput.sourceReference && (
                     <div className="flex items-center gap-2 text-[12px] text-ink-tertiary bg-white/5 px-3 py-1.5 rounded border border-border-subtle inline-flex">
                        <Zap className="w-3.5 h-3.5 text-crimson" />
                        <span className="font-medium italic">Forged from: {cineForgeOutput.sourceReference}</span>
                     </div>
                   )}
                </div>
                <div className="flex gap-3 print:hidden">
                  <button 
                    onClick={handleExportImage}
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-border-strong rounded-button font-bold text-[12px] uppercase text-ink-secondary hover:bg-white/10 transition-all disabled:opacity-50"
                  >
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4 text-crimson" />}
                    {exporting ? 'Wait...' : 'Export Strategy'}
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-crimson/10 border border-crimson/20 rounded-button font-bold text-[12px] uppercase text-crimson hover:bg-crimson/20 transition-all">
                    <Share2 className="w-4 h-4" />
                    Share with Team
                  </button>
                </div>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {cineForgeOutput.contents.map((card, idx) => (
                   <div key={card.id || idx}>
                     <CampaignCard card={card} />
                   </div>
                 ))}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-12 print:hidden">
                 <div className="bg-black-4 p-6 border border-border-subtle rounded-card-sm space-y-2">
                    <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase">Avg. Resonance</div>
                    <div className="text-[24px] font-black text-crimson">
                      {Math.round(cineForgeOutput.contents.reduce((a, b) => a + b.resonanceScore, 0) / cineForgeOutput.contents.length)}%
                    </div>
                 </div>
                 <div className="bg-black-4 p-6 border border-border-subtle rounded-card-sm space-y-2">
                    <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase">Total Channels</div>
                    <div className="text-[24px] font-black text-ink-primary">
                      {new Set(cineForgeOutput.contents.map(c => c.distributionChannel)).size}
                    </div>
                 </div>
                 <div className="bg-black-4 p-6 border border-border-subtle rounded-card-sm space-y-2">
                    <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase">Primary Platform</div>
                    <div className="text-[24px] font-black text-ink-primary">TikTok</div>
                 </div>
                 <div className="bg-black-4 p-6 border border-border-subtle rounded-card-sm space-y-2">
                    <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase">Next Step</div>
                    <div className="text-[14px] font-black text-ink-primary uppercase hover:text-crimson cursor-pointer flex items-center gap-2">
                      Go to FIB Generator <ArrowRight className="w-4 h-4" />
                    </div>
                 </div>
              </div>
            </motion.div>
          ) : (
            <div className="py-32 flex flex-col items-center justify-center text-center space-y-6 bg-black-3/30 border border-dashed border-border-subtle rounded-card-lg animate-pulse-slow">
              <div className="w-20 h-20 rounded-full bg-black-4 flex items-center justify-center border-2 border-border-subtle">
                 <Sparkles className="w-10 h-10 text-ink-tertiary" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-[18px] font-bold text-ink-secondary">Engine Idle</h3>
                <p className="text-[14px] text-ink-tertiary leading-relaxed">
                  Configure your content requirements above and click <span className="text-crimson font-bold uppercase">Forge</span> to start generating campaign cards.
                </p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <div className="fixed bottom-8 right-8 animate-in slide-in-from-right-8 fade-in flex items-center gap-3 p-4 bg-crimson text-white rounded-card-sm shadow-2xl z-50">
           <AlertTriangle className="w-5 h-5" />
           <span className="font-bold text-[13px]">{error}</span>
           <button onClick={() => setError(null)} className="ml-4 opacity-50 hover:opacity-100">✕</button>
        </div>
      )}
    </div>
  );
}

interface CampaignCardProps {
  card: CineForgeContent;
}

function CampaignCard({ card }: CampaignCardProps) {
  const Icon = card.type === 'Video' ? Video : card.type === 'Graphic' ? ImageIcon : card.type === 'Copy' ? MessageSquare : Layers;
  
  return (
    <div className="group bg-black p-6 border border-border-subtle rounded-card-lg space-y-6 transition-all hover:border-crimson hover:shadow-2xl hover:shadow-crimson/5 flex flex-col">
      {/* Card Type & Channel */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-ink-tertiary uppercase tracking-widest border border-border-subtle px-1.5 py-0.5 rounded">
            <Icon className="w-3 h-3" />
            {card.type} CONTENT
          </div>
          <div className="text-[13px] font-black text-ink-primary tracking-tight leading-tight group-hover:text-crimson transition-colors uppercase">
            {card.title}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
           <div className="text-[14px] font-black text-crimson font-mono leading-none">{card.resonanceScore}%</div>
           <div className="text-[8px] font-mono text-ink-tertiary uppercase">Resonance</div>
        </div>
      </div>

      {/* Strategy Details */}
      <div className="grid grid-cols-2 gap-4 py-4 border-y border-border-subtle">
         <div className="space-y-1">
           <div className="text-[9px] font-mono text-ink-tertiary uppercase flex items-center gap-1">
             <Target className="w-2.5 h-2.5" />
             Target
           </div>
           <div className="text-[11px] font-bold text-ink-secondary leading-tight truncate">{card.targetSegment}</div>
         </div>
         <div className="space-y-1">
           <div className="text-[9px] font-mono text-ink-tertiary uppercase flex items-center gap-1">
             <Share2 className="w-2.5 h-2.5" />
             Distributor
           </div>
           <div className="text-[11px] font-bold text-ink-secondary leading-tight">{card.distributionChannel}</div>
         </div>
      </div>

      {/* Content Logic */}
      <div className="space-y-4 flex-1">
         <div className="space-y-2">
            <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-crimson" />
              Content Hook
            </div>
            <p className="text-[13px] text-ink-secondary font-medium leading-relaxed italic">
              "{card.contentHook}"
            </p>
         </div>

         <div className="space-y-2">
            <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase">Visual Direction</div>
            <p className="text-[12px] text-ink-tertiary leading-relaxed">
              {card.visualDirection}
            </p>
         </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 mt-auto">
        <div className="p-3 bg-black-4 border border-border-subtle rounded-card-sm space-y-2">
           <div className="text-[9px] font-mono text-ink-tertiary uppercase">Caption Concept</div>
           <p className="text-[11px] text-ink-secondary line-clamp-2 italic">
             {card.captionTemplate}
           </p>
           <div className="flex justify-between items-center pt-2 border-t border-border-subtle/50 mt-2">
              <span className="text-[10px] font-bold text-crimson uppercase tracking-wide">CTA: {card.cta}</span>
              <button className="text-[10px] font-mono text-ink-tertiary hover:text-ink-primary transition-colors flex items-center gap-1">
                COPY <Plus className="w-2.5 h-2.5" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
