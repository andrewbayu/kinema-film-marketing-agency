import { ShowtimeSnapshot, CityTier, CinemaChain } from './types';

export interface CityDelta {
  city: string;
  currentCount: number;
  previousCount: number;
  delta: number;
  deltaPct: number;
  tier?: CityTier;
}

export interface CinemaDelta {
  cinema: string;
  city: string;
  chain: CinemaChain;
  currentCount: number;
  previousCount: number;
  delta: number;
  deltaPct: number;
}

export interface ShowtimeDeltaView {
  hasComparison: boolean;
  currentSnapshot: ShowtimeSnapshot;
  previousSnapshot: ShowtimeSnapshot | null;
  gapDays: number;
  gapLabel: string; // "kemarin", "2 hari lalu", "hari yang sama"
  totalDelta: number;
  totalDeltaPct: number;
  cities: CityDelta[]; // sorted by abs(delta) desc, then by current desc as tiebreaker
  cinemasByCity: Record<string, CinemaDelta[]>;
  topGainers: CityDelta[]; // top 3 positive city deltas
  topLosers: CityDelta[]; // top 3 negative city deltas
}

/**
 * Computes day-to-day showtime allocation deltas.
 *
 * Snapshots are bucketed by calendar day (latest per day wins) so multiple scans
 * in one day don't pollute the comparison. The latest day is diffed against the
 * most recent prior day with a snapshot, and the actual gap in days is reported
 * so the UI can label e.g. "Δ vs 3 hari lalu" when scans aren't strictly daily.
 */
export function computeShowtimeDeltas(history: ShowtimeSnapshot[]): ShowtimeDeltaView | null {
  if (!history || history.length === 0) return null;

  // Bucket by local calendar day; history is desc by createdAt, so first hit wins.
  const byDay = new Map<string, ShowtimeSnapshot>();
  for (const snap of history) {
    if (!snap?.scannedAt) continue;
    const day = new Date(snap.scannedAt).toISOString().slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, snap);
  }

  const daysSorted = [...byDay.keys()].sort().reverse();
  if (daysSorted.length === 0) return null;

  const current = byDay.get(daysSorted[0])!;

  if (daysSorted.length === 1) {
    return {
      hasComparison: false,
      currentSnapshot: current,
      previousSnapshot: null,
      gapDays: 0,
      gapLabel: '',
      totalDelta: 0,
      totalDeltaPct: 0,
      cities: [],
      cinemasByCity: {},
      topGainers: [],
      topLosers: []
    };
  }

  const previous = byDay.get(daysSorted[1])!;

  const gapMs = new Date(current.scannedAt).getTime() - new Date(previous.scannedAt).getTime();
  const gapDays = Math.max(1, Math.round(gapMs / (24 * 60 * 60 * 1000)));

  const totalDelta = current.totalShows - previous.totalShows;
  const totalDeltaPct = previous.totalShows > 0
    ? Math.round((totalDelta / previous.totalShows) * 100)
    : (current.totalShows > 0 ? 100 : 0);

  // ---- City deltas (outer join on city name) ----
  type CityAgg = { current: number; previous: number; tier?: CityTier };
  const cityMap = new Map<string, CityAgg>();
  for (const c of current.byCity || []) {
    cityMap.set(c.city, { current: c.count, previous: 0, tier: c.tier });
  }
  for (const c of previous.byCity || []) {
    const existing = cityMap.get(c.city);
    if (existing) existing.previous = c.count;
    else cityMap.set(c.city, { current: 0, previous: c.count, tier: c.tier });
  }

  const cities: CityDelta[] = [...cityMap.entries()]
    .map(([city, v]) => ({
      city,
      currentCount: v.current,
      previousCount: v.previous,
      delta: v.current - v.previous,
      deltaPct: v.previous > 0
        ? Math.round(((v.current - v.previous) / v.previous) * 100)
        : (v.current > 0 ? 100 : 0),
      tier: v.tier
    }))
    .sort((a, b) => {
      const absDiff = Math.abs(b.delta) - Math.abs(a.delta);
      if (absDiff !== 0) return absDiff;
      return b.currentCount - a.currentCount;
    });

  // ---- Cinema deltas (outer join on cinema+city) ----
  type CinemaAgg = { city: string; chain: CinemaChain; current: number; previous: number };
  const cinemaMap = new Map<string, CinemaAgg>();
  const aggregateCinemas = (shows: ShowtimeSnapshot['shows'], side: 'current' | 'previous') => {
    for (const s of shows || []) {
      const key = `${s.cinema}::${s.city}`;
      const count = s.showtimes?.length ?? 0;
      const existing = cinemaMap.get(key);
      if (existing) {
        existing[side] += count;
      } else {
        cinemaMap.set(key, {
          city: s.city,
          chain: s.chain,
          current: side === 'current' ? count : 0,
          previous: side === 'previous' ? count : 0
        });
      }
    }
  };
  aggregateCinemas(current.shows, 'current');
  aggregateCinemas(previous.shows, 'previous');

  const cinemasByCity: Record<string, CinemaDelta[]> = {};
  for (const [key, v] of cinemaMap.entries()) {
    const cinemaName = key.split('::')[0];
    const item: CinemaDelta = {
      cinema: cinemaName,
      city: v.city,
      chain: v.chain,
      currentCount: v.current,
      previousCount: v.previous,
      delta: v.current - v.previous,
      deltaPct: v.previous > 0
        ? Math.round(((v.current - v.previous) / v.previous) * 100)
        : (v.current > 0 ? 100 : 0)
    };
    if (!cinemasByCity[v.city]) cinemasByCity[v.city] = [];
    cinemasByCity[v.city].push(item);
  }
  for (const city of Object.keys(cinemasByCity)) {
    cinemasByCity[city].sort((a, b) => {
      const absDiff = Math.abs(b.delta) - Math.abs(a.delta);
      if (absDiff !== 0) return absDiff;
      return b.currentCount - a.currentCount;
    });
  }

  const topGainers = cities.filter(c => c.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 3);
  const topLosers = cities.filter(c => c.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 3);

  return {
    hasComparison: true,
    currentSnapshot: current,
    previousSnapshot: previous,
    gapDays,
    gapLabel: formatGapLabel(gapDays),
    totalDelta,
    totalDeltaPct,
    cities,
    cinemasByCity,
    topGainers,
    topLosers
  };
}

function formatGapLabel(gapDays: number): string {
  if (gapDays <= 0) return 'hari yang sama';
  if (gapDays === 1) return 'kemarin';
  return `${gapDays} hari lalu`;
}
