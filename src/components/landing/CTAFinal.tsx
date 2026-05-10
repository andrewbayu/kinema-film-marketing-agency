import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

export default function CTAFinal() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const navigate = useNavigate();

  return (
    <section ref={ref as any} className="relative py-40 px-6 overflow-hidden">
      {/* Crimson Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-crimson-glow blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center space-y-12 relative z-10">
        <div className="space-y-4">
          <motion.span 
            initial={{ opacity: 0, y: 12 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-white-tertiary font-bold block"
          >
            The first step
          </motion.span>
          
          <h2 className="text-[clamp(48px,8vw,96px)] font-black text-white-primary leading-[0.92] tracking-tighter flex flex-col">
            {['It\'s time', 'to bring', 'them together.'].map((text, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 24 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.15 * i, ease: [0.22, 1, 0.36, 1] }}
              >
                {text}
              </motion.span>
            ))}
          </h2>
        </div>

        <motion.p 
          initial={{ opacity: 0, y: 24 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-[18px] md:text-[20px] text-white-secondary leading-relaxed max-w-sm mx-auto"
        >
          Let's find out how we can help amplify your movie. Consultation 100% Free, no commitment.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4"
        >
          <button 
             onClick={() => navigate('/discussion')}
             className="w-full sm:w-auto bg-crimson hover:bg-crimson-rich text-white-primary px-10 py-5 rounded-full font-bold text-[16px] transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-crimson/20"
          >
            Talk with KALA →
          </button>
          <button className="w-full sm:w-auto bg-transparent border border-border-default hover:border-border-strong text-white-primary px-10 py-5 rounded-full font-bold text-[16px] transition-all">
            Learn the Technology
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 1.2 }}
          className="font-mono text-[11px] text-white-tertiary pt-8"
        >
          Response in 24 hours · English & Indonesian · Jakarta & Remote
        </motion.div>
      </div>
    </section>
  );
}
