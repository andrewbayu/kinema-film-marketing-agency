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
