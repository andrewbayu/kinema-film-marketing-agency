import React from 'react';
import { motion } from 'motion/react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

export default function HowItWorks() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  
  const steps = [
    {
      num: '00',
      title: 'Kickoff',
      body: 'We learn everything about your film. No templates, no assumptions.',
      label: 'Film Profile'
    },
    {
      num: '01',
      title: 'Film Intelligence Brief (FIB)',
      body: 'We run AudienceDNA™ and BoxPredict™. Who will actually watch, when to release, what it takes to get there.',
      label: 'Film Intelligence Brief'
    },
    {
      num: '02',
      title: 'Campaign Blueprint (CB)',
      body: 'A week-by-week plan: channels, creators, budget allocation, and the conditions that trigger each.',
      label: 'Campaign Blueprint'
    },
    {
      num: '03',
      title: 'Production',
      body: 'CineForge™ builds the full asset library — copy, creative, and creator briefs calibrated per audience segment.',
      label: 'Asset library'
    },
    {
      num: '04',
      title: 'Amplify + Monitor',
      body: 'Creators go live. Ads run. FanConvo™ activates. Live Ticker watches performance daily and we move when the data says to.',
      label: 'Campaign + dashboard'
    },
    {
      num: '05',
      title: 'Final Cut',
      body: 'An honest post-mortem: what moved tickets, what didn\'t, and why. The data sharpens every film that follows.',
      label: 'Post-Mortem Report'
    }
  ];

  return (
    <section id="how-it-works" ref={ref as any} className="py-24 md:py-40 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-16 space-y-6">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white-tertiary font-bold block">How we work</span>
        <h2 className="text-[40px] md:text-[64px] font-bold text-white-primary leading-[1.1] tracking-tighter max-w-2xl">From the first brief — to full theaters.</h2>
      </div>

      <div className="relative px-6 cursor-grab active:cursor-grabbing">
        <motion.div 
          drag="x"
          dragConstraints={{ right: 0, left: -((steps.length - 1) * 340) }}
          className="flex gap-6 w-max pb-10"
        >
          {steps.map((step, i) => (
            <StepCard key={`step-${i}`} step={step} index={i} />
          ))}
        </motion.div>
        
        {/* Subtle Gradient Shadows for indicating more content */}
        <div className="absolute top-0 right-0 bottom-0 w-32 bg-gradient-to-l from-black-1 to-transparent pointer-events-none z-10" />
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="flex items-center gap-2">
          <div className="w-12 h-[1px] bg-crimson" />
          <span className="text-[10px] font-mono text-white-tertiary uppercase tracking-widest italic">Swipe or drag to explore steps</span>
        </div>
      </div>
    </section>
  );
}

interface StepCardProps {
  step: { num: string; title: string; body: string; label: string };
  index: number;
}

function StepCard({ step, index }: StepCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="w-[320px] md:w-[380px] bg-black-2 border border-border-subtle p-8 md:p-10 rounded-card-lg space-y-6 group hover:border-crimson/30 transition-colors"
    >
      <div className="flex justify-between items-start">
        <span className="font-mono text-[12px] font-bold text-crimson uppercase tracking-[0.15em] opacity-80 group-hover:opacity-100 transition-opacity">Step — {step.num}</span>
        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white-tertiary font-mono text-[11px] group-hover:bg-crimson group-hover:text-white group-hover:border-crimson transition-all">
          {index + 1}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[24px] md:text-[28px] font-bold text-white-primary tracking-tighter leading-tight">{step.title}</h3>
        <p className="text-[16px] text-white-secondary leading-relaxed line-clamp-4">
          {step.body}
        </p>
      </div>

      <div className="pt-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-crimson" />
          <span className="text-[13px] font-medium text-white-tertiary italic">
            {step.label}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
