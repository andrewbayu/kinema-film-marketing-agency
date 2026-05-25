import {
  FilmProfileInput,
  AudienceDNAResult,
  BoxPredictInput,
  BoxPredictResult,
  FIBContent,
  CineForgeResult,
  CineForgeSource,
  VisibilityTrackerResult,
  MediaSource
} from './types';
import { KINEMA_SYSTEM_PROMPT, CINEFORGE_PROMPT } from './prompts';

import { apiClient } from '../services/apiClient';

// Helper for checking API Key - handled server side now
const skipClientCheck = true;

async function generateWithRetry(prompt: string, config: any, retries = 3): Promise<any> {
  const skip = skipClientCheck; // prevent unused var
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await apiClient.post('/api/gemini/generate', { prompt, config });
    } catch (err: any) {
      lastError = err;
      const errorMsg = err.message || '';
      const isTransient = errorMsg.includes('500') || errorMsg.includes('503') || errorMsg.includes('Deadline') || errorMsg.includes('UNAVAILABLE');
      
      if (!isTransient || i === retries - 1) throw err;
      
      console.warn(`Gemini API transient error (attempt ${i + 1}/${retries}). Retrying...`, err);
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 2000));
    }
  }
  throw lastError;
}

export async function runAudienceDNA(input: FilmProfileInput, context?: string): Promise<AudienceDNAResult> {
  const contextBlock = context ? `\nDATA KONTEKSTUAL (Crawled from Web):\n${context}\n` : '';
  const prompt = `
    ${KINEMA_SYSTEM_PROMPT}

    Kamu sedang menjalankan AudienceDNA™ untuk film berikut:

    JUDUL: ${input.title}
    GENRE: ${input.genre}
    LOGLINE: ${input.logline}
    LEAD CAST: ${input.leadCast}
    BUDGET TIER: ${input.budgetTier}
    IP TYPE: ${input.ipType}
    ${input.director ? `SUTRADARA: ${input.director}` : ''}
    ${contextBlock}

    Tugasmu:
    1. Identifikasi 3-4 segmen penonton Indonesia yang paling relevan.
    2. CARI TAHU tren terbaru di Indonesia (TikTok/IG/News) yang berkaitan dengan genre atau subjek film ini. Fokus pada kata kunci spesifik untuk efisiensi.
    3. Analisis landscape penonton dan prediksi resonance score.
    4. **MEDIA UNIVERSE** — Bangun daftar 12-15 sumber media spesifik yang dikonsumsi oleh segmen-segmen di atas. INI PENTING karena akan dipakai untuk tracking visibilitas film secara nyata (bukan estimasi). Sertakan campuran 4 tipe:
       - **mainstream**: portal berita hiburan besar (detik.com, kompas.com, tempo.co, cnnindonesia.com, liputan6.com, kapanlagi.com, dll) — pilih hanya yang BENAR-BENAR dibaca oleh segmen target.
       - **niche**: media spesialis genre/topik (mis. infoscreening.com untuk horror enthusiast, muvila.com untuk movie geeks, layar.id, cinemags.id).
       - **kol** (Key Opinion Leaders): akun creator/kritikus film individual (mis. @cine.crib, @ngomonginfilm, @filmschoolrejects.id) — tulis handle Instagram/TikTok lengkap.
       - **community** ("homeless media"): akun komunitas non-institusional yang spesifik ke segmen (mis. @horror.id, @movienthusiast, fandom grup, fanbase aktor, komunitas religius/olahraga yang relevan).
       Untuk SETIAP sumber, tentukan:
       - "platform": "web" | "instagram" | "tiktok" | "youtube" | "x" | "telegram"
       - "url": URL/handle lengkap (untuk web: domain only seperti "detik.com"; untuk social: full URL seperti "https://instagram.com/cine.crib")
       - "segment": nama segmen yang paling relevan (dari array "segments" di atas)
       - "rationale": 1 kalimat singkat kenapa sumber ini cocok dengan segmen tersebut

    Output harus dalam format JSON murni:
    {
      "segments": [
        {
          "name": "string",
          "ageRange": "string",
          "primaryPlatform": ["string"],
          "behavioralScores": {
            "skepticism": number,
            "identity": number,
            "anxiety": number,
            "knowledge": number
          },
          "pills": ["string"],
          "resonanceScore": number,
          "triggerMechanism": "string",
          "messagingApproach": "string",
          "platform": "string",
          "marketSaturation": number,
          "mediaHabits": ["string"]
        }
      ],
      "primarySegment": "string",
      "insight": "analisis 150-200 kata tentang landscape penonton film ini, termasuk tren eksternal yang kamu temukan. Berikan data yang realistis.",
      "interestCore": ["string"],
      "channelPriority": [
        { "channel": "string", "priority": "Tinggi" | "Sedang" | "Rendah", "reason": "string" }
      ],
      "mediaUniverse": [
        {
          "type": "mainstream" | "niche" | "kol" | "community",
          "name": "string (nama media/handle)",
          "url": "string (domain atau full handle URL)",
          "platform": "web" | "instagram" | "tiktok" | "youtube" | "x" | "telegram",
          "segment": "string (segment name dari array di atas)",
          "rationale": "string (kenapa sumber ini cocok)"
        }
      ]
    }
  `;

  try {
    const response = await generateWithRetry(
      prompt,
      {
        responseMimeType: 'application/json'
      }
    );

    const text = response.text || '';
    return JSON.parse(text) as AudienceDNAResult;
  } catch (error) {
    console.error("AudienceDNA AI Error:", error);
    throw error;
  }
}

