import React from 'react';
import { useNavScroll } from '../../hooks/useNavScroll';
import { useAuth } from '../../hooks/useAuth';

export default function Nav() {
  const scrolled = useNavScroll();
  const { login } = useAuth();

  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`fixed top-0 w-full z-[1000] transition-all duration-300 ${scrolled ? 'bg-black-2/60 border-b border-border-subtle backdrop-blur-[24px]' : 'bg-black-2/60 backdrop-blur-[24px]'}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="https://storage.googleapis.com/bluestark_explorer/Kala-logo.png" 
            alt="Kala Logo" 
            className="h-14 w-auto" 
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="hidden md:flex items-center gap-10">
          {[
            { label: 'Cara Kerja', id: '#how-it-works' },
            { label: 'Teknologi', id: '#technology' },
            { label: 'Tentang', id: '#about' },
            { label: 'Kontak', id: '#contact' }
          ].map((link) => (
            <button 
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="text-[13px] font-medium text-white-secondary hover:text-white-primary transition-colors"
            >
              {link.label}
            </button>
          ))}
        </div>

        <button 
          onClick={login}
          className="relative group bg-crimson hover:bg-crimson-rich text-white-primary px-6 py-2.5 rounded-full font-semibold text-[13px] transition-all active:scale-95 shadow-[0_4px_20px_rgba(155,28,28,0.2)]"
        >
          Ngobrol Dulu →
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-black-4 border border-border-default px-3 py-1.5 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Gratis. Tanpa agenda. Kita lihat dulu.
          </div>
        </button>
      </div>
    </nav>
  );
}
