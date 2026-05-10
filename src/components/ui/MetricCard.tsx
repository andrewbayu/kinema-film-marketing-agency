import React from 'react';
import { cn } from '../../lib/utils';

interface MetricCardProps {
  label: string;
  value: string;
  sub: string;
  valueColor?: 'default' | 'crimson' | 'orange' | 'green';
}

export default function MetricCard({ label, value, sub, valueColor = 'default' }: MetricCardProps) {
  const colorMap = {
    default: 'text-ink-primary',
    crimson: 'text-crimson',
    orange: 'text-orange-kala',
    green: 'text-green-kala'
  };

  return (
    <div className="bg-black-4 border border-border-subtle p-5 rounded-card-lg relative overflow-hidden group hover:border-border-default transition-colors">
      <div className="text-[9px] font-mono font-bold text-ink-tertiary uppercase tracking-widest mb-2">
        {label}
      </div>
      <div className={cn("text-[24px] font-extrabold font-body mb-1", colorMap[valueColor])}>
        {value}
      </div>
      <div className="text-[10px] font-mono text-ink-secondary">
        {sub}
      </div>
      
      {/* Decorative accent */}
      <div className={cn(
        "absolute top-0 right-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity",
        valueColor === 'crimson' ? 'bg-crimson' : 
        valueColor === 'orange' ? 'bg-orange-kala' : 
        valueColor === 'green' ? 'bg-green-kala' : 'bg-ink-secondary'
      )} />
    </div>
  );
}
