// Centralized route builders for the Client→Film hierarchy (Phase 1c).
// Callers prefer film-scoped URLs when a film has a clientId; otherwise they
// fall back to the legacy flat routes (still wired in App.tsx for compat).

export type FilmTool =
  | 'audience-dna'
  | 'box-predict'
  | 'visibility-tracker'
  | 'live-ticker'
  | 'cineforge'
  | 'fib';

export function filmToolPath(clientId: string | undefined, filmId: string, tool: FilmTool): string {
  if (clientId) return `/clients/${clientId}/films/${filmId}/${tool}`;
  // Legacy fallback (pre-migration films without clientId).
  if (tool === 'fib') return `/fib/${filmId}`;
  return `/${tool}`;
}

export function filmHomePath(clientId: string | undefined, filmId: string): string {
  if (clientId) return `/clients/${clientId}/films/${filmId}`;
  return '/';
}
