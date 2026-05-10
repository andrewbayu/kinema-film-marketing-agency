import React from 'react';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

interface CityOccupancyRowProps {
  name: string;
  occupancy: number;
  trend: 'up' | 'stable' | 'down';
  alert: boolean;
}

export default function CityOccupancyRow({ name, occupancy, trend, alert }: CityOccupancyRowProps) {
  const isAlert = alert || occupancy < 55;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-kala' : trend === 'down' ? 'text-crimson' : 'text-ink-tertiary';

  return (
    <div className={cn(
      "grid grid-cols-[1fr_200px_80px_60px_100px] gap-6 items-center px-6 py-4 border-b border-border-subtle hover:bg-white/5 transition-colors group",
      isAlert && "bg-orange-glow/20"
    )}>
      <div className={cn("text-[14px] font-bold transition-colors", isAlert ? "text-orange-kala" : "text-ink-primary group-hover:text-white")}>
        {name}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-1000", isAlert ? "bg-orange-kala" : "bg-crimson")} 
            style={{ width: `${occupancy}%` }} 
          />
        </div>
      </div>

      <div className={cn("text-[13px] font-mono font-bold text-center transition-colors", isAlert ? "text-orange-kala" : "text-ink-secondary")}>
        ({occupancy}%)
      </div>

      <div className="flex justify-center">
        <TrendIcon className={cn("w-4 h-4", trendColor)} />
      </div>

      <div className="flex justify-end">
        {isAlert && (
          <div className="flex items-center gap-1.5 text-orange-kala">
             <AlertTriangle className="w-3.5 h-3.5" />
             <span className="text-[10px] font-mono font-bold uppercase tracking-tighter italic">perhatian</span>
          </div>
        )}
      </div>
    </div>
  );
}