export async function runBoxPredict(
  filmInput: FilmProfileInput,
  boxInput: BoxPredictInput,
  audienceResult: AudienceDNAResult,
  context?: string
): Promise<BoxPredictResult> {
  const contextBlock = context ? `\nDATA KONTEKSTUAL (Crawled from Web):\n${context}\n` : '';
  const prompt = `
    ${KINEMA_SYSTEM_PROMPT}

    Kamu sedang menjalankan BoxPredict™ Simulation.
    
    FILM: ${boxInput.title}
    GENRE: ${boxInput.genre}
    RELEASE DATE: ${boxInput.releaseDate}
    AUDIENCE: ${audienceResult.primarySegment}
    ${contextBlock}

    INSTRUKSI KHUSUS ANALISIS MARKET:
    1. CARI TAHU konteks tanggal ${boxInput.releaseDate} di Indonesia. Apakah itu hari biasa? Lebaran? Libur sekolah? Long weekend?
    2. CARI TAHU kompetisi film (Hollywood/Lokal) yang rilis dalam window 2 minggu di sekitar ${boxInput.releaseDate}.
    3. CARI TAHU performa box office film Indonesia dengan genre/skala serupa dalam 2 tahun terakhir untuk benchmarking.
    4. Justifikasi angka P25, P50, P75 berdasarkan temuan real-time dari pencarian tersebut.
    
    Hasilkan proyeksi box office 3 skenario (bear, base, bull) di pasar Indonesia dengan mempertimbangkan data historis dan faktor eksternal tersebut.
    
    PENTING: SEMUA ANGKA (admissions, revenue) HARUS INTEGER MURNI tanpa huruf M/K. 
    Contoh: 1500000 (untuk 1.5 Juta Admissions), bukan 1.5.

    Format JSON:
    {
      "scenarios": {
        "bear": { "admissions": number, "revenue": number, "label": "Pesimis (P25)", "confidence": "string" },
        "base": { "admissions": number, "revenue": number, "label": "Realistis (P50)", "confidence": "string" },
        "bull": { "admissions": number, "revenue": number, "label": "Optimis (P75)", "confidence": "string" }
      },
      "sensitivity": [{ "dimension": "string", "impact": number, "direction": "Positif" | "Negatif", "note": "string" }],
      "riskFlags": ["string"],
      "releaseWindowRecommendation": "string",
      "methodology": "Berikan penjelasan bagaimana faktor eksternal (hasil crawling) mempengaruhi angka ini",
      "weeklyDecayRate": "string (e.g. -45% for 2nd week)",
      "geographicalTargeting": ["string (Top 5 cities)"]
    }
  `;

  try {
    const response = await generateWithRetry(
      prompt,
      {
        responseMimeType: 'application/json'
      }
    );

    const text = response.text || '';
    return JSON.parse(text) as BoxPredictResult;
  } catch (error) {
    console.error("BoxPredict AI Error:", error);
    throw error;
  }
}

