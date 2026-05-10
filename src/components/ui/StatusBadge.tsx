import React from 'react';
import { cn } from '../../lib/utils';

interface StatusBadgeProps {
  status: 'active' | 'pre-release' | 'post';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    active: {
      bg: 'bg-green-kala/10',
      text: 'text-green-kala',
      label: 'ACTIVE'
    },
    'pre-release': {
      bg: 'bg-orange-kala/10',
      text: 'text-orange-kala',
      label: 'PRE-RELEASE'
    },
    post: {
      bg: 'bg-white/5',
      text: 'text-ink-tertiary',
      label: 'POST'
    }
  };

  const { bg, text, label } = config[status];

  return (
    <span className={cn(
      "px-2 py-0.5 rounded-badge text-[9px] font-mono font-bold tracking-wider",
      bg,
      text
    )}>
      {label}
    </span>
  );
}
