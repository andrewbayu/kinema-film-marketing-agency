import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Film, AudienceDNAResult, BoxPredictResult, CineForgeResult } from '../lib/types';
import { mockFilms } from '../lib/mockData';

interface FilmContextType {
  activeFilm: Film | null;
  setActiveFilm: (film: Film | null) => void;
  audienceDNAOutput: AudienceDNAResult | null;
  setAudienceDNAOutput: (result: AudienceDNAResult | null) => void;
  boxPredictOutput: BoxPredictResult | null;
  setBoxPredictOutput: (result: BoxPredictResult | null) => void;
  cineForgeOutput: CineForgeResult | null;
  setCineForgeOutput: (result: CineForgeResult | null) => void;
}

const FilmContext = createContext<FilmContextType | undefined>(undefined);

export function FilmProvider({ children }: { children: ReactNode }) {
  const [activeFilm, setActiveFilm] = useState<Film | null>(() => {
    const saved = localStorage.getItem('activeFilm');
    return saved ? JSON.parse(saved) : null;
  });
  const [audienceDNAOutput, setAudienceDNAOutput] = useState<AudienceDNAResult | null>(null);
  const [boxPredictOutput, setBoxPredictOutput] = useState<BoxPredictResult | null>(null);
  const [cineForgeOutput, setCineForgeOutput] = useState<CineForgeResult | null>(null);

  const handleSetActiveFilm = (film: Film | null) => {
    setActiveFilm(film);
    if (film) {
      localStorage.setItem('activeFilm', JSON.stringify(film));
    } else {
      localStorage.removeItem('activeFilm');
    }
  };

  return (
    <FilmContext.Provider
      value={{
        activeFilm,
        setActiveFilm: handleSetActiveFilm,
        audienceDNAOutput,
        setAudienceDNAOutput,
        boxPredictOutput,
        setBoxPredictOutput,
        cineForgeOutput,
        setCineForgeOutput,
      }}
    >
      {children}
    </FilmContext.Provider>
  );
}

export function useFilmContext() {
  const context = useContext(FilmContext);
  if (context === undefined) {
    throw new Error('useFilmContext must be used within a FilmProvider');
  }
  return context;
}
