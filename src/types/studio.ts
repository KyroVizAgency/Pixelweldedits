export type ProjectCategory =
  | 'All'
  | 'Cinematic'
  | 'Short-Form'
  | 'Commercial'
  | 'YouTube';

export interface PortfolioWork {
  id: string;
  index: string;
  title: string;
  category: Exclude<ProjectCategory, 'All'>;
  formatLabel: string;
  aspectClass: string;
  gridSpanClass: string;
  aspectRatioValue: string;
  timecodeDuration: string;
  durationSeconds: number;
  image: string;
  imageAlt: string;
  video?: string;
  logline: string;
  editorialBreakdown: {
    pacing: string;
    colorPipeline: string;
    soundDesign: string;
    deliverables: string[];
  };
}

export interface StudioService {
  index: string;
  title: string;
  summary: string;
  craftFocus: string;
  formats: string[];
  cadence: string;
}

export interface PacingBriefResponse {
  recommendedService: string;
  idealRuntime: string;
  pacingRhythm: string;
  aspectRatios: string[];
  editorialApproach: string;
  soundAndGrade: string;
  deliverables: string[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ProducerChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: GroundingSource[];
}

export interface BriefPrefill {
  service?: string;
  notes?: string;
}
