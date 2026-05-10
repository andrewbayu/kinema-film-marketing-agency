import React from 'react';
import { motion } from 'motion/react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

export default function Hero() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section 
      ref={ref as any} 
      className="relative min-h-screen pt-40 pb-20 px-6 flex items-center overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ 
        backgroundImage: `url('https://storage.googleapis.com/bluestark_explorer/kala-os-wp.png')`
      }}
    >
      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-[65%_35%] gap-20 items-center">
        {/* Copy (Kiri) */}
        <div className="space-y-10">
          <motion.div 
            initial={{ opacity: 0, y: 24 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col space-y-4"
          >
            <span className="font-mono text-[15px] uppercase tracking-[0.22em] text-white font-bold">
              Film Marketing Intelligence · Indonesia
            </span>
            
            <h1 className="text-[clamp(32px,6.5vw,78px)] font-[900] leading-[0.95] tracking-tighter text-white-primary whitespace-nowrap">
              <motion.span
                initial={{ opacity: 0, y: 24 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="block"
              >
                You create the film.
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 24 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="block"
              >
                We find the audience.
              </motion.span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-[22px] text-white leading-relaxed max-w-xl"
          >
            The only data-driven film marketing agency in Indonesia.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap gap-5"
          >
            <button className="bg-crimson hover:bg-crimson-rich text-white-primary px-8 py-4 rounded-full font-semibold text-[15px] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-crimson/20">
              Ceritakan Film Kamu →
            </button>
            <button className="bg-transparent border border-border-default hover:border-border-strong text-white-primary px-8 py-4 rounded-full font-semibold text-[15px] transition-all">
              Lihat Cara Kerjanya
            </button>
          </motion.div>


        </div>

        {/* Data Panel (Kanan) */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={isVisible ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
        </motion.div>
      </div>
    </section>
  );
}
