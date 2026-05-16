import React from 'react';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InfoTooltipProps {
  content: string;
}

export function InfoTooltip({ content }: InfoTooltipProps) {
  const [show, setShow] = React.useState(false);

  return (
    <div className="relative inline-flex ml-1.5 align-middle group">
      <div 
        className="cursor-help text-ink-tertiary hover:text-crimson transition-colors"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        <Info className="w-3 h-3" />
      </div>
      <AnimatePresence>
        {show && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute z-[100] left-1/2 -translate-x-1/2 bottom-full mb-3 w-64 p-3 bg-black-1 border border-crimson/30 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            <div className="text-[11px] text-ink-secondary leading-relaxed font-medium">
              {content}
            </div>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-black-1 border-b border-r border-crimson/30 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
