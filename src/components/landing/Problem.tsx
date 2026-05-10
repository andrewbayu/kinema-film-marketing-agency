import React from 'react';
import { motion } from 'motion/react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

export default function Problem() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const cards = [
    {
      tag: 'DATA VACUUM',
      title: 'Penonton ada. Datanya tidak.',
      body: 'Jaringan bioskop menyimpan data penonton untuk kepentingan mereka sendiri. Itu hak mereka. Tapi konsekuensinya: setiap film baru mulai dari nol.\n\nSiapa yang datang minggu lalu? Dari mana mereka tahu? Mengapa mereka memilih film itu, bukan yang lain? Tidak ada yang tahu pasti.'
    },
    {
      tag: 'RELEASE CONGESTION',
      title: '278 film. Satu kalender.',
      body: 'Setiap tahun, ratusan film bersaing di bioskop yang sama, di bulan-bulan yang sama.\n\nTiming rilis bisa membuat atau menghancurkan sebuah film jauh sebelum penonton sempat memberikan pendapat. Dan mayoritas keputusan timing itu masih dibuat berdasarkan perkiraan, bukan perhitungan.'
    },
    {
      tag: 'UNMEASURED SPEND',
      title: 'Budget keluar. Hasilnya tidak jelas.',
      body: 'KOL sudah dibayar. Iklan sudah tayang. Tapi berapa tiket yang terjual karena itu? Tidak ada yang bisa menjawab dengan pasti.\n\nKalau tidak bisa diukur, tidak bisa diperbaiki. Dan siklus yang sama berulang dari film ke film.'
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
          Kenapa ini terjadi
        </motion.span>
        
        <motion.h2 
          initial={{ opacity: 0, y: 24 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1 }}
          className="text-[clamp(32px,5vw,56px)] font-bold text-white-primary leading-[1.1] tracking-tighter"
        >
          Bukan masalah kreativitas. Masalah informasi.
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 24 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="text-[18px] text-white-secondary leading-relaxed"
        >
          Hampir semua orang di industri film Indonesia tahu ada yang tidak beres dengan cara marketing bekerja. Tapi tidak banyak yang tahu persis di mana letak masalahnya.
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
              <span className="font-mono text-[9px] text-crimson font-bold tracking-widest uppercase">{card.tag}</span>
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
