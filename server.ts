import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";
import FirecrawlApp from '@mendable/firecrawl-js';
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for JSON parsing
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

// Gemini Endpoints
app.post("/api/gemini/generate", async (req, res) => {
  const { prompt, config } = req.body;
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Gemini API key not configured" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    const generationConfig = {
      ...config,
      // Ensure responseMimeType is passed if provided
      responseMimeType: (config as any)?.responseMimeType || 'text/plain',
    };

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
      tools: config.tools || [],
      toolConfig: config.toolConfig || undefined
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