export async function generateFIB(
  filmInput: FilmProfileInput,
  audienceResult: AudienceDNAResult,
  boxResult: BoxPredictResult
): Promise<FIBContent> {
  const prompt = `
    ${KINEMA_SYSTEM_PROMPT}
    Tugas: Generate Film Intelligence Brief (FIB) Profesional.
    DATA: ${JSON.stringify({ filmInput, audienceResult, boxResult })}

    Format JSON:
    {
      "executiveSummary": "string (150-200 kata)",
      "audienceAnalysis": "string (200-250 kata)",
      "boxOfficeAnalysis": "string (150-200 kata)",
      "releaseWindowAnalysis": "string",
      "keyRisks": ["string"],
      "nextSteps": ["string"],
      "methodologyNote": "string",
      "marketingMix": [
        { "channel": "string", "allocation": number, "objective": "string" }
      ],
      "usp": "string (Unique Selling Point/Key hook)"
    }
  `;

  try {
    const response = await generateWithRetry(
      prompt,
      {
        responseMimeType: 'application/json'
      }
    );
    
    const text = response.text || '';
    return JSON.parse(text) as FIBContent;
  } catch (error) {
    console.error("FIB Generation AI Error:", error);
    throw error;
  }
}

export async function generateCineForgeContent(
  filmInput: FilmProfileInput,
  audienceResult: AudienceDNAResult,
  contentCount: number,
  dataset: CineForgeSource[],
  useLiveTrends?: boolean
): Promise<CineForgeResult> {
  const datasetContext = dataset.length > 0 
    ? `DATASET / SOURCE MATERIALS:\n${dataset.map(d => `- [${d.type}] ${d.value} (${d.label || ''})`).join('\n')}`
    : "No additional dataset provided.";

  const prompt = `
    ${KINEMA_SYSTEM_PROMPT}
    ${CINEFORGE_PROMPT}

    Kamu sedang menjalankan CineForge™ untuk film:
    JUDUL: ${filmInput.title}
    GENRE: ${filmInput.genre}
    LEAD: ${filmInput.leadCast}
    SUTRADARA: ${filmInput.director || 'N/A'}

    DATA AUDIENCEDNA:
    ${JSON.stringify(audienceResult.segments)}

    ${datasetContext}

    ${useLiveTrends ? "LIVE TREND AWARENESS ENABLED: Cari tren viral terbaru di Indonesia, berita hiburan terkini, dan event yang sedang hangat hari ini untuk menghubungkan materi film dengan zeitgeist saat ini." : ""}

    JUMLAH KONTEN YANG DIMINTA: ${contentCount}

    Tugas: Hasilkan ${contentCount} ide konten kreatif. 
    WAJIB: Jika ada dataset (URL/Video/Artikel), gunakan informasi dari dataset tersebut sebagai dasar materi konten (misal: quote dari artikel, momen dari video, atau visual dari asset).
    ${useLiveTrends ? "INTEGRASI TREN: Pastikan setidaknya 2-3 konten memiliki kaitan langsung dengan tren atau event yang sedang berlangsung minggu ini/hari ini." : ""}

    Format JSON:
    {
      "sessionTitle": "string (Nama campaign session)",
      "generatedDate": "string (format ISO)",
      "campaignGoal": "string (Tujuan utama campaign)",
      "sourceReference": "string (Penjelasan singkat bagaimana dataset/source digunakan)",
      "contents": [
        {
          "id": "string (unique id)",
          "title": "string",
          "type": "Video" | "Graphic" | "Copy" | "Hybrid",
          "targetSegment": "string (nama segment dari data AudienceDNA)",
          "resonanceScore": number,
          "distributionChannel": "Lead Actor" | "Supporting Cast" | "Homeless Media" | "Paid Ads" | "Official Account" | "WA Blast",
          "contentHook": "string (apa yang terjadi di 3 detik pertama)",
          "visualDirection": "string (moodbox deskripsi visual)",
          "captionTemplate": "string (template caption sosial media)",
          "cta": "string (Call to action)"
        }
      ]
    }
  `;

  try {
    const response = await generateWithRetry(
      prompt,
      {
        responseMimeType: 'application/json'
      }
    );

    const text = response.text || '';
    return JSON.parse(text) as CineForgeResult;
  } catch (error) {
    console.error("CineForge Generation AI Error:", error);
    throw error;
  }
}

