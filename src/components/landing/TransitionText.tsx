import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

interface TransitionTextProps {
  text: string;
  blackout?: boolean;
}

export default function TransitionText({ text, blackout = false }: TransitionTextProps) {
  const { ref, isVisible } = useScrollAnimation({ 
    threshold: 0.2,
    triggerOnce: true 
  });

  return (
    <div 
      ref={ref as any} 
      className={`relative py-60 px-6 flex items-center justify-center overflow-hidden transition-colors duration-1000 ${blackout ? 'bg-black-1 mt-[-1px] mb-[-1px]' : 'bg-transparent'}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl mx-auto text-center"
      >
        <h3 className={`text-[28px] md:text-[40px] font-black tracking-tight leading-tight transition-colors duration-700 whitespace-pre-line ${isVisible ? 'text-white' : 'text-white-secondary/60'}`}>
          {text}
        </h3>
      </motion.div>
    </div>
  );
}
