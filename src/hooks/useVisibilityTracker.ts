import { useState, useEffect } from 'react';
import { VisibilityTrackerResult, Film, ShowtimeSnapshot } from '../lib/types';
import { dbService } from '../services/dbService';
import { performVisibilityScan } from '../lib/gemini';
import { firecrawlService } from '../services/firecrawlService';
import { apiClient } from '../services/apiClient';

export function useVisibilityTracker(activeFilm: Film | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestScan, setLatestScan] = useState<VisibilityTrackerResult | null>(null);
  const [history, setHistory] = useState<VisibilityTrackerResult[]>([]);
  const [cooldown, setCooldown] = useState<number | null>(null);
  const [isAutoScanning, setIsAutoScanning] = useState(false);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [latestShowtime, setLatestShowtime] = useState<ShowtimeSnapshot | null>(null);
  const [showtimeHistory, setShowtimeHistory] = useState<ShowtimeSnapshot[]>([]);
  const [isDeepCityScanning, setIsDeepCityScanning] = useState(false);

  const loadVisibilityData = async () => {
    if (!activeFilm?.id) return;
    try {
      setLoading(true);
      const [data, historyData, showtimeData, showtimeHist] = await Promise.all([
        dbService.getLatestVisibilityScan(activeFilm.id),
        dbService.getVisibilityHistory(activeFilm.id),
        dbService.getLatestShowtimeSnapshot(activeFilm.id),
        dbService.getShowtimeHistory(activeFilm.id, 30)
      ]);
      if (data) {
        setLatestScan(data);
        const lastScanDate = new Date(data.lastScanAt);
        const fourHoursInMs = 4 * 60 * 60 * 1000;
        const diff = Date.now() - lastScanDate.getTime();
        if (diff < fourHoursInMs) {
          setCooldown(Math.ceil((fourHoursInMs - diff) / 1000));
        } else {
          setCooldown(null);
        }
      } else {
        setCooldown(null);
      }
      setHistory(historyData || []);
      setLatestShowtime(showtimeData);
      setShowtimeHistory(showtimeHist || []);
    } catch (err) {
      console.error("Error loading visibility data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeFilm?.id) {
      loadVisibilityData();
    }
  }, [activeFilm?.id]);

  useEffect(() => {
    if (cooldown !== null && cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown(prev => (prev && prev > 0) ? prev - 1 : null);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleDeepScan = async (isAuto = false) => {
    if (!activeFilm || (cooldown !== null && !isAuto)) return;

    try {
      if (isAuto) setIsAutoScanning(true);
      else setLoading(true);
      
      setError(null);
      
      // 1. Firecrawl Deep Research + benchmarks + AudienceDNA in parallel.
      const [crawlContextResult, benchmark, audienceDNA] = await Promise.all([
        (async () => {
          try {
            const searchQuery = `performa film "${activeFilm.title}" buzz media sosial indonesia tiktok instagram 2025`;
            return await firecrawlService.searchAndScrape(searchQuery, 4);
          } catch (err) {
            console.warn("Firecrawl search failed, proceeding with standard scan", err);
            return "";
          }
        })(),
        dbService.getLatestBoxPredict(activeFilm.id),
        dbService.getLatestAudienceDNA(activeFilm.id)
      ]);

      if (!audienceDNA?.mediaUniverse?.length) {
        console.warn("No mediaUniverse found in AudienceDNA — visibility scan will fall back to AI-estimated mediaHits. Re-run AudienceDNA to populate media universe.");
      }

      // 2. Perform Gemini Scan with real data sources + grounded context.
      // 3. In parallel, fetch showtime snapshot (default mode = Jakarta only, 1 Firecrawl call).
      const releaseYear = activeFilm.releaseDate
        ? new Date(activeFilm.releaseDate).getFullYear()
        : new Date().getFullYear();

      const [result, showtimeResp] = await Promise.all([
        performVisibilityScan(
          activeFilm as any,
          benchmark || undefined,
          audienceDNA || undefined,
          crawlContextResult
        ),
        apiClient.post<any>('/api/showtimes', {
          title: activeFilm.title,
          releaseYear,
          releaseDate: activeFilm.releaseDate,
          sourceUrl: activeFilm.showtimeUrl,
          mode: 'default'
        }).catch(err => {
          console.warn("Showtime fetch failed:", err);
          return null;
        })
      ]);

      await dbService.saveVisibilityScan(activeFilm.id, result);

      if (showtimeResp && !showtimeResp.error) {
        await dbService.saveShowtimeSnapshot(activeFilm.id, showtimeResp);
        const [refreshedShowtime, refreshedHistory] = await Promise.all([
          dbService.getLatestShowtimeSnapshot(activeFilm.id),
          dbService.getShowtimeHistory(activeFilm.id, 30)
        ]);
        setLatestShowtime(refreshedShowtime);
        setShowtimeHistory(refreshedHistory || []);
      }

      setLatestScan(result);
      setHistory(prev => [result, ...prev]);
      setCooldown(4 * 3600);
    } catch (err: any) {
      if (!isAuto) setError(err.message || "Failed to perform visibility scan.");
      console.error("Scan Error:", err);
    } finally {
      setLoading(false);
      setIsAutoScanning(false);
    }
  };

  const handleDeepCityScan = async () => {
    if (!activeFilm) return;
    setIsDeepCityScanning(true);
    setError(null);
    try {
      const releaseYear = activeFilm.releaseDate
        ? new Date(activeFilm.releaseDate).getFullYear()
        : new Date().getFullYear();
      const showtimeResp = await apiClient.post<any>('/api/showtimes', {
        title: activeFilm.title,
        releaseYear,
        releaseDate: activeFilm.releaseDate,
        sourceUrl: activeFilm.showtimeUrl,
        mode: 'deep'
      });
      if (showtimeResp && !showtimeResp.error) {
        await dbService.saveShowtimeSnapshot(activeFilm.id, showtimeResp);
        const [refreshedShowtime, refreshedHistory] = await Promise.all([
          dbService.getLatestShowtimeSnapshot(activeFilm.id),
          dbService.getShowtimeHistory(activeFilm.id, 30)
        ]);
        setLatestShowtime(refreshedShowtime);
        setShowtimeHistory(refreshedHistory || []);
      } else {
        setError(showtimeResp?.error || "Deep city scan returned no data.");
      }
    } catch (err: any) {
      setError(err.message || "Deep city scan failed.");
    } finally {
      setIsDeepCityScanning(false);
    }
  };

  const handleBackfill = async () => {
    if (!activeFilm?.id) return;
    setIsBackfilling(true);
    try {
      await dbService.backfillGarudaData(activeFilm.id);
      await loadVisibilityData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError("Backfill failed: " + errorMsg);
      throw err;
    } finally {
      setIsBackfilling(false);
    }
  };

  return {
    loading,
    error,
    setError,
    latestScan,
    history,
    cooldown,
    isAutoScanning,
    isBackfilling,
    latestShowtime,
    showtimeHistory,
    isDeepCityScanning,
    handleDeepScan,
    handleBackfill,
    handleDeepCityScan,
    loadVisibilityData
  };
}
