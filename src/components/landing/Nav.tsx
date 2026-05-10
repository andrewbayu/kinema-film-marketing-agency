import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavScroll } from '../../hooks/useNavScroll';

export default function Nav() {
  const scrolled = useNavScroll();
  const navigate = useNavigate();

  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`fixed top-0 w-full z-[1000] transition-all duration-300 ${scrolled ? 'bg-black-2/60 border-b border-border-subtle backdrop-blur-[24px]' : 'bg-black-2/60 backdrop-blur-[24px]'}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="https://storage.googleapis.com/bluestark_explorer/Kala.png" 
            alt="Kala Logo" 
            className="h-10 w-auto" 
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="hidden md:flex items-center gap-10">
          {[
            { label: 'How it Works', id: '#how-it-works' },
            { label: 'Technology', id: '#technology' },
            { label: 'About', id: '#about' },
            { label: 'Contact', id: '#contact' }
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
          onClick={() => navigate('/discussion')}
          className="relative group bg-crimson hover:bg-crimson-rich text-white-primary px-6 py-2.5 rounded-full font-semibold text-[13px] transition-all active:scale-95 shadow-[0_4px_20px_rgba(155,28,28,0.2)]"
        >
          Talk with KALA →
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-black-4 border border-border-default px-3 py-1.5 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Free. No agenda. Let's explore.
          </div>
        </button>
      </div>
    </nav>
  );
}
