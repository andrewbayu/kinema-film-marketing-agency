export interface Film {
  id: string;

  // Profile fields (persisted to Firestore via FilmProfileInput)
  title: string;
  genre: GenreOption;
  logline?: string;
  leadCast?: string;
  director?: string;
  budgetTier?: BudgetTier;
  releaseWindow?: string;
  ipType?: IPType;
  releaseDate?: string;

  // Server-set fields (Firestore-managed)
  userId?: string;
  // Firestore Timestamp when live, serialized object after localStorage round-trip.
  createdAt?: any;
  status?: 'active' | 'pre-release' | 'post';
  lastVisibilityScan?: any;

  // Display-only / computed (not persisted)
  client?: string;
  phase?: string;
  daysToRelease?: number;
  reach?: string;
  occupancy?: number | null;
  progress?: number;
  alert?: string;
}

export type BudgetTier = 'indie' | 'mid' | 'major';
export type IPType = 'original' | 'minor-adaptation' | 'popular-adaptation' | 'major-ip' | 'sequel';
export type GenreOption = 
  | 'Supernatural Horror' 
  | 'Horror'
  | 'Romantic Drama' 
  | 'Comedy' 
  | 'Horror Comedy'
  | 'Adventure / Horror Comedy'
  | 'Family / Animation' 
  | 'Thriller / Crime' 
  | 'Action'
  | 'Drama'
  | 'Biopic'
  | 'Religious Drama'
  | 'History'
  | 'Musical'
  | 'Documentary';

export interface FilmProfileInput {
  title: string;
  genre: GenreOption;
  budgetTier: BudgetTier;
  logline: string;
  leadCast: string;
  ipType: IPType;
  director?: string;
  releaseWindow?: string; // Optional for legacy or AI to fill
  releaseDate: string; // Required for new scans
}

export interface BoxPredictInput extends FilmProfileInput {
  releaseDate: string;
  screenCount: number;
  trailerViews?: number;
  trailerVelocity?: number;
  competitors: string[];
  castScore?: number;
  directorScore?: number;
}

export interface SegmentResult {
  name: string;
  ageRange: string;
  primaryPlatform: string[];
  behavioralScores: {
    skepticism: number;
    identity: number;
    anxiety: number;
    knowledge: number;
  };
  pills: string[];
  resonanceScore: number;
  triggerMechanism: string;
  messagingApproach: string;
  platform: string;
  marketSaturation?: number; // 0-100
  mediaHabits?: string[];
}

export interface MediaSource {
  type: 'mainstream' | 'niche' | 'kol' | 'community';
  name: string;
  url?: string; // domain or handle URL — required for 'web' platform sources
  platform: 'web' | 'instagram' | 'tiktok' | 'youtube' | 'x' | 'telegram';
  segment: string; // which AudienceDNA segment this source serves
  rationale: string; // why this source matches the audience
}

export interface AudienceDNAResult {
  segments: SegmentResult[];
  primarySegment: string;
  insight: string;
  interestCore?: string[];
  channelPriority: Array<{
    channel: string;
    priority: 'High' | 'Medium' | 'Low';
    reason: string;
  }>;
  mediaUniverse?: MediaSource[]; // curated outlets/KOLs/communities for visibility tracking
}

export interface ScenarioData {
  admissions: number;
  revenue: number;
  label: string;
  confidence: string;
}

export interface BoxPredictResult {
  scenarios: {
    bear: ScenarioData;
    base: ScenarioData;
    bull: ScenarioData;
  };
  sensitivity: Array<{
    dimension: string;
    impact: number;
    direction: 'Positive' | 'Negative';
    note: string;
  }>;
  riskFlags: string[];
  releaseWindowRecommendation: string;
  methodology: string;
  weeklyDecayRate?: string; // Estimated drop percentage per week
  geographicalTargeting?: string[]; // Top 5 target cities
}

export interface FIBContent {
  executiveSummary: string;
  audienceAnalysis: string;
  boxOfficeAnalysis: string;
  releaseWindowAnalysis: string;
  keyRisks: string[];
  nextSteps: string[];
  methodologyNote: string;
  marketingMix?: Array<{
    channel: string;
    allocation: number; // percentage
    objective: string;
  }>;
  usp?: string;
}

