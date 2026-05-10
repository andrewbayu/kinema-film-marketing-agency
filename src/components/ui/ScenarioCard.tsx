import React from 'react';
import { ScenarioData } from '../../lib/types';
import { cn, formatNumber } from '../../lib/utils';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface ScenarioCardProps {
  type: 'bear' | 'base' | 'bull';
  data: ScenarioData;
}

export default function ScenarioCard({ type, data }: ScenarioCardProps) {
  const config = {
    bear: {
      color: 'bg-orange-kala',
      icon: TrendingDown,
      title: 'PESIMIS (P25)'
    },
    base: {
      color: 'bg-crimson',
      icon: Minus,
      title: 'REALISTIS (P50)'
    },
    bull: {
      color: 'bg-green-kala',
      icon: TrendingUp,
      title: 'OPTIMIS (P75)'
    }
  };

  const { color, icon: Icon, title } = config[type];

  const formattedRevenue = `Rp ${(data.revenue).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M`;

  return (
    <div className={cn(
      "bg-black-4 border border-border-subtle rounded-card-lg p-6 relative overflow-hidden group hover:border-border-default transition-all pt-8"
    )}>
      {/* Top Border Accent */}
      <div className={cn("absolute top-0 left-0 w-full h-1", color)} />
      
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest">{title}</span>
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center bg-black-3 border border-border-subtle group-hover:scale-110 transition-transform")}>
           <Icon className={cn("w-4 h-4", color.replace('bg-', 'text-'))} />
        </div>
      </div>

      <div className="space-y-4">
        <div>
           <div className="text-[32px] font-extrabold text-ink-primary leading-tight">
             {data.admissions.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M
           </div>
           <div className="text-[10px] font-mono text-ink-tertiary uppercase font-bold tracking-wider">ADMISSIONS (EST)</div>
        </div>

        <div>
           <div className="text-[18px] font-bold text-white">
             {formattedRevenue}
           </div>
           <div className="text-[10px] font-mono text-ink-tertiary uppercase font-bold tracking-wider">BOX OFFICE REVENUE</div>
        </div>

        <div className="pt-4 border-t border-border-subtle">
           <div className="flex items-center gap-2">
             <span className="text-[10px] font-mono text-ink-tertiary uppercase font-bold tracking-tight">CONFIDENCE LEVEL</span>
             <span className={cn(
               "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border",
               data.confidence === 'Tinggi' ? 'text-green-kala border-green-kala/20' :
               data.confidence === 'Sedang' ? 'text-orange-kala border-orange-kala/20' :
               'text-crimson border-crimson/20'
             )}>
               {data.confidence.toUpperCase()}
             </span>
           </div>
        </div>
      </div>
    </div>
  );
}
