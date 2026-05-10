import React from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

export default function HowItWorks() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const containerRef = React.useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const progressHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const steps = [
    {
      num: '01',
      title: 'Dengarkan dulu.',
      body: 'Tidak ada template. Tidak ada asumsi. Kami pelajari filmmu dari awal — cerita, cast, genre, posisi di pasar, dan apa yang sudah pernah dicoba sebelumnya.\n\nDua minggu pertama adalah tentang memahami, bukan langsung memberikan solusi.'
    },
    {
      num: '02',
      title: 'Rancang bersama.',
      body: 'Dari data yang terkumpul, kami susun satu rencana: kapan rilis, siapa yang ditarget, pesan apa yang paling kuat, dan di mana setiap rupiah paling efisien digunakan.\n\nSemua dibahas bersama. Bukan diserahkan begitu saja.'
    },
    {
      num: '03',
      title: 'Jalankan — dan sesuaikan setiap hari.',
      body: 'Kampanye berjalan. Data masuk terus. Kalau sesuatu tidak bekerja, kami tahu dalam 48 jam. Dan kami bergerak — bukan menunggu laporan bulanan.'
    },
    {
      num: '04',
      title: 'Pertanggungjawaban penuh.',
      body: 'Setelah film rilis, ada satu laporan yang jujur: apa yang berhasil, apa yang tidak, dan kenapa.\n\nBukan untuk membenarkan pekerjaan kami. Tapi karena pelajaran dari film ini adalah modal untuk film berikutnya.'
    }
  ];

  return (
    <section id="how-it-works" ref={ref as any} className="py-40 px-6 max-w-7xl mx-auto space-y-24">
      <div className="space-y-6 max-w-2xl">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white-tertiary font-bold block">Bagaimana kami bekerja</span>
        <h2 className="text-[48px] md:text-[64px] font-bold text-white-primary leading-[1] tracking-tighter">Dari brief pertama — sampai bioskop penuh.</h2>
      </div>

      <div ref={containerRef} className="relative pl-12 md:pl-24 py-10">
        {/* Vertical Line */}
        <div className="absolute left-[3px] md:left-[11px] top-0 bottom-0 w-[1px] bg-white/10" />
        <motion.div 
          style={{ height: progressHeight }}
          className="absolute left-[3px] md:left-[11px] top-0 w-[1px] bg-crimson z-10 origin-top"
        />

        <div className="space-y-40">
          {steps.map((step, i) => (
            <StepItem key={i} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepItem({ step, index }: { step: any, index: number }) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.5 });

  return (
    <div ref={ref as any} className="relative space-y-4">
      {/* Dot */}
      <div className="absolute left-[-12px] md:left-[-19px] top-4 z-20">
        <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full border-4 border-black-2 transition-colors duration-500 ${isVisible ? 'bg-crimson scale-110' : 'bg-white/20'}`} />
        {isVisible && (
           <div className="absolute inset-0 bg-crimson rounded-full animate-ping opacity-25" />
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={isVisible ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-3"
      >
        <span className="font-mono text-[11px] font-bold text-crimson uppercase tracking-[0.15em]">{step.num} — Step</span>
        <h3 className="text-[28px] md:text-[32px] font-bold text-white-primary tracking-tighter">{step.title}</h3>
        <p className="text-[17px] text-white-secondary leading-relaxed max-w-xl whitespace-pre-line">
          {step.body}
        </p>
      </motion.div>
    </div>
  );
}
