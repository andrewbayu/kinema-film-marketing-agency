import React, { useState, useEffect, useRef } from 'react';
import { useFilmContext } from '../hooks/useFilmContext';
import { generateFIB } from '../lib/gemini';
import { FIBContent } from '../lib/types';
import { 
  FileText, 
  Download, 
  Edit3, 
  ChevronLeft, 
  AlertCircle, 
  FileType, 
  BrainCircuit, 
  RefreshCw, 
  History, 
  Loader2,
  FileDown,
  ExternalLink,
  Printer
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { dbService } from '../services/dbService';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

export default function FIBGenerator() {
  const navigate = useNavigate();
  const { filmId } = useParams();
  const { activeFilm, audienceDNAOutput, boxPredictOutput } = useFilmContext();
  
  const [fibContent, setFibContent] = useState<FIBContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState<'Draft' | 'Final'>('Draft');
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (activeFilm?.id && !fibContent) {
      loadLatestFIB();
    }
  }, [activeFilm?.id]);

  const loadLatestFIB = async () => {
    if (!activeFilm) return;
    try {
      const latest = await dbService.getLatestFIB(activeFilm.id);
      if (latest) setFibContent(latest);
    } catch (err) {
      console.error("Error loading latest FIB", err);
    }
  };

  const missingData = !audienceDNAOutput || !boxPredictOutput;

  const handleGenerate = async () => {
    if (missingData || !activeFilm) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await generateFIB(
        {
          title: activeFilm.title,
          genre: activeFilm.genre as any,
          budgetTier: activeFilm.budgetTier || 'mid',
          releaseWindow: activeFilm.releaseWindow || '',
          logline: activeFilm.logline || '',
          leadCast: activeFilm.leadCast || '',
          ipType: activeFilm.ipType || 'original',
          director: activeFilm.director
        },
        audienceDNAOutput,
        boxPredictOutput
      );
      setFibContent(result);

      // Save to Firestore
      if (activeFilm?.id) {
        await dbService.saveFIB(activeFilm.id, result);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to generate FIB. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportWord = async () => {
    if (!fibContent || !activeFilm) return;
    
    setExporting(true);
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: "FILM INTELLIGENCE BRIEF",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
              children: [
                new TextRun({ text: `FILM: ${activeFilm.title}`, bold: true }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `GENRE: ${activeFilm.genre}`, bold: true }),
              ],
            }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "01 — EXECUTIVE SUMMARY", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: fibContent.executiveSummary }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "02 — AUDIENCE PROFILE", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: fibContent.audienceAnalysis }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "03 — BOX OFFICE PROJECTION", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: fibContent.boxOfficeAnalysis }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "04 — NEXT STEPS", heading: HeadingLevel.HEADING_2 }),
            ...fibContent.nextSteps.map(step => new Paragraph({ text: `• ${step}`, bullet: { level: 0 } })),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `KALA-FIB-${activeFilm.title.replace(/\s+/g, '-')}.docx`);
    } catch (err) {
      console.error("Word Export failed", err);
    } finally {
      setExporting(false);
    }
  };

  if (missingData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6 max-w-2xl mx-auto">
        <div className="w-20 h-20 rounded-full bg-crimson-surface border border-crimson/20 flex items-center justify-center">
           <FileText className="w-10 h-10 text-crimson" />
        </div>
        <div className="space-y-2">
          <h2 className="text-[20px] font-bold text-ink-primary">Data Incomplete</h2>
          <p className="text-[14px] text-ink-tertiary">
            FIB (Film Intelligence Brief) is compiled from the outputs of AudienceDNA™ and BoxPredict™. 
            Please complete both analyses before generating the FIB.
          </p>
        </div>
        <div className="flex gap-4">
           {!audienceDNAOutput && (
             <button onClick={() => navigate('/audience-dna')} className="px-6 py-2.5 bg-black-4 border border-border-strong text-white rounded-button font-bold hover:bg-black-6 transition-all flex items-center gap-2">
               Go to AudienceDNA™ →
             </button>
           )}
           {!boxPredictOutput && (
             <button onClick={() => navigate('/box-predict')} className="px-6 py-2.5 bg-black-4 border border-border-strong text-white rounded-button font-bold hover:bg-black-6 transition-all flex items-center gap-2">
               Go to BoxPredict™ →
             </button>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[1fr_320px] gap-8 h-full max-w-7xl mx-auto pb-20">
      {/* Left: Document Preview (PDF Ready) */}
      <section 
        ref={reportRef}
        className={cn(
        "bg-white text-[#1a1a1a] p-16 shadow-2xl min-h-[1100px] font-serif border border-zinc-200 print:m-0 print:shadow-none print:border-0 overflow-y-auto",
        !fibContent && "flex flex-col items-center justify-center bg-zinc-50"
      )}>
        <AnimatePresence mode="wait">
          {!fibContent ? (
            <motion.div 
               key="empty-fib"
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }}
               className="text-center space-y-6"
            >
               <FileType className="w-16 h-16 text-zinc-300 mx-auto" />
               <div className="space-y-1">
                  <h3 className="text-zinc-600 font-bold text-[18px]">FIB Preview Not Available</h3>
                  <p className="text-zinc-400 font-sans text-[14px]">Click "Generate FIB" on the right to start.</p>
               </div>
            </motion.div>
          ) : (
            <motion.div 
              key="fib-content"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              {/* Header section */}
              <div className="border-y-2 border-black py-4 flex justify-between items-center font-sans tracking-tighter">
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-black" />
                    <span className="font-bold text-[14px]">KALA</span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/5 border border-black/10 rounded font-mono text-[9px] text-zinc-400 ml-2">
                      <History className="w-3 h-3" />
                      AUTOSAVED
                    </div>
                 </div>
                 <span className="font-bold text-[14px]">CONFIDENTIAL</span>
              </div>

              <div className="space-y-2">
                 <h1 className="text-[36px] font-bold tracking-tight uppercase leading-none font-sans">FILM INTELLIGENCE BRIEF</h1>
              </div>

              <div className="grid grid-cols-2 gap-y-6 pt-8 border-t border-zinc-200 font-sans text-[13px]">
                 <div className="space-y-1">
                    <div className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">FILM</div>
                    <div className="font-bold">{activeFilm?.title || 'Unknown Film'}</div>
                 </div>
                 <div className="space-y-1">
                    <div className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">CLIENT</div>
                    <div className="font-bold">{activeFilm?.client || 'Production House'}</div>
                 </div>
                 <div className="space-y-1">
                    <div className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">GENRE</div>
                    <div className="font-bold">{activeFilm?.genre}</div>
                 </div>
                 <div className="space-y-1">
                    <div className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">RELEASE WINDOW</div>
                    <div className="font-bold uppercase">{boxPredictOutput.releaseWindowRecommendation.split(' ')[0]}</div>
                 </div>
                 <div className="space-y-1">
                    <div className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">CREATED DATE</div>
                    <div className="font-bold">{new Date().toLocaleDateString('en-US')}</div>
                 </div>
                 <div className="space-y-1">
                    <div className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">PREPARED BY</div>
                    <div className="font-bold lowercase">KALA Team — Kata.ai × Samara Group</div>
                 </div>
              </div>

              {/* Body Sections */}
              <div className="space-y-16 py-12">
                 {/* 01 Executive Summary */}
                 <section className="space-y-6">
                    <div className="border-y-4 border-black py-2 font-sans font-black text-[18px] tracking-tighter">01 — EXECUTIVE SUMMARY</div>
                    <p className="text-[16px] leading-[1.6] first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left pt-2">
                       {fibContent.executiveSummary}
                    </p>
                 </section>

                 {/* 02 Audience Profile */}
                 <section className="space-y-6">
                    <div className="border-y-4 border-black py-2 font-sans font-black text-[18px] tracking-tighter">02 — AUDIENCE PROFILE</div>
                    <p className="text-[16px] leading-[1.6]">
                       {fibContent.audienceAnalysis}
                    </p>
                    <div className="grid grid-cols-2 gap-8 pt-4">
                       <div className="p-6 bg-zinc-50 border border-zinc-100 space-y-3">
                          <div className="text-[11px] font-sans font-bold text-zinc-400 uppercase tracking-widest">PRIMARY SEGMENT</div>
                          <div className="text-[18px] font-bold tracking-tight">{audienceDNAOutput.primarySegment}</div>
                       </div>
                       <div className="p-6 bg-zinc-50 border border-zinc-100 space-y-3">
                          <div className="text-[11px] font-sans font-bold text-zinc-400 uppercase tracking-widest">AUDIENCE LANDSCAPE</div>
                          <div className="text-[14px] leading-relaxed italic text-zinc-600">Identified {audienceDNAOutput.segments.length} potential main clusters.</div>
                       </div>
                    </div>
                 </section>

                 {/* 03 Box Office Projection */}
                 <section className="space-y-6">
                    <div className="border-y-4 border-black py-2 font-sans font-black text-[18px] tracking-tighter">03 — BOX OFFICE PROJECTION</div>
                    <p className="text-[16px] leading-[1.6]">
                       {fibContent.boxOfficeAnalysis}
                    </p>
                    <div className="grid grid-cols-3 gap-1 py-4 bg-black border-4 border-black font-sans">
                       {(Object.entries(boxPredictOutput.scenarios) as [string, any][]).map(([key, data]) => (
                         <div key={key} className="bg-white p-6 space-y-1">
                            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">{data.label}</div>
                            <div className="text-[28px] font-black tracking-tight">{data.admissions}M</div>
                            <div className="text-[12px] font-bold italic opacity-60">Admissions (est)</div>
                         </div>
                       ))}
                    </div>
                 </section>

                 {/* 04 Next Steps */}
                 <section className="space-y-6">
                    <div className="border-y-4 border-black py-2 font-sans font-black text-[18px] tracking-tighter">04 — NEXT STEPS</div>
                    <ul className="space-y-4 list-none pl-0">
                       {fibContent.nextSteps.map((step, i) => (
                         <li key={i} className="flex gap-4 items-start text-[16px] leading-relaxed">
                            <span className="font-sans font-bold shrink-0 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[11px]">0{i+1}</span>
                            <span>{step}</span>
                         </li>
                       ))}
                    </ul>
                 </section>
              </div>

              {/* Methodology and Footer */}
              <div className="pt-20 border-t-4 border-black font-sans space-y-10">
                 <div className="space-y-4">
                    <div className="text-[11px] font-bold uppercase tracking-widest">METHODOLOGY NOTES</div>
                    <p className="text-[12px] text-zinc-500 leading-relaxed italic">
                       This FIB was created based on information available on {new Date().toLocaleDateString()}. Projections are probabilistic estimates, not guarantees. 
                       {fibContent.methodologyNote}
                    </p>
                 </div>
                 <div className="flex justify-between items-end">
                    <div className="text-[10px] font-bold text-zinc-300">KALA · Kata.ai × Samara Group · Confidential</div>
                    <div className="text-[10px] font-bold text-zinc-300">PAGE 01 of 01</div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Right: Controls Panel */}
      <aside className="space-y-6 print:hidden">
        <div className="bg-black-4 border border-border-subtle rounded-card-lg p-6 space-y-8">
           <div className="space-y-4">
              <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest">DOCUMENT STATUS</div>
              <div className="flex items-center justify-between">
                 <span className={cn(
                   "px-2.5 py-1 rounded-badge text-[10px] font-mono font-bold border",
                   status === 'Draft' ? "bg-black-3 border-border-subtle text-ink-tertiary" : "bg-green-kala/10 border-green-kala/20 text-green-kala"
                 )}>
                   {status.toUpperCase()}
                 </span>
                 {status === 'Draft' && (
                    <button onClick={() => setStatus('Final')} className="text-[11px] font-bold text-crimson hover:underline">Mark as Final</button>
                 )}
              </div>
           </div>

           <div className="space-y-3 pt-6 border-t border-border-subtle">
              <button 
                onClick={handleGenerate}
                disabled={loading}
                className={cn(
                  "w-full py-4 rounded-button font-bold text-[14px] flex items-center justify-center gap-2 uppercase tracking-wide transition-all",
                  loading ? "bg-black-6 text-ink-tertiary cursor-not-allowed" : "bg-crimson text-white hover:bg-crimson-rich"
                )}
              >
                {loading ? (
                   <>
                    <BrainCircuit className="w-5 h-5 animate-pulse" />
                    Generating...
                   </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    {fibContent ? 'Regenerate Brief' : 'Generate FIB →'}
                  </>
                )}
              </button>

              <button 
                disabled={!fibContent}
                className="w-full py-3 bg-transparent border border-border-strong text-ink-primary rounded-button font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wide"
              >
                <Edit3 className="w-4 h-4" />
                Edit Manual
              </button>
           </div>

           <div className="space-y-3 pt-6 border-t border-border-subtle">
              <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest mb-2">EXPORT OPTIONS</div>
              
              <button 
                onClick={handleExportPDF}
                disabled={!fibContent}
                className="w-full py-3.5 bg-crimson text-white rounded-button font-bold text-[13px] flex items-center justify-center gap-2 hover:bg-crimson-rich transition-all disabled:opacity-30 uppercase tracking-wide shadow-lg shadow-crimson/20"
              >
                <Printer className="w-4 h-4" />
                Print / Save as PDF
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={handleExportWord}
                  disabled={!fibContent || exporting}
                  className="py-3 bg-black-6 border border-border-strong text-ink-primary rounded-button font-bold text-[12px] flex items-center justify-center gap-2 hover:bg-white/5 transition-all disabled:opacity-30 uppercase"
                >
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                  Word
                </button>
                <button 
                  onClick={() => window.open('https://docs.google.com/document/u/0/?show_intro=1', '_blank')}
                  disabled={!fibContent}
                  className="py-3 bg-black-6 border border-border-strong text-ink-primary rounded-button font-bold text-[12px] flex items-center justify-center gap-2 hover:bg-white/5 transition-all disabled:opacity-30 uppercase"
                >
                  <ExternalLink className="w-4 h-4" />
                  GDocs
                </button>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/5 border border-blue-500/10 rounded text-blue-400 text-[10px] font-medium italic">
                 <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                 <span>PDF uses browser print. Tip: Upload Word to Google Docs for editing.</span>
              </div>
           </div>
        </div>

        <button 
          onClick={() => navigate('/box-predict')}
          className="w-full flex items-center justify-center gap-2 text-ink-tertiary hover:text-ink-primary transition-colors text-[13px] font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to BoxPredict™
        </button>
      </aside>
    </div>
  );
}

