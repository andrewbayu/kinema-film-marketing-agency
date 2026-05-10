import React from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function Footer() {
  const { login } = useAuth();

  return (
    <footer className="py-24 px-6 border-t border-border-subtle bg-black-1">
      <div className="max-w-7xl mx-auto space-y-20">
        <div className="grid md:grid-cols-[1fr_repeat(3,auto)] gap-16 md:gap-32">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img 
                src="https://storage.googleapis.com/bluestark_explorer/Kala-logo.png" 
                alt="Kala Logo" 
                className="h-6 w-auto opacity-80 hover:opacity-100 transition-opacity" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-1">
              <p className="text-[14px] text-white-secondary font-medium italic">The operating system for film marketing.</p>
              <p className="font-mono text-[11px] text-white-tertiary">Kata.ai × Samara Group · Indonesia · Est. 2026</p>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="font-mono text-[10px] font-bold text-white-tertiary uppercase tracking-widest">Platform</h4>
            <ul className="space-y-4 text-[13px] font-medium text-white-secondary">
              {['AudienceDNA™', 'BoxPredict™', 'CineForge™', 'StarGraph™', 'FanConvo™', 'Live Ticker'].map(link => (
                <li key={link}><a href="#" className="hover:text-white-primary transition-colors">{link}</a></li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="font-mono text-[10px] font-bold text-white-tertiary uppercase tracking-widest">Perusahaan</h4>
            <ul className="space-y-4 text-[13px] font-medium text-white-secondary">
              {['Cara Kerja', 'Tentang Kami', 'Tulisan & Insight', 'Kontak'].map(link => (
                <li key={link}><a href="#" className="hover:text-white-primary transition-colors">{link}</a></li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="font-mono text-[10px] font-bold text-white-tertiary uppercase tracking-widest">Kontak</h4>
            <ul className="space-y-4 text-[13px] font-medium text-white-secondary">
              <li><a href="mailto:hello@kala.id" className="hover:text-white-primary transition-colors">hello@kala.id</a></li>
              <li><a href="#" className="hover:text-white-primary transition-colors">LinkedIn</a></li>
              <li><a href="#" className="hover:text-white-primary transition-colors">Instagram</a></li>
              <li><button onClick={login} className="text-crimson font-bold">Mulai Percakapan →</button></li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[11px] font-mono text-white-tertiary italic">© 2026 KALA. Hak cipta dilindungi.</p>
          <p className="text-[11px] font-mono text-white-tertiary font-bold uppercase tracking-widest">Khusus film Indonesia.</p>
        </div>
      </div>
    </footer>
  );
}