// Real-data helpers used by performVisibilityScan.

interface TrendsResponse {
  interestScore: number;
  avgScore: number;
  peakScore: number;
  peakDate: string | null;
  dataPoints: number;
  note?: string;
}

interface SiteSearchResponse {
  totalHits: number;
  perSource: Array<{
    name: string;
    domain: string | null;
    type: string;
    hits: number;
    items: Array<{ title: string; url: string; snippet: string }>;
    error?: string;
  }>;
  skipped: Array<{ name: string; reason: string }>;
}

async function fetchTrends(keyword: string): Promise<TrendsResponse | null> {
  try {
    return await apiClient.post<TrendsResponse>('/api/trends', {
      keyword,
      geo: 'ID',
      timeframe: 'now 7-d'
    });
  } catch (err) {
    console.warn(`Google Trends fetch failed for "${keyword}":`, err);
    return null;
  }
}

async function fetchSiteSearch(title: string, sources: MediaSource[]): Promise<SiteSearchResponse | null> {
  if (sources.length === 0) return null;
  try {
    return await apiClient.post<SiteSearchResponse>('/api/firecrawl/site-search', { title, sources });
  } catch (err) {
    console.warn("Firecrawl site-search failed:", err);
    return null;
  }
}

function calculateTrajectory(releaseDate: string | undefined, currentDate: Date) {
  if (!releaseDate) {
    return { daysToH7: 0, targetPeakDate: currentDate.toISOString() };
  }
  const release = new Date(releaseDate);
  const targetPeak = new Date(release.getTime() - 7 * 24 * 60 * 60 * 1000);
  const daysToH7 = Math.max(0, Math.ceil((targetPeak.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000)));
  return { daysToH7, targetPeakDate: targetPeak.toISOString() };
}

function normalizeSentiment(s: { positive?: number; neutral?: number; negative?: number } | undefined) {
  const pos = Math.max(0, s?.positive || 0);
  const neu = Math.max(0, s?.neutral || 0);
  const neg = Math.max(0, s?.negative || 0);
  const sum = pos + neu + neg;
  if (sum === 0) return { positive: 60, neutral: 30, negative: 10 };
  return {
    positive: Math.round((pos / sum) * 100),
    neutral: Math.round((neu / sum) * 100),
    negative: Math.round((neg / sum) * 100)
  };
}

