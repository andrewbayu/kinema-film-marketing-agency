import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Film, Client, AudienceDNAResult, BoxPredictResult, CineForgeResult } from '../lib/types';

interface FilmContextType {
  activeClient: Client | null;
  setActiveClient: (client: Client | null) => void;
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

// Strip Firestore-managed fields that don't survive localStorage round-trip cleanly
// (Timestamp objects lose their toDate method when serialized).
function sanitizeFilmForStorage(film: Film): Film {
  const { createdAt, userId, lastVisibilityScan, ...rest } = film;
  return rest as Film;
}

function sanitizeClientForStorage(client: Client): Client {
  const { createdAt, ...rest } = client;
  return rest as Client;
}

export function FilmProvider({ children }: { children: ReactNode }) {
  const [activeClient, setActiveClient] = useState<Client | null>(() => {
    const saved = localStorage.getItem('activeClient');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeFilm, setActiveFilm] = useState<Film | null>(() => {
    const saved = localStorage.getItem('activeFilm');
    return saved ? JSON.parse(saved) : null;
  });
  const [audienceDNAOutput, setAudienceDNAOutput] = useState<AudienceDNAResult | null>(null);
  const [boxPredictOutput, setBoxPredictOutput] = useState<BoxPredictResult | null>(null);
  const [cineForgeOutput, setCineForgeOutput] = useState<CineForgeResult | null>(null);

  const handleSetActiveClient = (client: Client | null) => {
    if (client) {
      const clean = sanitizeClientForStorage(client);
      setActiveClient(clean);
      localStorage.setItem('activeClient', JSON.stringify(clean));
      // If activeFilm belongs to a different client, drop it — switching clients
      // shouldn't leave stale cross-client film context.
      if (activeFilm?.clientId && activeFilm.clientId !== client.id) {
        setActiveFilm(null);
        localStorage.removeItem('activeFilm');
      }
    } else {
      setActiveClient(null);
      localStorage.removeItem('activeClient');
    }
  };

  const handleSetActiveFilm = (film: Film | null) => {
    if (film) {
      const clean = sanitizeFilmForStorage(film);
      setActiveFilm(clean);
      localStorage.setItem('activeFilm', JSON.stringify(clean));
    } else {
      setActiveFilm(null);
      localStorage.removeItem('activeFilm');
    }
  };

  return (
    <FilmContext.Provider
      value={{
        activeClient,
        setActiveClient: handleSetActiveClient,
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
