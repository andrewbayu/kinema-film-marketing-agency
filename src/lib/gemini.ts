import { GoogleGenAI } from '@google/genai';
import { 
  FilmProfileInput, 
  AudienceDNAResult, 
  BoxPredictInput, 
  BoxPredictResult,
  FIBContent,
  CineForgeResult,
  CineForgeSource
} from './types';
import { KINEMA_SYSTEM_PROMPT, CINEFORGE_PROMPT } from './prompts';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || ''
});

// Helper for checking API Key
if (!process.env.GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY is not defined. Please add it to Secrets in AI Studio.");
}

async function generateWithRetry(prompt: string, config: any, retries = 3): Promise<any> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      // @ts-ignore
      return await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          ...config,
          // Increase timeout budget slightly for tool calls if the environment allows or model respects it
        }
      });
    } catch (err: any) {
      lastError = err;
      const errorMsg = err.message || '';
      const isTransient = errorMsg.includes('500') || errorMsg.includes('503') || errorMsg.includes('Deadline') || errorMsg.includes('UNAVAILABLE');
      
      if (!isTransient) throw err;
      
      console.warn(`Gemini API transient error (attempt ${i + 1}/${retries}). Retrying...`, err);
      if (i < retries - 1) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 2000));
      }
    }
  }
  throw lastError;
}

export async function runAudienceDNA(input: FilmProfileInput): Promise<AudienceDNAResult> {
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

    Tugasmu:
    1. Identifikasi 3-4 segmen penonton Indonesia yang paling relevan.
    2. CARI TAHU tren terbaru di Indonesia (TikTok/IG/News) yang berkaitan dengan genre atau subjek film ini. Fokus pada kata kunci spesifik untuk efisiensi.
    3. Analisis landscape penonton dan prediksi resonance score.

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
      ]
    }
  `;

  try {
    const response = await generateWithRetry(
      prompt,
      {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingLevel: 'LOW' }
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
  audienceResult: AudienceDNAResult
): Promise<BoxPredictResult> {
  const prompt = `
    ${KINEMA_SYSTEM_PROMPT}

    Kamu sedang menjalankan BoxPredict™ Simulation.
    
    FILM: ${boxInput.title}
    GENRE: ${boxInput.genre}
    RELEASE DATE: ${boxInput.releaseDate}
    AUDIENCE: ${audienceResult.primarySegment}

    INSTRUKSI KHUSUS ANALISIS MARKET:
    1. CARI TAHU konteks tanggal ${boxInput.releaseDate} di Indonesia. Apakah itu hari biasa? Lebaran? Libur sekolah? Long weekend?
    2. CARI TAHU kompetisi film (Hollywood/Lokal) yang rilis dalam window 2 minggu di sekitar ${boxInput.releaseDate}.
    3. CARI TAHU performa box office film Indonesia dengan genre/skala serupa dalam 2 tahun terakhir untuk benchmarking.
    4. Justifikasi angka P25, P50, P75 berdasarkan temuan real-time dari pencarian tersebut.
    
    Hasilkan proyeksi box office 3 skenario (bear, base, bull) di pasar Indonesia dengan mempertimbangkan data historis dan faktor eksternal tersebut.

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
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingLevel: 'LOW' }
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
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        tools: useLiveTrends ? [{ googleSearch: {} }] : [],
        // Required when using tools with Gemini 3
        toolConfig: useLiveTrends ? { includeServerSideToolInvocations: true } : undefined
      }
    });
    
    const text = response.text || '';
    return JSON.parse(text) as CineForgeResult;
  } catch (error) {
    console.error("CineForge Generation AI Error:", error);
    throw error;
  }
}
