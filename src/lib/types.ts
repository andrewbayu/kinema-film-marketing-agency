export interface Film {
  id: string;
  title: string;
  genre: GenreOption;
  client: string;
  phase: string;
  daysToRelease: number;
  reach: string;
  occupancy: number | null;
  status: 'active' | 'pre-release' | 'post';
  progress: number;
  alert?: string;
  // Extended fields from Campaign profile
  logline?: string;
  leadCast?: string;
  director?: string;
  budgetTier?: BudgetTier;
  releaseWindow?: string;
  ipType?: IPType;
  releaseDate?: string;
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
