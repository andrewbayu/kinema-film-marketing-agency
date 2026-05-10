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
}

export interface AudienceDNAResult {
  segments: SegmentResult[];
  primarySegment: string;
  insight: string;
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
}

export interface FIBContent {
  executiveSummary: string;
  audienceAnalysis: string;
  boxOfficeAnalysis: string;
  releaseWindowAnalysis: string;
  keyRisks: string[];
  nextSteps: string[];
  methodologyNote: string;
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
