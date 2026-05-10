import React from 'react';
import { SegmentResult } from '../../lib/types';
import { cn } from '../../lib/utils';

interface SegmentCardProps {
  segment: SegmentResult;
}

export default function SegmentCard({ segment }: SegmentCardProps) {
  const { 
    name, 
    ageRange, 
    primaryPlatform, 
    behavioralScores, 
    pills, 
    resonanceScore,
    triggerMechanism,
    messagingApproach
  } = segment;

  const scoreDimensions = [
    { label: 'Skeptisisme', value: behavioralScores.skepticism },
    { label: 'Identitas', value: behavioralScores.identity },
    { label: 'Kecemasan', value: behavioralScores.anxiety },
    { label: 'Pengetahuan', value: behavioralScores.knowledge },
  ];

  return (
    <div className="bg-black-4 border border-border-subtle rounded-card-lg p-6 space-y-6 hover:border-border-default transition-all">
      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="text-[18px] font-semibold text-ink-primary mb-1">{name}</h3>
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-wider">{ageRange}</span>
             <div className="w-1 h-1 rounded-full bg-border-strong" />
             <span className="text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-wider">{primaryPlatform.join(', ')}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          {pills.map((pill, i) => (
             <span 
              key={i} 
              className={cn(
                "px-2 py-0.5 rounded-badge text-[9px] font-mono font-bold border",
                i === 0 ? "bg-crimson-surface border-crimson/20 text-crimson" :
                i === 1 ? "bg-orange-glow border-orange-kala/20 text-orange-kala" :
                "bg-black-3 border-border-subtle text-ink-tertiary"
              )}
             >
               {pill.toUpperCase()}
             </span>
          ))}
        </div>
      </div>

      {/* Resonance Score */}
      <div className="space-y-2">
        <div className="flex justify-between text-[11px] font-bold text-ink-primary uppercase tracking-tight">
          <span>Resonance Score</span>
          <span className="text-crimson">{resonanceScore}%</span>
        </div>
        <div className="h-1.5 bg-black-2 rounded-full overflow-hidden">
          <div className="h-full bg-crimson" style={{ width: `${resonanceScore}%` }} />
        </div>
      </div>

      {/* Behavioral Dimensions */}
      <div className="space-y-4 pt-4 border-t border-border-subtle">
        <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest">ANALISIS PERILAKU</div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
           {scoreDimensions.map((dim) => (
             <div key={dim.label} className="space-y-1.5">
               <div className="flex justify-between text-[11px] text-ink-secondary font-medium">
                 <span>{dim.label}</span>
                 <span className="font-mono text-[10px]">{dim.value}</span>
               </div>
               <div className="h-1 bg-black-2 rounded-full overflow-hidden">
                 <div className="h-full bg-ink-tertiary" style={{ width: `${dim.value}%` }} />
               </div>
             </div>
           ))}
        </div>
      </div>

      {/* Strategy Highlights */}
      <div className="space-y-3 pt-4 border-t border-border-subtle">
         <div>
            <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest mb-1.5">TRIGGER MEKANISME</div>
            <p className="text-[12px] text-ink-secondary leading-relaxed font-medium capitalize">{triggerMechanism}</p>
         </div>
         <div>
            <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest mb-1.5">MESSAGING APPROACH</div>
            <p className="text-[12px] text-ink-secondary leading-relaxed font-medium capitalize">{messagingApproach}</p>
         </div>
      </div>
    </div>
  );
}
