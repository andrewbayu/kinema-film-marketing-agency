import express from "express";
import path from "path";
import cors from "cors";
import { createRequire } from "module";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";
import FirecrawlApp from '@mendable/firecrawl-js';
import dotenv from "dotenv";

dotenv.config();

const require = createRequire(import.meta.url);
const googleTrends: any = require('google-trends-api');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// --- AI Services Initialization ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || ''
});

// --- API ROUTES ---

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Firecrawl Endpoints
app.post("/api/firecrawl/search", async (req, res) => {
  const { query, limit = 5 } = req.body;
  if (!process.env.FIRECRAWL_API_KEY) {
    return res.status(500).json({ error: "Firecrawl API key not configured" });
  }

  try {
    const searchResponse = await firecrawl.search(query, {
      limit,
      scrapeOptions: {
        formats: ['markdown'],
      }
    });

    const results = (searchResponse as any).data || (searchResponse as any).success_data || (searchResponse as any);
    
    // Firecrawl v1+ results are usually under 'data'
    const finalResults = Array.isArray(results) ? results : (results.data || []);
    
    if (!Array.isArray(finalResults)) {
       console.error("Unexpected Firecrawl search response structure:", searchResponse);
       return res.status(500).json({ error: "Invalid response structure from Firecrawl" });
    }

    const aggregatedMarkdown = finalResults
      .map((item: any) => `### Source: ${item.title || item.url}\nURL: ${item.url}\n\n${item.markdown || item.content || ""}\n\n---`)
      .join('\n\n');

    res.json({ markdown: aggregatedMarkdown });
  } catch (error: any) {
    console.error("Firecrawl Search API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/firecrawl/scrape", async (req, res) => {
  const { url } = req.body;
  if (!process.env.FIRECRAWL_API_KEY) {
    return res.status(500).json({ error: "Firecrawl API key not configured" });
  }

  try {
    const scrapeResponse = await firecrawl.scrape(url, {
      formats: ['markdown']
    });

    if (!(scrapeResponse as any).success && (scrapeResponse as any).error) {
      throw new Error((scrapeResponse as any).error);
    }

    const markdown = (scrapeResponse as any).markdown || (scrapeResponse as any).data?.markdown || "";
    res.json({ markdown });
  } catch (error: any) {
    console.error("Firecrawl Scrape API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Firecrawl site-specific search across a media universe.
// Used by visibility scan to count real article mentions per outlet.
app.post("/api/firecrawl/site-search", async (req, res) => {
  const { title, sources } = req.body || {};
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: "Missing 'title' (string)" });
  }
  if (!Array.isArray(sources)) {
    return res.status(400).json({ error: "Missing 'sources' (array)" });
  }
  if (!process.env.FIRECRAWL_API_KEY) {
    return res.status(500).json({ error: "Firecrawl API key not configured" });
  }

  const extractDomain = (url: string): string | null => {
    try {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`);
      return u.hostname.replace(/^www\./, '');
    } catch {
      return null;
    }
  };

  const webSources = sources.filter((s: any) =>
    s && (s.platform === 'web' || !s.platform) && typeof s.url === 'string'
  );
  const skipped = sources.filter((s: any) => !webSources.includes(s));

  const queries = webSources.map((s: any) => {
    const domain = extractDomain(s.url);
    return { source: s, domain, query: domain ? `site:${domain} "${title}"` : null };
  }).filter((q: any) => q.query !== null);

  const results = await Promise.all(queries.map(async ({ source, domain, query }: any) => {
    try {
      const resp: any = await firecrawl.search(query!, {
        limit: 5,
        scrapeOptions: { formats: [] } // only need URLs, not content
      });
      const data = resp?.data || resp?.success_data || resp || [];
      const items = Array.isArray(data) ? data : (data.data || []);
      return {
        name: source.name,
        domain,
        type: source.type,
        hits: items.length,
        items: items.slice(0, 3).map((it: any) => ({
          title: it.title || '',
          url: it.url || '',
          snippet: (it.description || it.markdown || '').slice(0, 200)
        }))
      };
    } catch (err: any) {
      return {
        name: source.name,
        domain,
        type: source.type,
        hits: 0,
        items: [],
        error: err?.message || String(err)
      };
    }
  }));

  const totalHits = results.reduce((sum, r) => sum + (r.hits || 0), 0);
  res.json({
    totalHits,
    perSource: results,
    skipped: skipped.map((s: any) => ({ name: s.name, reason: 'non-web platform' }))
  });
});

// Google Trends Endpoint (real searchVolume signal — anonymous, no key)
app.post("/api/trends", async (req, res) => {
  const { keyword, geo = 'ID', timeframe = 'now 7-d' } = req.body || {};
  if (!keyword || typeof keyword !== 'string') {
    return res.status(400).json({ error: "Missing 'keyword' (string)" });
  }

  // Map our timeframe strings to startTime Dates accepted by google-trends-api
  const now = Date.now();
  const startTime = (() => {
    switch (timeframe) {
      case 'now 1-d': return new Date(now - 24 * 60 * 60 * 1000);
      case 'now 7-d': return new Date(now - 7 * 24 * 60 * 60 * 1000);
      case 'today 1-m': return new Date(now - 30 * 24 * 60 * 60 * 1000);
      case 'today 3-m': return new Date(now - 90 * 24 * 60 * 60 * 1000);
      default: return new Date(now - 7 * 24 * 60 * 60 * 1000);
    }
  })();

  try {
    const raw: string = await googleTrends.interestOverTime({ keyword, geo, startTime });
    const parsed = JSON.parse(raw);
    const timeline: Array<{ time: string; value: number[] }> =
      parsed?.default?.timelineData || [];

    if (timeline.length === 0) {
      return res.json({
        interestScore: 0,
        avgScore: 0,
        peakScore: 0,
        peakDate: null,
        dataPoints: 0,
        note: "No trends data returned (low search volume or new keyword)"
      });
    }

    const values = timeline.map(t => (Array.isArray(t.value) ? t.value[0] : 0));
    const latest = values[values.length - 1] || 0;
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const peakIdx = values.indexOf(Math.max(...values));
    const peakDate = timeline[peakIdx]
      ? new Date(parseInt(timeline[peakIdx].time, 10) * 1000).toISOString()
      : null;

    res.json({
      interestScore: latest,
      avgScore: avg,
      peakScore: values[peakIdx] || 0,
      peakDate,
      dataPoints: values.length,
      timeline: timeline.map(t => ({
        date: new Date(parseInt(t.time, 10) * 1000).toISOString(),
        value: Array.isArray(t.value) ? t.value[0] : 0
      }))
    });
  } catch (error: any) {
    console.error("Google Trends API Error:", error?.message || error);
    res.status(503).json({
      error: "Google Trends temporarily unavailable",
      detail: error?.message || String(error)
    });
  }
});

// ===================== Showtime Allocation =====================
// Scrapes jadwalnonton.com for cinema/showtime data per campaign.

const TIER_1_CITIES = ['jakarta', 'bandung', 'surabaya', 'medan', 'yogyakarta', 'bali', 'semarang'];
const TIER_2_CITIES = ['makassar', 'palembang', 'pekanbaru', 'malang', 'denpasar', 'balikpapan'];

function slugifyTitle(title: string): string {
  return title.toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function detectChain(cinemaName: string): string {
  const name = cinemaName.toUpperCase();
  if (name.includes('XXI') || name.includes('CINEPLEX 21') || name.includes('IMAX 21')) return 'XXI';
  if (name.includes('CGV')) return 'CGV';
  if (name.includes('CINEPOLIS')) return 'Cinepolis';
  if (name.includes('FLIX')) return 'FLIX';
  if (name.includes('PLATINUM')) return 'Platinum';
  if (name.includes('NEW STAR')) return 'New Star';
  return 'Other';
}

function detectTier(format: string): 'regular' | 'premium' | 'imax' | 'other' {
  const f = format.toUpperCase();
  if (f.includes('IMAX')) return 'imax';
  if (f.match(/REGULAR|2D(?!\s*(SATIN|VELVET|PREMIERE))/)) return 'regular';
  if (f.match(/SATIN|VELVET|PREMIERE|SILVER|LUXE|GOLD|PLATINUM|DELUXE|4DX|SCREENX/)) return 'premium';
  return 'other';
}

function detectCityTier(city: string): 'tier1' | 'tier2' | 'tier3' {
  const c = city.toLowerCase();
  if (TIER_1_CITIES.some(t => c.includes(t))) return 'tier1';
  if (TIER_2_CITIES.some(t => c.includes(t))) return 'tier2';
  return 'tier3';
}

async function scrapeShowtimePage(url: string): Promise<string> {
  try {
    const resp: any = await firecrawl.scrape(url, { formats: ['markdown'] });
    return resp?.markdown || resp?.data?.markdown || '';
  } catch (err: any) {
    console.warn(`Firecrawl scrape failed for ${url}:`, err?.message || err);
    return '';
  }
}

async function parseShowtimesWithGemini(markdowns: Array<{ city: string; content: string }>, title: string): Promise<any[]> {
  if (markdowns.every(m => !m.content)) return [];

  const combinedContent = markdowns
    .filter(m => m.content)
    .map(m => `=== CITY: ${m.city} ===\n${m.content.slice(0, 30000)}\n=== END ${m.city} ===`)
    .join('\n\n');

  const prompt = `
Kamu adalah parser data jadwal bioskop dari jadwalnonton.com untuk film "${title}".

Tugas: Ekstrak SETIAP entri "cinema + format + showtimes" dari konten markdown di bawah menjadi JSON array.

ATURAN:
- Satu cinema bisa punya MULTIPLE format (Regular 2D, IMAX, Satin, Velvet, dll) — tiap format = 1 entry terpisah
- Showtimes adalah array string format "HH:MM" (24-jam)
- Price: integer rupiah, tanpa "Rp" atau titik (contoh: 30000, bukan "Rp 30.000")
- Date: gunakan tanggal yang aktif di tab tanggal pada section tersebut. Format ISO YYYY-MM-DD. Kalau tidak terbaca, pakai tanggal hari ini.
- City: ambil dari header section "=== CITY: ... ===" atau dari konten cinema (Jakarta, Bandung, dll)
- Skip entry yang tidak punya showtimes konkret.
- JANGAN buat data fiktif. Kalau tidak ada showtimes untuk film ini di satu kota, skip kota itu.

Output: JSON array MURNI (tanpa markdown code fence), schema:
[
  {
    "cinema": "string (nama bioskop, e.g. 'GRAND PARAGON XXI')",
    "city": "string (kota)",
    "format": "string (e.g. 'Regular 2D', 'IMAX', 'SILVER Class')",
    "price": number,
    "showtimes": ["HH:MM", ...],
    "date": "YYYY-MM-DD"
  }
]

KONTEN:
${combinedContent}
`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });
    const text = (await result.response).text();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err: any) {
    console.error("Showtime parsing failed:", err?.message || err);
    return [];
  }
}

function aggregateShows(shows: any[]) {
  const normalized = shows.map(s => ({
    cinema: String(s.cinema || '').trim(),
    city: String(s.city || '').trim(),
    chain: detectChain(s.cinema || ''),
    format: String(s.format || '').trim(),
    tier: detectTier(s.format || ''),
    price: Number(s.price) || 0,
    showtimes: Array.isArray(s.showtimes) ? s.showtimes : [],
    date: String(s.date || new Date().toISOString().slice(0, 10))
  })).filter(s => s.cinema && s.showtimes.length > 0);

  const totalShows = normalized.reduce((sum, s) => sum + s.showtimes.length, 0);
  const uniqueCinemas = new Set(normalized.map(s => `${s.cinema}|${s.city}`));
  const uniqueCities = new Set(normalized.map(s => s.city));
  const uniqueChains = new Set(normalized.map(s => s.chain));

  // byCity
  const cityMap = new Map<string, number>();
  normalized.forEach(s => {
    cityMap.set(s.city, (cityMap.get(s.city) || 0) + s.showtimes.length);
  });
  const byCity = Array.from(cityMap.entries())
    .map(([city, count]) => ({ city, count, tier: detectCityTier(city) }))
    .sort((a, b) => b.count - a.count);

  // byChain
  const chainMap = new Map<string, number>();
  normalized.forEach(s => {
    chainMap.set(s.chain, (chainMap.get(s.chain) || 0) + s.showtimes.length);
  });
  const byChain = Array.from(chainMap.entries())
    .map(([chain, count]) => ({ chain, count }))
    .sort((a, b) => b.count - a.count);

  // byFormat
  const formatMap = new Map<string, number>();
  normalized.forEach(s => {
    formatMap.set(s.format, (formatMap.get(s.format) || 0) + s.showtimes.length);
  });
  const byFormat = Array.from(formatMap.entries())
    .map(([format, count]) => ({ format, count }))
    .sort((a, b) => b.count - a.count);

  // byTier
  const byTier = { regular: 0, premium: 0, imax: 0, other: 0 };
  normalized.forEach(s => {
    byTier[s.tier] += s.showtimes.length;
  });

  return {
    totalShows,
    totalCinemas: uniqueCinemas.size,
    totalCities: uniqueCities.size,
    totalChains: uniqueChains.size,
    byCity,
    byChain,
    byFormat,
    byTier,
    shows: normalized
  };
}

app.post("/api/showtimes", async (req, res) => {
  const { title, releaseYear, mode = 'default', cities, releaseDate } = req.body || {};
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: "Missing 'title' (string)" });
  }
  if (!process.env.FIRECRAWL_API_KEY) {
    return res.status(500).json({ error: "Firecrawl API key not configured" });
  }

  const year = releaseYear || new Date().getFullYear();
  const slug = slugifyTitle(title);
  const baseUrl = `https://jadwalnonton.com/film/${year}/${slug}/`;

  // Build URLs to scrape
  const scrapeCities: string[] = mode === 'deep'
    ? (cities && Array.isArray(cities) && cities.length > 0 ? cities : TIER_1_CITIES)
    : ['jakarta']; // default = jakarta-only via main URL

  const urls = mode === 'deep'
    ? scrapeCities.map(c => `${baseUrl}di-${c.toLowerCase()}/`)
    : [baseUrl];

  const markdowns = await Promise.all(
    urls.map(async (url, i) => ({
      city: mode === 'deep' ? scrapeCities[i] : 'jakarta',
      content: await scrapeShowtimePage(url)
    }))
  );

  const anyContent = markdowns.some(m => m.content && m.content.length > 500);
  if (!anyContent) {
    return res.json({
      filmUrl: baseUrl,
      scannedAt: new Date().toISOString(),
      scanMode: mode,
      totalShows: 0,
      totalCinemas: 0,
      totalCities: 0,
      totalChains: 0,
      byCity: [],
      byChain: [],
      byFormat: [],
      byTier: { regular: 0, premium: 0, imax: 0, other: 0 },
      shows: [],
      phase: computePhase(releaseDate),
      daysToRelease: computeDaysToRelease(releaseDate),
      error: "Film not listed on jadwalnonton.com yet, or URL slug mismatch."
    });
  }

  const parsedShows = await parseShowtimesWithGemini(markdowns, title);
  const aggregates = aggregateShows(parsedShows);

  res.json({
    filmUrl: baseUrl,
    scannedAt: new Date().toISOString(),
    scanMode: mode,
    ...aggregates,
    phase: computePhase(releaseDate),
    daysToRelease: computeDaysToRelease(releaseDate)
  });
});

function computeDaysToRelease(releaseDate?: string): number | null {
  if (!releaseDate) return null;
  const release = new Date(releaseDate);
  if (isNaN(release.getTime())) return null;
  return Math.ceil((release.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

function computePhase(releaseDate?: string): 'pre-release' | 'release-week' | 'post-release' {
  const days = computeDaysToRelease(releaseDate);
  if (days === null) return 'pre-release';
  if (days > 0) return 'pre-release';
  if (days >= -7) return 'release-week';
  return 'post-release';
}

// Gemini Endpoints
app.post("/api/gemini/generate", async (req, res) => {
  const { prompt, config } = req.body;
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Gemini API key not configured" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    
    const { tools, toolConfig, ...generationSettings } = config || {};
    
    const generationConfig = {
      ...generationSettings,
      // Ensure responseMimeType is passed if provided
      responseMimeType: generationSettings.responseMimeType || 'text/plain',
    };

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
      tools: tools || [],
      toolConfig: toolConfig || undefined
    });

    const response = await result.response;
    res.json({ text: response.text() });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- VITE MIDDLEWARE ---
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
