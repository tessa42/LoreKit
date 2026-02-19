// ─── World Type (frontend form) ───────────────────────────────────────────────
export type WorldType = 'historical' | 'fictional' | 'hybrid';

// ─── Deviation (Hybrid only, frontend form) ───────────────────────────────────
export type DeviationType = 'climate' | 'supernatural' | 'technology' | 'political' | 'social';
export type DeviationLevel = 'minor' | 'moderate' | 'major';

// ─── API report types — match /api/lorecraft JSON output ─────────────────────
export interface ReportSection {
  id:         string;
  title:      string;
  paragraphs: string[];
  bullets?:   string[];
  table?:     { headers: string[]; rows: string[][] };
}

export interface LoreCraftReport {
  title:               string;
  overview:            string;
  sections:            ReportSection[];
  assumptions:         string[];
  uncertaintyFlags:    string[];
  suggestedNextChecks: string[];
}

// ─── Form state (frontend only) ───────────────────────────────────────────────
export interface LoreCraftForm {
  worldType: WorldType | '';

  // Historical Reality
  timePeriod: string;
  location:   string;

  // Fictional World
  genre:                string;
  customGenre:          string;
  techLevel:            string;
  environmentCondition: string;

  // Hybrid — Section A (Reality Anchor)
  baseTimePeriod: string;
  baseLocation:   string;

  // Hybrid — Section B (Fictional Divergence)
  genreLayer: string;
  deviations: Partial<Record<DeviationType, DeviationLevel>>;

  // Hybrid — Section C (optional)
  motif: string;

  // Common
  extraContext: string;
}
