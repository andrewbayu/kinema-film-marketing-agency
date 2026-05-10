import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressBarProps {
  progress: number; // 0-100
  status?: 'active' | 'pre-release' | 'post';
}

export default function ProgressBar({ progress, status = 'active' }: ProgressBarProps) {
  const isPreRelease = status === 'pre-release';
  
  return (
    <div className="w-full bg-white/5 h-[3px] rounded-full overflow-hidden">
      <div 
        className={cn(
          "h-full transition-all duration-1000 ease-out",
          isPreRelease ? "bg-orange-kala" : "bg-crimson"
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
