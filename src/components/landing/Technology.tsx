import React from 'react';
import { motion } from 'motion/react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

export default function Technology() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const tools = [
    {
      id: '01',
      kicker: 'SEBELUM SATU RUPIAH KELUAR UNTUK IKLAN',
      name: 'AudienceDNA™',
      body: 'Pertanyaan pertama dalam setiap campaign bukan "mau pasang iklan di mana?" tapi "siapa yang kita ajak bicara?"\n\nKami menganalisis jutaan percakapan online dalam Bahasa Indonesia yang sebenarnya — bukan data impor dari model luar yang tidak mengerti bedanya "film ini relate banget" dan "film ini lebay."\n\nHasilnya jadi fondasi semua yang kami kerjakan: dari pesan yang kami tulis, kreator yang kami pilih, sampai platform yang kami prioritaskan.',
      visual: (
        <div className="grid grid-cols-2 gap-3">
          {['Penggemar Horor', 'Remaja Urban', 'Cinephile Millennial', 'Penonton Keluarga'].map((label, i) => (
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
      kicker: 'SEBELUM TANGGAL RILIS DIKUNCI',
      name: 'BoxPredict™',
      body: 'Pilih tanggal rilis yang salah, dan tidak ada campaign terbaik di dunia yang bisa menyelamatkan filmmu.\n\nKami memodelkan seluruh gambaran: film apa yang bersaing di bulan yang sama, momen apa yang sedang terjadi di masyarakat, kapasitas bioskop per kota, dan bagaimana genre filmmu biasanya perform di kondisi serupa.\n\nBukan satu angka yang terasa menenangkan. Tiga skenario yang jujur — dengan asumsi yang bisa kamu periksa sendiri.',
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
      kicker: 'SEBELUM MATERI KREATIF DIPRODUKSI',
      name: 'CineForge™',
      body: 'Trailer yang bagus secara sinematik belum tentu bekerja sebagai alat marketing.\n\nKami merancang dan menguji semua materi — trailer, poster, caption, konten TikTok — berdasarkan data tentang apa yang benar-benar beresonansi dengan penonton yang kamu targetkan.\n\nKeputusan kreatif di KALA bukan voting di ruang meeting. Ada angka di balik setiap pilihan.',
      visual: (
        <div className="grid grid-cols-2 gap-2">
          {['Tagline', 'Trailer Hook', 'Caption TikTok', 'WA Blast', 'Press Release', 'Creator Brief'].map((item, i) => (
            <div key={i} className="text-[11px] font-medium text-white-secondary bg-black-6 border border-border-default px-3 py-2 rounded-md">
              {item}
            </div>
          ))}
        </div>
      )
    },
    {
      id: '04',
      kicker: 'SEBELUM SATU KREATOR PUN DIHUBUNGI',
      name: 'StarGraph™',
      body: 'Ada puluhan ribu kreator di Indonesia. Tapi berapa yang audiensnya benar-benar adalah orang yang akan nonton filmmu?\n\nKami memetakan lebih dari 12.000 kreator dan mencocokkan mereka dengan profil penonton filmmu — bukan berdasarkan jumlah follower, tapi berdasarkan siapa yang sebenarnya mereka pengaruhi dan seberapa besar overlap-nya dengan target filmmu.\n\nSetelah campaign selesai, kamu tahu persis kreator mana yang menggerakkan tiket. Bukan perkiraan. Attribution nyata.',
      visual: (
        <div className="aspect-square relative flex items-center justify-center border border-border-subtle rounded-full p-8">
           <div className="w-24 h-24 bg-crimson/20 rounded-full flex items-center justify-center text-crimson font-mono text-[10px] text-center px-4 leading-tight">
             12.000+ KREATOR
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
      kicker: 'SELAMA CAMPAIGN BERJALAN, 24 JAM SEHARI',
      name: 'FanConvo™',
      body: 'Setiap film punya calon penonton yang penasaran — mereka cari informasi di Instagram, TikTok, WhatsApp, tapi tidak ada yang merespons.\n\nKami membangun AI persona untuk setiap film yang kami tangani. Bisa menjawab pertanyaan, membangun antusiasme, mengarahkan ke pembelian tiket — dalam Bahasa Indonesia yang terdengar manusiawi.\n\nEngagement terus berjalan bahkan saat tim kami tidur.',
      visual: (
        <div className="space-y-3">
          <div className="bg-black-5 border border-border-subtle p-3 rounded-lg rounded-tl-none mr-8">
            <p className="text-[11px] text-white-secondary leading-tight">ini filmnya horor berat gak?</p>
          </div>
          <div className="bg-crimson/10 border border-crimson/20 p-3 rounded-lg rounded-tr-none ml-8">
            <p className="text-[11px] text-white-primary leading-tight">Ada jumpscarenya sih, tapi lebih fokus ke atmosfer & story. Berani nonton? 😉</p>
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
      kicker: 'SETELAH FILM TAYANG — SETIAP HARI, BUKAN SEMINGGU SEKALI',
      name: 'Live Ticker',
      body: 'Selama ini, produser tahu performa film mereka tujuh hari setelah penayangan — dari laporan mingguan yang datang terlambat untuk direspons.\n\nKami memantau data bioskop sepanjang hari: filmmu sedang naik atau turun? Kota mana yang merespons paling kuat? Apakah ada sinyal bahwa budget perlu direalokasi?\n\nKetika ada keputusan yang harus diambil, kamu punya informasinya hari itu — bukan seminggu kemudian.',
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
             Yang membuat kami berbeda
           </motion.span>
           <motion.h2 
            initial={{ opacity: 0, y: 24 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-[clamp(32px,4.5vw,56px)] font-bold text-white-primary leading-[1.05] tracking-tighter"
           >
             Agency lain punya tim kreatif. Kami punya itu — ditambah sesuatu yang tidak mereka miliki.
           </motion.h2>
        </div>
        <motion.p 
          initial={{ opacity: 0, y: 24 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="text-[17px] text-white-secondary leading-relaxed"
        >
          Semua agency digital bisa buat konten. Banyak yang bisa kelola iklan. Tapi tidak ada yang bisa menjawab pertanyaan ini dengan data yang sebenarnya. Kami bisa.
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
