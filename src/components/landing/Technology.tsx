import React from 'react';
import { motion } from 'motion/react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

export default function Technology() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const tools = [
    {
      id: '01',
      kicker: 'BEFORE A SINGLE PENNY IS SPENT ON ADS',
      name: 'AudienceDNA™',
      body: 'The first question in every campaign isn\'t "where to run ads?" but "who are we talking to?"\n\nWe analyze millions of actual online conversations in Indonesian — not imported data from foreign models that don\'t know the difference between "relatable" and "over-the-top."\n\nThe result becomes the foundation of everything we do: from the messages we craft, the creators we select, to the platforms we prioritize.',
      visual: (
        <div className="grid grid-cols-2 gap-3">
          {['Horror Fans', 'Urban Youth', 'Millennial Cinephiles', 'Family Audience'].map((label, i) => (
            <div key={i} className="bg-black-6 border border-border-default p-4 rounded-lg space-y-3">
              <div className="text-[10px] font-bold text-white-primary leading-tight">{label}</div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full bg-crimson`} style={{ width: `${80 - (i * 15)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      id: '02',
      kicker: 'BEFORE THE RELEASE DATE IS LOCKED',
      name: 'BoxPredict™',
      body: 'Choose the wrong release date, and no campaign in the world can save your film.\n\nWe model the full picture: competing films, societal moments, theater capacity per city, and how your genre performs in similar conditions.\n\nNot a single comforting number. Three honest scenarios — with assumptions you can verify yourself.',
      visual: (
        <div className="space-y-3">
          {['BEAR', 'BASE', 'BULL'].map((type, i) => (
            <div key={i} className={`p-4 rounded-lg border ${type === 'BULL' ? 'bg-crimson/5 border-crimson/20' : 'bg-black-6 border-border-default'}`}>
              <div className="flex justify-between items-center">
                <span className={`font-mono text-[10px] font-bold ${type === 'BULL' ? 'text-crimson' : 'text-white-tertiary'}`}>{type} CASE</span>
                <span className="text-[16px] font-black">{type === 'BEAR' ? '300K' : type === 'BASE' ? '1.2M' : '2.8M'}</span>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      id: '03',
      kicker: 'BEFORE CREATIVE ASSETS ARE PRODUCED',
      name: 'CineForge™',
      body: 'A cinematically great trailer isn\'t necessarily a great marketing tool.\n\nWe design and test all assets — trailers, posters, captions, TikTok content — based on data of what truly resonates with your target audience.\n\nCreative decisions at KALA aren\'t boardroom votes. There are numbers behind every choice.',
      visual: (
        <div className="grid grid-cols-2 gap-2">
          {['Tagline', 'Trailer Hook', 'TikTok Caption', 'WA Blast', 'Press Release', 'Creator Brief'].map((item, i) => (
            <div key={i} className="text-[11px] font-medium text-white-secondary bg-black-6 border border-border-default px-3 py-2 rounded-md">
              {item}
            </div>
          ))}
        </div>
      )
    },
    {
      id: '04',
      kicker: 'BEFORE A SINGLE CREATOR IS CONTACTED',
      name: 'StarGraph™',
      body: 'There are tens of thousands of creators in Indonesia. But how many have an audience that will actually watch your film?\n\nWe map over 12,000 creators and match them with your film\'s audience profile — not by follower count, but by who they actually influence and the overlap with your target.\n\nAfter the campaign, you know exactly which creator moved tickets. Not an estimate. Real attribution.',
      visual: (
        <div className="aspect-square relative flex items-center justify-center border border-border-subtle rounded-full p-8">
           <div className="w-24 h-24 bg-crimson/20 rounded-full flex items-center justify-center text-crimson font-mono text-[10px] text-center px-4 leading-tight">
             12,000+ CREATORS
           </div>
           {[0, 60, 120, 180, 240, 300].map((deg, i) => (
             <div 
               key={i} 
               className="absolute w-2 h-2 bg-crimson rounded-full" 
               style={{ 
                 transform: `rotate(${deg}deg) translateX(80px)` 
               }} 
             />
           ))}
        </div>
      )
    },
    {
      id: '05',
      kicker: 'WHILE THE CAMPAIGN RUNS, 24 HOURS A DAY',
      name: 'FanConvo™',
      body: 'Every film has curious potential audiences — they seek info on Instagram, TikTok, WhatsApp, but no one responds.\n\nWe build AI personas for every film we handle. Answering questions, building hype, and driving ticket sales — in human-sounding Indonesian.\n\nEngagement continues even while our team sleeps.',
      visual: (
        <div className="space-y-3">
          <div className="bg-black-5 border border-border-subtle p-3 rounded-lg rounded-tl-none mr-8">
            <p className="text-[11px] text-white-secondary leading-tight">is this a heavy horror film?</p>
          </div>
          <div className="bg-crimson/10 border border-crimson/20 p-3 rounded-lg rounded-tr-none ml-8">
            <p className="text-[11px] text-white-primary leading-tight">It has jumpscares, but focuses more on atmosphere & story. Dare to watch? 😉</p>
          </div>
          <div className="flex justify-center gap-4 pt-4 opacity-50">
             <div className="w-6 h-6 bg-white/10 rounded-full" />
             <div className="w-6 h-6 bg-white/10 rounded-full" />
             <div className="w-6 h-6 bg-white/10 rounded-full" />
          </div>
        </div>
      )
    },
    {
      id: '06',
      kicker: 'AFTER THE FILM RELEASES — EVERY DAY, NOT ONCE A WEEK',
      name: 'Live Ticker',
      body: 'Until now, producers learned their film\'s performance seven days after release — from weekly reports that arrive too late to act upon.\n\nWe monitor theater data throughout the day: is your film up or down? Which city responds strongest? Are there signals for budget reallocation?\n\nWhen a decision is needed, you have the info that day — not a week later.',
      visual: (
        <div className="space-y-4">
          {[
            { city: 'Jakarta', progress: 82, trend: '↑' },
            { city: 'Surabaya', progress: 63, trend: '→' },
            { city: 'Medan', progress: 51, trend: '↓', color: 'bg-orange-kala' }
          ].map((item, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono font-bold">
                <span className="text-white-tertiary">{item.city}</span>
                <span className={item.color ? 'text-orange-kala' : 'text-crimson'}>{item.trend}</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${item.color || 'bg-crimson'}`} style={{ width: `${item.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      )
    }
  ];

  return (
    <section id="technology" ref={ref as any} className="py-40 px-6 max-w-7xl mx-auto space-y-40">
      <div className="grid md:grid-cols-[60%_auto] gap-12 items-end">
        <div className="space-y-8">
           <motion.span 
            initial={{ opacity: 0, y: 12 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-white-tertiary font-bold block"
           >
             What Sets Us Apart
           </motion.span>
           <motion.h2 
            initial={{ opacity: 0, y: 24 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-[clamp(32px,4.5vw,56px)] font-bold text-white-primary leading-[1.05] tracking-tighter"
           >
             Other agencies have creative teams. We have that — plus something they don't.
           </motion.h2>
        </div>
        <motion.p 
          initial={{ opacity: 0, y: 24 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="text-[17px] text-white-secondary leading-relaxed"
        >
          Any digital agency can make content. Many can manage ads. But none can answer these questions with real data. We can.
        </motion.p>
      </div>

      <div className="space-y-40">
        {tools.map((tool, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={`grid md:grid-cols-[1fr_400px] gap-20 items-center ${i % 2 === 1 ? 'md:grid-cols-[400px_1fr]' : ''}`}
          >
            <div className={`space-y-8 ${i % 2 === 1 ? 'md:order-2' : ''}`}>
              <div className="space-y-3">
                <span className="font-mono text-[11px] font-bold text-crimson uppercase tracking-[0.15em]">{tool.kicker}</span>
                <h3 className="text-[32px] md:text-[40px] font-bold text-white-primary tracking-tighter">TOOL {tool.id} — {tool.name}</h3>
              </div>
              <p className="text-[16px] text-white-secondary leading-relaxed whitespace-pre-line">
                {tool.body}
              </p>
            </div>
            <div className={`bg-black-3 border border-border-default rounded-2xl p-10 shadow-2xl relative overflow-hidden group ${i % 2 === 1 ? 'md:order-1' : ''}`}>
               <div className="absolute inset-0 bg-crimson/5 opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="relative z-10">
                 {tool.visual}
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