export async function performVisibilityScan(
  filmInput: FilmProfileInput,
  boxPredictResult?: BoxPredictResult,
  audienceDNA?: AudienceDNAResult,
  context?: string
): Promise<VisibilityTrackerResult> {
  const currentDate = new Date();
  const currentDateIso = currentDate.toISOString();
  const contextBlock = context ? `\nDATA KONTEKSTUAL TERBARU (Firecrawl Deep Scan):\n${context}\n` : '';

  const mediaUniverse: MediaSource[] = audienceDNA?.mediaUniverse || [];
  const webSources = mediaUniverse.filter(s => s.platform === 'web' && !!s.url);
  const socialSources = mediaUniverse.filter(s => s.platform !== 'web');

  // -----------------------------------------------------------------
  // STEP 1: Fetch REAL data in parallel.
  // -----------------------------------------------------------------
  const [titleTrends, castTrends, siteSearch] = await Promise.all([
    fetchTrends(filmInput.title),
    filmInput.leadCast ? fetchTrends(filmInput.leadCast.split(',')[0].trim()) : Promise.resolve(null),
    fetchSiteSearch(filmInput.title, webSources)
  ]);

  const realSearchVolume = titleTrends?.interestScore ?? null;
  const realMediaHits = siteSearch?.totalHits ?? null;

  // Block for prompt: tell Gemini what's already grounded vs what needs estimating.
  const realDataBlock = `
    DATA TERVERIFIKASI (gunakan angka ini sebagai authoritative, JANGAN ubah):
    ${realSearchVolume !== null
      ? `- Search Volume (Google Trends ID, 7 hari): ${realSearchVolume}/100 (avg ${titleTrends?.avgScore}, peak ${titleTrends?.peakScore})`
      : `- Search Volume: data Google Trends tidak tersedia, beri estimasi konservatif`}
    ${castTrends ? `- Lead cast trend score: ${castTrends.interestScore}/100` : ''}
    ${realMediaHits !== null
      ? `- Media Hits (Firecrawl site search ${siteSearch!.perSource.length} sumber): ${realMediaHits} artikel terdeteksi.\n    Breakdown per sumber:\n    ${siteSearch!.perSource.map(s => `      • ${s.name} (${s.domain}): ${s.hits} hits`).join('\n')}`
      : `- Media Hits: site-search tidak tersedia (mediaUniverse belum di-set di AudienceDNA), beri estimasi konservatif`}
  `;

  const socialKolBlock = socialSources.length > 0
    ? `\nKOL & HOMELESS MEDIA (untuk estimasi socialBuzz — cek apakah handle berikut pernah membahas film, kalau tahu):\n${socialSources.map(s => `    • ${s.name} (${s.platform}) — ${s.rationale}`).join('\n')}`
    : '';

  const benchmarkConstraint = boxPredictResult
    ? `PENTING: Target P50 Admissions = ${boxPredictResult.scenarios.base.admissions}. Pakai persis angka ini.`
    : `PENTING: Hitung estimasi admissions P50 yang realistis untuk pasar Indonesia berdasarkan genre, cast, dan budget tier film ini.`;

  // -----------------------------------------------------------------
  // PASS 1: Grounding pass — use Google Search for sentiment, narrative,
  // competitive context. Numeric metrics now come from STEP 1.
  // -----------------------------------------------------------------
  const groundingPrompt = `
    ${KINEMA_SYSTEM_PROMPT}

    Riset real-time untuk film berikut. Pakai Google Search Grounding agresif.

    JUDUL: ${filmInput.title}
    GENRE: ${filmInput.genre}
    LEAD: ${filmInput.leadCast}
    RELEASE DATE: ${filmInput.releaseDate}
    TODAY'S DATE: ${currentDateIso}
    ${contextBlock}

    Cari dan rangkum dalam markdown (FOKUS pada signal kualitatif — angka kuantitatif sudah di-handle sistem):
    1. Sentimen publik terbaru — kutipan komentar / headline kalau menemukan.
    2. Tren / hashtag yang dipakai untuk membahas film ini di TikTok / Instagram / X.
    3. Kompetitor genre serupa yang sedang dibahas — untuk benchmarking Share of Voice.
    4. Insight kualitatif lain (kontroversi, viral moments, KOL buzz, dll).

    PENTING: Jangan mengarang angka spesifik. Fokus pada deskripsi naratif + headline rill.
    Output: ringkasan markdown 200-400 kata. Bukan JSON.
  `;

  let groundedResearch = "";
  let groundingFailed = false;
  try {
    const grounding = await generateWithRetry(
      groundingPrompt,
      {
        tools: [{ googleSearch: {} }],
        toolConfig: { includeServerSideToolInvocations: true }
      }
    );
    groundedResearch = grounding.text || "";
  } catch (err) {
    console.warn("Visibility scan grounding pass failed; continuing with Firecrawl context only", err);
    groundingFailed = true;
  }

  // -----------------------------------------------------------------
  // PASS 2: Structuring pass — combine real data + grounded narrative
  // into the VisibilityTrackerResult JSON schema.
  // -----------------------------------------------------------------
  const prompt = `
    ${KINEMA_SYSTEM_PROMPT}

    Kamu menjalankan DEEP SCAN Visibility Tracker untuk:
    JUDUL: ${filmInput.title}
    GENRE: ${filmInput.genre}
    LEAD: ${filmInput.leadCast}
    RELEASE DATE: ${filmInput.releaseDate}
    TODAY: ${currentDateIso}

    ${benchmarkConstraint}

    ${realDataBlock}
    ${socialKolBlock}

    NARASI REAL-TIME (Pass 1${groundingFailed ? ' — FAILED, gunakan context Firecrawl saja' : ''}):
    ${groundedResearch || "(tidak tersedia — andalkan Firecrawl context)"}

    ${contextBlock}

    Konversi temuan di atas menjadi struktur data VALID:
    1. metrics.searchVolume = ${realSearchVolume !== null ? `${realSearchVolume} (PERSIS angka ini)` : 'estimasi 0-100'}
    2. metrics.socialBuzz = estimasi 0-100 berdasarkan KOL/homeless media list di atas + narasi Pass 1. INI MASIH ESTIMASI AI — labeled sebagai 'AI estimate' di UI.
    3. metrics.mediaHits = ${realMediaHits !== null ? `${realMediaHits} (PERSIS angka ini)` : 'estimasi konservatif'}
    4. metrics.shareOfVoice = estimasi 0-100 vs kompetitor genre serupa.
    5. sentiment.positive/neutral/negative — angka 0-100. HARUS sum ke ~100 (sistem akan normalize, tapi usahakan dekat).
    6. trajectory.currentVelocity = estimasi pertumbuhan awareness harian (1-30% NORMAL, jangan pernah > 100%).
    7. funnel.currentAwareness = estimasi reach kumulatif saat ini berdasarkan: searchVolume score × benchmark scaling + mediaHits coverage + buzz qualitative.
    8. funnel.conversionRates — awareness→interest, interest→intent, intent→ticket (estimasi 0-100%).
    9. evidencePoints — WAJIB tulis 3-6 poin nyata. Boleh ambil dari narasi Pass 1 ATAU dari mediaHits breakdown di atas (sebutkan nama sumber + headline kalau ada).

    JANGAN hitung daysToH7, targetPeakDate, requiredAwareness, gapToP50 — sistem akan post-process.

    Format JSON:
    {
      "visibilityScore": number,
      "metrics": {
        "searchVolume": number,
        "socialBuzz": number,
        "mediaHits": number,
        "shareOfVoice": number
      },
      "sentiment": {
        "positive": number,
        "neutral": number,
        "negative": number
      },
      "trends": ["string"],
      "lastScanAt": "${currentDateIso}",
      "topGeographies": ["string"],
      "platformPerformance": [
        { "platform": "string", "buzzLevel": number, "sentiment": "Positive" | "Neutral" | "Negative", "topContent": "string" }
      ],
      "summary": "string",
      "strategicAdvice": "string",
      "benchmarkContext": "string",
      "trajectory": {
        "requiredDailyGrowth": number,
        "currentVelocity": number,
        "status": "on-track" | "at-risk" | "critical"
      },
      "funnel": {
        "p50Target": number,
        "currentAwareness": number,
        "conversionRates": {
          "awarenessToInterest": number,
          "interestToIntent": number,
          "intentToTicket": number
        }
      },
      "evidencePoints": [
        { "source": "string", "dataPoint": "string", "timestamp": "string" }
      ]
    }
  `;

  let aiResult: any;
  try {
    const response = await generateWithRetry(prompt, { responseMimeType: 'application/json' });
    aiResult = JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Visibility Scan AI Error:", error);
    throw error;
  }

  // -----------------------------------------------------------------
  // STEP 3: Post-process — override AI fields with deterministic values
  // where we have real data, and compute geometry in JS not LLM.
  // -----------------------------------------------------------------
  const p50Target = boxPredictResult?.scenarios.base.admissions || aiResult?.funnel?.p50Target || 0;
  const requiredAwareness = p50Target * 15; // 15x rule
  const currentAwareness = Math.max(0, Math.round(aiResult?.funnel?.currentAwareness || 0));
  const gapToP50 = requiredAwareness > 0
    ? Math.max(0, Math.round(((requiredAwareness - currentAwareness) / requiredAwareness) * 100))
    : 0;

  const { daysToH7, targetPeakDate } = calculateTrajectory(filmInput.releaseDate, currentDate);
  const requiredDailyGrowth = daysToH7 > 0 && currentAwareness > 0
    ? Math.min(100, Math.round((Math.pow(requiredAwareness / Math.max(1, currentAwareness), 1 / daysToH7) - 1) * 100))
    : aiResult?.trajectory?.requiredDailyGrowth || 15;

  const rawVelocity = aiResult?.trajectory?.currentVelocity || 0;
  const currentVelocity = Math.max(0, Math.min(100, Math.round(rawVelocity))); // clamp 0-100

  const status: 'on-track' | 'at-risk' | 'critical' =
    currentVelocity >= requiredDailyGrowth ? 'on-track' :
    currentVelocity >= requiredDailyGrowth * 0.5 ? 'at-risk' : 'critical';

  // Inject real Firecrawl evidence alongside AI-generated ones
  const realEvidence = siteSearch?.perSource.flatMap(src =>
    src.items.slice(0, 1).map(item => ({
      source: src.name,
      dataPoint: item.title || item.snippet.slice(0, 100),
      timestamp: currentDateIso
    }))
  ).slice(0, 4) || [];
  const aiEvidence = Array.isArray(aiResult?.evidencePoints) ? aiResult.evidencePoints.slice(0, 4) : [];
  const evidencePoints = [...realEvidence, ...aiEvidence].slice(0, 8);

  return {
    visibilityScore: Math.max(0, Math.min(100, Math.round(aiResult?.visibilityScore || 0))),
    metrics: {
      // Override with real data where available; fall back to AI estimate
      searchVolume: realSearchVolume !== null ? realSearchVolume : Math.round(aiResult?.metrics?.searchVolume || 0),
      socialBuzz: Math.max(0, Math.min(100, Math.round(aiResult?.metrics?.socialBuzz || 0))),
      mediaHits: realMediaHits !== null ? realMediaHits : Math.round(aiResult?.metrics?.mediaHits || 0),
      shareOfVoice: Math.max(0, Math.min(100, Math.round(aiResult?.metrics?.shareOfVoice || 0)))
    },
    sentiment: normalizeSentiment(aiResult?.sentiment),
    trends: aiResult?.trends || [],
    lastScanAt: currentDateIso,
    topGeographies: aiResult?.topGeographies || [],
    platformPerformance: aiResult?.platformPerformance || [],
    summary: aiResult?.summary || '',
    strategicAdvice: aiResult?.strategicAdvice || '',
    benchmarkContext: aiResult?.benchmarkContext || '',
    trajectory: {
      daysToH7,
      targetPeakDate,
      requiredDailyGrowth,
      currentVelocity,
      status
    },
    funnel: {
      p50Target,
      requiredAwareness,
      currentAwareness,
      gapToP50,
      conversionRates: aiResult?.funnel?.conversionRates || {
        awarenessToInterest: 0, interestToIntent: 0, intentToTicket: 0
      }
    },
    evidencePoints
  };
}
