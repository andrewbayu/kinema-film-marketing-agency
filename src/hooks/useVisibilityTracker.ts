import { useState, useEffect } from 'react';
import { VisibilityTrackerResult, Film } from '../lib/types';
import { dbService } from '../services/dbService';
import { performVisibilityScan } from '../lib/gemini';
import { firecrawlService } from '../services/firecrawlService';

export function useVisibilityTracker(activeFilm: Film | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestScan, setLatestScan] = useState<VisibilityTrackerResult | null>(null);
  const [history, setHistory] = useState<VisibilityTrackerResult[]>([]);
  const [cooldown, setCooldown] = useState<number | null>(null);
  const [isAutoScanning, setIsAutoScanning] = useState(false);
  const [isBackfilling, setIsBackfilling] = useState(false);

  const loadVisibilityData = async () => {
    if (!activeFilm?.id) return;
    try {
      setLoading(true);
      const data = await dbService.getLatestVisibilityScan(activeFilm.id);
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
      
      const historyData = await dbService.getVisibilityHistory(activeFilm.id);
      setHistory(historyData || []);
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
      
      // 1. Firecrawl Deep Research (Gather contextual data)
      let crawlContext = "";
      try {
        const searchQuery = `performa film "${activeFilm.title}" buzz media sosial indonesia tiktok instagram 2025`;
        crawlContext = await firecrawlService.searchAndScrape(searchQuery, 4);
      } catch (err) {
        console.warn("Firecrawl search failed, proceeding with standard scan", err);
      }

      // 2. Box Base benchmark
      const benchmark = await dbService.getLatestBoxPredict(activeFilm.id);
      
      // 3. Perform Gemini Scan with context + search grounding
      const result = await performVisibilityScan(activeFilm as any, benchmark || undefined, crawlContext);
      await dbService.saveVisibilityScan(activeFilm.id, result);
      
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
    handleDeepScan,
    handleBackfill,
    loadVisibilityData
  };
}
