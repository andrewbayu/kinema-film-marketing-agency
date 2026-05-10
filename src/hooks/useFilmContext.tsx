import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Film, AudienceDNAResult, BoxPredictResult } from '../lib/types';
import { mockFilms } from '../lib/mockData';

interface FilmContextType {
  activeFilm: Film | null;
  setActiveFilm: (film: Film | null) => void;
  audienceDNAOutput: AudienceDNAResult | null;
  setAudienceDNAOutput: (result: AudienceDNAResult | null) => void;
  boxPredictOutput: BoxPredictResult | null;
  setBoxPredictOutput: (result: BoxPredictResult | null) => void;
}

const FilmContext = createContext<FilmContextType | undefined>(undefined);

export function FilmProvider({ children }: { children: ReactNode }) {
  const [activeFilm, setActiveFilm] = useState<Film | null>(mockFilms[0]); // Default to first film
  const [audienceDNAOutput, setAudienceDNAOutput] = useState<AudienceDNAResult | null>(null);
  const [boxPredictOutput, setBoxPredictOutput] = useState<BoxPredictResult | null>(null);

  return (
    <FilmContext.Provider
      value={{
        activeFilm,
        setActiveFilm,
        audienceDNAOutput,
        setAudienceDNAOutput,
        boxPredictOutput,
        setBoxPredictOutput,
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