export interface FIBResult {
  campaignId: string;
  userId: string;
  results: FIBContent;
  createdAt: any; // Firestore Timestamp
}

export interface BoxOfficeHistory {
  date: string;
  admissions: number;
  theaters: number;
  revenue: number;
}

export interface CineForgeContent {
  id: string;
  title: string;
  type: 'Video' | 'Graphic' | 'Copy' | 'Hybrid';
  targetSegment: string;
  resonanceScore: number;
  distributionChannel: 'Lead Actor' | 'Supporting Cast' | 'Homeless Media' | 'Paid Ads' | 'Official Account' | 'WA Blast';
  contentHook: string;
  visualDirection: string;
  captionTemplate: string;
  cta: string;
}

export interface CineForgeSource {
  type: 'URL' | 'Video' | 'Article' | 'Image';
  value: string;
  label?: string;
}

export interface CineForgeResult {
  sessionTitle: string;
  generatedDate: string;
  campaignGoal: string;
  contents: CineForgeContent[];
  sourceReference?: string;
}

export interface LiveTickerData {
  filmId: string;
  lastUpdated: string;
  totalAdmission: number;
  revenue: number;
  avgOccupancy: number;
  trend: 'up' | 'stable' | 'down';
  cities: Array<{
    name: string;
    occupancy: number;
    trend: 'up' | 'stable' | 'down';
    alert: boolean;
  }>;
}

// -------------------- Showtime Allocation --------------------
export type CinemaChain = 'XXI' | 'CGV' | 'Cinepolis' | 'FLIX' | 'Platinum' | 'New Star' | 'Other';
export type FormatTier = 'regular' | 'premium' | 'imax' | 'other';
export type CityTier = 'tier1' | 'tier2' | 'tier3';

export interface CinemaShow {
  cinema: string;
  city: string;
  chain: CinemaChain;
  format: string; // raw format string from site (e.g. "Regular 2D", "IMAX", "SILVER Class")
  tier: FormatTier;
  price: number;
  showtimes: string[]; // ["12:35", "14:40", ...]
  date: string; // ISO date — the day these showtimes are scheduled for
}

export interface ShowtimeSnapshot {
  campaignId: string;
  userId: string;
  filmUrl: string;
  scannedAt: string;
  scanMode: 'default' | 'deep';
  // Aggregates
  totalShows: number;
  totalCinemas: number;
  totalCities: number;
  totalChains: number;
  byCity: Array<{ city: string; count: number; tier: CityTier }>;
  byChain: Array<{ chain: CinemaChain; count: number }>;
  byFormat: Array<{ format: string; count: number }>;
  byTier: { regular: number; premium: number; imax: number; other: number };
  shows: CinemaShow[]; // raw rows for drill-down
  velocity?: number; // % change in totalShows vs previous snapshot (computed at save time)
  daysToRelease?: number; // negative = post-release, positive = pre-release
  phase: 'pre-release' | 'release-week' | 'post-release';
}

export interface VisibilityTrackerResult {
  visibilityScore: number;
  metrics: {
    searchVolume: number; // Intent Index
    socialBuzz: number;   // Enthusiasm Index
    mediaHits: number;    // PR Momentum
    shareOfVoice: number; // Competitive Index (0-100)
  };
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  trends: string[];
  lastScanAt: string;
  topGeographies?: string[];
  platformPerformance: Array<{
    platform: string;
    buzzLevel: number;
    sentiment: 'Positive' | 'Neutral' | 'Negative';
    topContent?: string; // Real link or post description
  }>;
  summary: string;
  strategicAdvice: string;
  benchmarkContext?: string;
  trajectory?: {
    daysToH7: number;
    requiredDailyGrowth: number;
    currentVelocity: number;
    status: 'on-track' | 'at-risk' | 'critical';
    targetPeakDate: string;
  };
  funnel?: {
    p50Target: number;
    requiredAwareness: number;
    currentAwareness: number;
    gapToP50: number;
    conversionRates: {
      awarenessToInterest: number;
      interestToIntent: number;
      intentToTicket: number;
    };
  };
  evidencePoints?: Array<{
    source: string;
    dataPoint: string;
    timestamp: string;
  }>; // For transparency
}
