import React from 'react';
import { motion } from 'motion/react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

export default function Problem() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const cards = [
    {
      tag: 'DATA VACUUM',
      title: 'The audience exists. The data doesn\'t.',
      body: 'Cinema chains keep audience data for their own interests. That\'s their right. But the consequence: every new film starts from zero.\n\nWho came last week? How did they know? Why did they choose that film, not the other? No one knows for sure.'
    },
    {
      tag: 'RELEASE CONGESTION',
      title: '278 films. One calendar.',
      body: 'Every year, hundreds of films compete in the same theaters, in the same months.\n\nRelease timing can make or break a film long before the audience gets a say. And most timing decisions are still made on guesswork, not calculations.'
    },
    {
      tag: 'UNMEASURED SPEND',
      title: 'Budget spent. Results unclear.',
      body: 'KOLs paid. Ads aired. But how many tickets were sold because of it? No one can answer for sure.\n\nIf you can\'t measure it, you can\'t improve it. The same cycle repeats from film to film.'
    }
  ];

  return (
    <section ref={ref as any} className="py-40 px-6 max-w-7xl mx-auto space-y-24">
      <div className="space-y-8 text-center max-w-3xl mx-auto">
        <motion.span 
          initial={{ opacity: 0, y: 12 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-crimson font-bold block"
        >
          Why this happens
        </motion.span>
        
        <motion.h2 
          initial={{ opacity: 0, y: 24 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1 }}
          className="text-[clamp(32px,5vw,56px)] font-bold text-white-primary leading-[1.1] tracking-tighter"
        >
          Not a creative problem. An information problem.
        </motion.h2>
 
        <motion.p 
          initial={{ opacity: 0, y: 24 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="text-[18px] text-white-secondary leading-relaxed"
        >
          Almost everyone in the Indonesian film industry knows something is broken with how marketing works. But not many know exactly where the leak is.
        </motion.p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 + (i * 0.15) }}
            className="group bg-black-4 border border-border-subtle rounded-xl p-10 space-y-8 hover:border-border-strong hover:translate-y-[-3px] transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-crimson transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            
            <div className="space-y-6">
              <span className="font-mono text-[10px] font-bold tracking-widest uppercase bg-gradient-to-r from-[#FF1A1A] to-[#8B0000] bg-clip-text text-transparent">{card.tag}</span>
              <h3 className="text-[24px] font-bold text-white-primary leading-tight tracking-tight">{card.title}</h3>
              <p className="text-[14px] text-white-secondary leading-relaxed whitespace-pre-line">
                {card.body}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
