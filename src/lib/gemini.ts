import { 
  FilmProfileInput, 
  AudienceDNAResult, 
  BoxPredictInput, 
  BoxPredictResult,
  FIBContent,
  CineForgeResult,
  CineForgeSource,
  VisibilityTrackerResult
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
    const response = await generateWithRetry(
      prompt,
      {
        responseMimeType: 'application/json',
        tools: useLiveTrends ? [{ googleSearch: {} }] : [],
        // Required when using tools with Gemini 3
        toolConfig: useLiveTrends ? { includeServerSideToolInvocations: true } : undefined
      }
    );
    
    const text = response.text || '';
    return JSON.parse(text) as CineForgeResult;
  } catch (error) {
    console.error("CineForge Generation AI Error:", error);
    throw error;
  }
}

export async function performVisibilityScan(
  filmInput: FilmProfileInput,
  boxPredictResult?: BoxPredictResult,
  context?: string
): Promise<VisibilityTrackerResult> {
  const currentDate = new Date().toISOString();
  const contextBlock = context ? `\nDATA KONTEKSTUAL TERBARU (Firecrawl Deep Scan):\n${context}\n` : '';
  
  const benchmarkConstraint = boxPredictResult 
    ? `PENTING: Kamu WAJIB menggunakan angka P50 Admissions berikut sebagai target benchmark: ${boxPredictResult.scenarios.base.admissions}. Jangan menghitung angka baru.`
    : `PENTING: Hitung estimasi admissions P50 yang realistis untuk pasar Indonesia berdasarkan genre, cast, dan budget tier film ini.`;

  const prompt = `
    ${KINEMA_SYSTEM_PROMPT}

    Kamu sedang menjalankan DEEP SCAN Visibility Tracker untuk film:
    JUDUL: ${filmInput.title}
    GENRE: ${filmInput.genre}
    LEAD: ${filmInput.leadCast}
    RELEASE DATE: ${filmInput.releaseDate} (Target Tayang)
    TODAY'S DATE: ${currentDate}

    ${benchmarkConstraint}
    ${contextBlock}

    Tugasmu adalah melakukan pemantauan rill (gunakan Google Search Grounding) untuk mendeteksi data VALID:
    1. Search Volume index (0-100) - Ambil dari data Google Trends Indonesia terbaru.
    2. Social Media Buzz (TikTok, Instagram, X) - Cari data views, likes, dan shares rill jika tersedia. Jika tidak ada, berikan estimasi volume diskusi yang jujur.
    3. Media Hits - Hitung artikel berita rill dari portal hiburan Indonesia.
    4. Share of Voice (SOV) - Bandingkan volume diskusi film ini secara objektif vs kompetitor.
    5. Sentimen publik rill berdasarkan percakapan terbaru di media sosial.
    6. TRAJECTORY H-7: 
       - Hitung "daysToH7" secara presisi.
       - Tentukan status 'at-risk' berdasarkan perbandingan pencapaian awareness vs target benchmark.
       - "currentVelocity": Berikan estimasi pertumbuhan awareness harian dalam persentase (0-100%). PENTING: Jika terjadi lonjakan besar, jangan berikan angka ribuan persen. Gunakan angka yang menggambarkan "momentum" (contoh: +15% per hari sudah sangat kuat).
    7. Reverse Admission Funnel (Scenario P50):
       - Target P50: Gunakan angka yang ditetapkan di atas.
       - Required Awareness: Reach target (15-20x target admissions).
       - Current Awareness: Estimasi reach rill saat ini berdasarkan data buzz yang ditemukan.
       - Gap to P50: Hitung dalam PERSENTASE seberapa jauh "Current Awareness" dari "Required Awareness".
    
    PENTING: 
    - JANGAN mengarang angka (hallucination). Jika kamu tidak menemukan angka eksak, jangan gunakan angka spesifik seperti "125,000 shares". Lebih baik gunakan angka pembulatan yang realistis atau deskripsi jangkauan (e.g. "Low coverage", "Rising buzz").
    - REACH ADALAH KUMULATIF: "currentAwareness" tidak boleh turun drastis dibanding "Required Awareness" secara tidak logis.
    - "currentVelocity" WAJIB masuk akal (biasanya 0.1% - 30% per hari). Jangan pernah memberikan angka ribuan persen.
    - "evidencePoints" WAJIB berisi temuan rill. Sertakan kutipan judul berita atau deskripsi konten spesifik yang kamu temukan di pencarian.
    - Semua angka harus berupa INTEGER murni.

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
      "lastScanAt": "${currentDate}",
      "topGeographies": ["string"],
      "platformPerformance": [
        { "platform": "string", "buzzLevel": number, "sentiment": "Positive" | "Neutral" | "Negative", "topContent": "string (link atau ringkasan konten terpopuler)" }
      ],
      "summary": "string",
      "strategicAdvice": "string",
      "benchmarkContext": "string (Penjelasan singkat data pembanding)",
      "trajectory": {
        "daysToH7": number,
        "requiredDailyGrowth": number,
        "currentVelocity": number,
        "status": "on-track" | "at-risk" | "critical",
        "targetPeakDate": "string (ISO)"
      },
      "funnel": {
        "p50Target": number,
        "requiredAwareness": number,
        "currentAwareness": number,
        "gapToP50": number,
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

  try {
    const response = await generateWithRetry(
      prompt,
      {
        responseMimeType: 'application/json',
        tools: [{ googleSearch: {} }],
        toolConfig: { includeServerSideToolInvocations: true }
      }
    );
    
    const text = response.text || '';
    return JSON.parse(text) as VisibilityTrackerResult;
  } catch (error) {
    console.error("Visibility Scan AI Error:", error);
    throw error;
  }
}
