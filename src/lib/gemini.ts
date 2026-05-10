import { GoogleGenAI } from '@google/genai';
import { 
  FilmProfileInput, 
  AudienceDNAResult, 
  BoxPredictInput, 
  BoxPredictResult,
  FIBContent
} from './types';
import { KALA_SYSTEM_PROMPT } from './prompts';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || ''
});

// Helper for checking API Key
if (!process.env.GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY is not defined. Please add it to Secrets in AI Studio.");
}

export async function runAudienceDNA(input: FilmProfileInput): Promise<AudienceDNAResult> {
  const prompt = `
    ${KALA_SYSTEM_PROMPT}

    Kamu sedang menjalankan AudienceDNA™ untuk film berikut:

    JUDUL: ${input.title}
    GENRE: ${input.genre}
    LOGLINE: ${input.logline}
    LEAD CAST: ${input.leadCast}
    BUDGET TIER: ${input.budgetTier}
    RELEASE WINDOW: ${input.releaseWindow}
    IP TYPE: ${input.ipType}
    ${input.director ? `SUTRADARA: ${input.director}` : ''}

    Tugasmu:
    1. Identifikasi 3-4 segmen penonton Indonesia yang paling relevan.
    2. CARI TAHU tren terbaru di Indonesia (TikTok/IG) yang berkaitan dengan genre atau cast ini menggunakan tool search.
    3. Analisis bagaimana tren tersebut mempengaruhi minat penonton.

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
          "platform": "string"
        }
      ],
      "primarySegment": "string",
      "insight": "analisis 150-200 kata tentang landscape penonton film ini, termasuk tren eksternal yang kamu temukan",
      "channelPriority": [
        { "channel": "string", "priority": "Tinggi" | "Sedang" | "Rendah", "reason": "string" }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json'
      }
    });
    
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
    ${KALA_SYSTEM_PROMPT}

    Kamu sedang menjalankan BoxPredict™ Simulation.
    
    FILM: ${boxInput.title}
    GENRE: ${boxInput.genre}
    RELEASE: ${boxInput.releaseDate} (${boxInput.releaseWindow})
    AUDIENCE: ${audienceResult.primarySegment}

    INSTRUKSI KHUSUS (MANDATORY):
    1. Gunakan tool SEARCH untuk mencari DATA HISTORIS BOX OFFICE Indonesia untuk film dengan GENRE serupa (${boxInput.genre}) atau TEMA serupa dalam 3-5 tahun terakhir.
    2. Identifikasi tren performa (admissions) dari film-film referensi tersebut untuk menjustifikasi angka P25 (Bear) dan P50 (Base).
    3. Gunakan tool SEARCH untuk mengecek apakah ada EVENT BESAR (Piala Dunia, Konser, Event Politik, Libur Nasional Baru) di sekitar tanggal ${boxInput.releaseDate}.
    4. Cek apakah ada kompetitor besar (Hollywood atau Lokal) yang sudah lock tanggal serupa.
    5. Hubungkan tema film (misal: Sepakbola) dengan event dunia/lokal yang relevan untuk mencari "Momentum Boost".
    
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
      "methodology": "Berikan penjelasan bagaimana faktor eksternal (hasil crawling) mempengaruhi angka ini"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json'
      }
    });
    
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
    ${KALA_SYSTEM_PROMPT}
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
      "methodologyNote": "string"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    
    const text = response.text || '';
    return JSON.parse(text) as FIBContent;
  } catch (error) {
    console.error("FIB Generation AI Error:", error);
    throw error;
  }
}
