import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

export default function ClientPortal() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const [activeTab, setActiveTab] = useState<'overview' | 'ticker'>('overview');

  return (
    <section ref={ref as any} className="py-40 px-6 bg-black-1/30">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[450px_1fr] gap-20 items-center">
        <div className="space-y-10">
          <div className="space-y-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white-tertiary font-bold block">Transparansi penuh</span>
            <h2 className="text-[48px] font-bold text-white-primary leading-tight tracking-tighter">Kamu tidak perlu percaya kata-kata kami. Lihat sendiri.</h2>
          </div>
          
          <p className="text-[17px] text-white-secondary leading-relaxed">
            Setiap klien KALA punya akses ke dashboard yang menampilkan semua yang sedang berjalan — secara real-time, kapanpun kamu mau buka.<br /><br />
            Tidak perlu tunggu laporan mingguan. Tidak perlu tanya "update gimana?" Semua ada di satu tempat.
          </p>
        </div>

        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={isVisible ? { opacity: 1, scale: 1 } : {}}
           transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
           className="relative group lg:ml-auto w-full max-w-3xl"
        >
          {/* Browser Chrome */}
          <div className="bg-black-4 border border-border-default rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="h-12 bg-black-5 border-b border-white/5 flex items-center px-6 justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className={`text-[10px] font-mono font-bold tracking-widest uppercase transition-colors ${activeTab === 'overview' ? 'text-crimson' : 'text-white-tertiary shadow-sm'}`}
                >
                  CAMPAIGN OVERVIEW
                </button>
                <button 
                  onClick={() => setActiveTab('ticker')}
                  className={`text-[10px] font-mono font-bold tracking-widest uppercase transition-colors ${activeTab === 'ticker' ? 'text-crimson' : 'text-white-tertiary shadow-sm'}`}
                >
                  LIVE TICKER
                </button>
              </div>
            </div>

            <div className="p-8 min-h-[400px] relative">
              <AnimatePresence mode="wait">
                {activeTab === 'overview' ? (
                  <motion.div 
                    key="overview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
                    <div className="flex justify-between items-center border-b border-white/5 pb-6">
                      <div className="flex items-center gap-2 text-crimson font-mono text-[10px] font-bold">
                        <div className="w-2 h-2 rounded-full bg-crimson" />
                        KALA CLIENT PORTAL
                      </div>
                      <div className="text-[10px] font-mono text-white-tertiary">[Nama Film — Confidential] · T-14 hari rilis</div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                       <MetricCard label="Total Mention" value="2.4M" />
                       <MetricCard label="Trailer Views" value="18.7M" />
                       <MetricCard label="Impression" value="94.3M" />
                       <MetricCard label="Forecast" value="↑ On track" />
                    </div>

                    <div className="space-y-4 pt-6">
                       <div className="flex justify-between items-end">
                         <span className="text-[10px] font-mono text-white-tertiary font-bold uppercase tracking-widest">CAMPAIGN PROGRESS</span>
                         <span className="text-[14px] font-bold text-crimson">78%</span>
                       </div>
                       <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                         <div className="h-full bg-crimson w-[78%] rounded-full shadow-[0_0_12px_rgba(155,28,28,0.3)]" />
                       </div>
                    </div>

                    <div className="space-y-3 pt-6">
                       <div className="text-[10px] font-mono text-white-tertiary font-bold uppercase tracking-widest">RECENT ACTIVITY</div>
                       {[
                         'KOL drop batch 2 selesai — 847K impression',
                         'Trailer velocity D+7: 0.68 (di atas baseline genre)',
                         '[Download Laporan Mingguan]'
                       ].map((activity, i) => (
                         <div key={i} className="flex items-center gap-3 text-[12px] text-white-secondary bg-white/5 p-3 rounded border border-white/5">
                            <div className="w-1.5 h-1.5 rounded-full bg-crimson/50" />
                            {activity}
                         </div>
                       ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="ticker"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
                     <div className="flex justify-between items-center border-b border-white/5 pb-6">
                      <div className="flex items-center gap-2 text-crimson font-mono text-[10px] font-bold">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        LIVE TICKER · Update terakhir: 14 menit lalu
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                       <MetricCard label="Est. Admission" value="847.000" />
                       <MetricCard label="Est. Revenue" value="Rp 12.4 M" />
                       <MetricCard label="Avg Occupancy" value="71%" />
                       <MetricCard label="Trend" value="↑ Naik" />
                    </div>

                    <div className="space-y-6 pt-6">
                       {[
                         { city: 'Jakarta', progress: 82, trend: '↑' },
                         { city: 'Surabaya', progress: 63, trend: '→' },
                         { city: 'Bandung', progress: 71, trend: '↑' },
                         { city: 'Medan', progress: 51, trend: '↓', color: 'bg-orange-kala' }
                       ].map((item, i) => (
                         <div key={i} className="space-y-2">
                           <div className="flex justify-between text-[11px] font-mono font-bold">
                             <span className="text-white-secondary">{item.city}</span>
                             <span className={item.color ? 'text-orange-kala' : 'text-crimson'}>{item.progress}% {item.trend}</span>
                           </div>
                           <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                             <div className={`h-full ${item.color || 'bg-crimson'}`} style={{ width: `${item.progress}%` }} />
                           </div>
                         </div>
                       ))}
                    </div>

                    <p className="text-[10px] font-mono text-white-tertiary italic text-center pt-4">Data diperbarui setiap 4–6 jam dari jaringan bioskop nasional.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-[15px] text-white-tertiary font-medium">Laporan lengkap bisa diunduh kapanpun — dalam format yang bisa langsung dibawa ke rapat direksi.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-1">
      <div className="text-[9px] font-mono font-bold text-white-tertiary uppercase tracking-widest">{label}</div>
      <div className="text-[18px] font-black text-white-primary tracking-tight">{value}</div>
    </div>
  );
}
