import React from 'react';
import { InfoTooltip } from '../ui/InfoTooltip';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: any;
  desc: string;
  info?: string;
}

export function MetricCard({ label, value, icon: Icon, desc, info }: MetricCardProps) {
  return (
    <div className="bg-black-1 border border-border-subtle rounded-card p-4 group hover:border-crimson/30 transition-all flex items-center gap-4">
      <div className="p-2.5 bg-black-2 rounded-lg border border-border-subtle group-hover:bg-crimson/10 group-hover:border-crimson/30 transition-colors">
        <Icon className="w-4 h-4 text-ink-secondary group-hover:text-crimson transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold text-ink-tertiary uppercase tracking-wider truncate">
            {label}
            {info && <InfoTooltip content={info} />}
          </h4>
          <span className="text-[18px] font-black text-ink-primary font-mono">{value}</span>
        </div>
        <p className="text-[10px] text-ink-tertiary truncate">{desc}</p>
      </div>
    </div>
  );
}
