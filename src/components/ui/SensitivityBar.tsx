import React from 'react';
import { cn } from '../../lib/utils';

interface SensitivityBarProps {
  label: string;
  impact: number; // 0-100
  direction: 'Positif' | 'Negatif';
}

export default function SensitivityBar({ label, impact, direction }: SensitivityBarProps) {
  const isPositive = direction === 'Positif';

  return (
    <div className="flex items-center gap-6 group">
      <div className="w-[140px] text-[13px] font-medium text-ink-secondary group-hover:text-ink-primary transition-colors">{label}</div>
      
      <div className="flex-1 flex items-center gap-4">
        <div className="flex-1 bg-black-2 h-4 rounded overflow-hidden flex">
          {/* We'll just show the impact as a bar from left to right for simplicity in this UI */}
          <div 
            className={cn(
              "h-full transition-all duration-1000",
              isPositive ? "bg-crimson" : "bg-orange-kala opacity-80"
            )}
            style={{ width: `${impact}%` }}
          />
        </div>
        <div className={cn(
          "w-16 text-right text-[11px] font-mono font-bold",
          isPositive ? "text-green-kala" : "text-crimson"
        )}>
          {isPositive ? '+' : '-'}{impact}%
        </div>
        <div className={cn(
          "w-12 text-[10px] font-mono font-bold uppercase",
          isPositive ? "text-green-kala" : "text-orange-kala"
        )}>
          {direction}
        </div>
      </div>
    </div>
  );
}
