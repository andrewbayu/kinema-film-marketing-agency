import React from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AlertBannerProps {
  type: 'warning' | 'error';
  title: string;
  body: string;
}

export default function AlertBanner({ type, title, body }: AlertBannerProps) {
  const isWarning = type === 'warning';

  return (
    <div className={cn(
      "flex gap-4 p-4 rounded-card-sm border",
      isWarning 
        ? "bg-orange-glow border-orange-kala/20 text-orange-kala" 
        : "bg-crimson-surface border-crimson/20 text-crimson"
    )}>
      <div className="shrink-0 mt-0.5">
        {isWarning ? <AlertTriangle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      </div>
      <div>
        <div className="text-[14px] font-bold mb-1 uppercase tracking-tight">{title}</div>
        <div className="text-[13px] font-medium leading-relaxed opacity-90">{body}</div>
      </div>
    </div>
  );
}
