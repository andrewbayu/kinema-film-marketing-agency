import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit, Sparkles, TrendingUp, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LoadingOverlayProps {
  isVisible: boolean;
  title: string;
  subtitle: string;
  type?: 'audience' | 'predict' | 'forge' | 'default';
}

export default function LoadingOverlay({ isVisible, title, subtitle, type = 'default' }: LoadingOverlayProps) {
  const Icon = type === 'audience' ? BrainCircuit : 
               type === 'predict' ? TrendingUp : 
               type === 'forge' ? Sparkles : Loader2;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md"
        >
          <div className="max-w-md w-full px-8 flex flex-col items-center">
            {/* Main Animation */}
            <div className="relative mb-12">
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.05, 1] 
                }}
                transition={{ 
                  rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                className="w-32 h-32 rounded-full border-t-2 border-crimson border-r-2 border-r-transparent border-b-2 border-b-crimson/20 border-l-2 border-l-transparent"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 rounded-full border-t-2 border-white/20 border-r-2 border-r-transparent border-b-2 border-b-white/5 border-l-2 border-l-transparent"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon className={cn(
                  "w-12 h-12 text-crimson",
                  type !== 'default' && "animate-pulse"
                )} />
              </div>

              {/* Orbiting particles */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3 + i, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <motion.div 
                    animate={{ scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }}
                    className="absolute top-0 left-1/2 -ml-1 w-2 h-2 bg-crimson rounded-full shadow-[0_0_10px_rgba(238,29,35,0.8)]" 
                  />
                </motion.div>
              ))}
            </div>

            {/* Text Content */}
            <div className="text-center space-y-4">
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-[28px] font-black text-white uppercase tracking-tighter"
              >
                {title}
              </motion.h2>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-[15px] text-ink-tertiary leading-relaxed font-medium"
              >
                {subtitle}
              </motion.p>
              
              {/* Progress Bar (Simulated) */}
              <div className="mt-8 w-full h-1 bg-white/5 rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "0%" }}
                  transition={{ duration: 15, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-crimson/50 to-crimson shadow-[0_0_10px_#ee1d23]"
                />
              </div>
              <div className="flex justify-between mt-2 text-[10px] font-mono font-bold text-ink-tertiary tracking-widest uppercase">
                <span>Initializing Engine</span>
                <span>Optimizing Results</span>
              </div>
            </div>

            {/* Status Messages Cycle */}
            <StatusFlasher />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatusFlasher() {
  const [index, setIndex] = React.useState(0);
  const messages = [
    "Crunching Kinema dataset...",
    "Calibrating Indonesian behavioral models...",
    "Simulating audience resonance...",
    "Refining distribution strategies...",
    "Synthesizing creative hooks...",
    "Validating ROI projections..."
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mt-12 h-6 flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.6, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-[11px] font-mono text-white tracking-widest uppercase text-center"
        >
          {messages[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
