import React, { useEffect, useState } from 'react';
import { Outlet, useParams, Navigate } from 'react-router-dom';
import { useFilmContext } from '../../hooks/useFilmContext';
import { useAuth } from '../../hooks/useAuth';
import { dbService } from '../../services/dbService';
import { Loader2 } from 'lucide-react';

// URL → context syncer for /clients/:clientId/films/:filmId/... routes.
// Makes the URL the source of truth so deep-links, back/forward, and reloads
// hydrate activeClient + activeFilm correctly even if localStorage is stale or
// pointing at a different film.
export default function FilmRouteSync() {
  const { clientId, filmId } = useParams<{ clientId: string; filmId: string }>();
  const { activeClient, activeFilm, setActiveClient, setActiveFilm } = useFilmContext();
  const { isAdmin } = useAuth();
  const [hydrating, setHydrating] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!clientId || !filmId) return;
    const clientMatches = activeClient?.id === clientId;
    const filmMatches = activeFilm?.id === filmId;
    if (clientMatches && filmMatches) return;

    let cancelled = false;
    setHydrating(true);
    setNotFound(false);

    (async () => {
      try {
        const needClient = !clientMatches;
        const needFilm = !filmMatches;
        const [client, campaigns] = await Promise.all([
          needClient ? dbService.getClient(clientId) : Promise.resolve(activeClient),
          needFilm ? dbService.getCampaigns(undefined, isAdmin) : Promise.resolve(null),
        ]);
        if (cancelled) return;

        if (needClient) {
          if (!client) { setNotFound(true); return; }
          setActiveClient(client);
        }

        if (needFilm) {
          const film = campaigns?.find(c => c.id === filmId) || null;
          if (!film) { setNotFound(true); return; }
          setActiveFilm(film);
        }
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();

    return () => { cancelled = true; };
  }, [clientId, filmId, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  if (notFound) {
    return <Navigate to="/campaigns" replace />;
  }

  if (hydrating) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-crimson animate-spin" />
        <span className="text-ink-tertiary font-mono text-xs uppercase tracking-widest">Loading...</span>
      </div>
    );
  }

  return <Outlet />;
}
