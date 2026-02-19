// ─── World Type ──────────────────────────────────────────────────────────────
export type WorldType = 'historical' | 'fictional' | 'hybrid';

// ─── Deviation (Hybrid only) ─────────────────────────────────────────────────
export type DeviationType = 'climate' | 'supernatural' | 'technology' | 'political' | 'social';
export type DeviationLevel = 'minor' | 'moderate' | 'major';

// ─── Report building blocks ───────────────────────────────────────────────────
export type LawStrength = 'Strong' | 'Moderate' | 'Fragile';
export type TensionSeverity = 'Low' | 'Medium' | 'High';
export type ChecklistPriority = 'high' | 'medium' | 'low';

export interface WorldLaw {
  law: string;
  strength: LawStrength;
  note: string;
}

export interface Tension {
  name: string;
  issue: string;
  resolution: string;
  severity: TensionSeverity;
}

export interface ChecklistItem {
  item: string;
  priority: ChecklistPriority;
}

// ─── Full report ──────────────────────────────────────────────────────────────
export interface LoreCraftReport {
  worldSummary: {
    name: string;
    worldType: string;
    tags: string[];
    nutrientsConsumed: number;
  };
  overview: string;
  logicAssessment: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
  };
  worldLaws: WorldLaw[];
  tensions: Tension[];
  narrativeOpportunities: string[];
  checklist: ChecklistItem[];
  verdict: {
    text: string;
    rating: number; // 0–5
  };
}

// ─── Form state ───────────────────────────────────────────────────────────────
export interface LoreCraftForm {
  worldType: WorldType | '';

  // Historical Reality
  timePeriod: string;
  location: string;

  // Fictional World
  genre: string;
  customGenre: string;
  techLevel: string;
  environmentCondition: string;

  // Hybrid — Section A (Reality Anchor)
  baseTimePeriod: string;
  baseLocation: string;

  // Hybrid — Section B (Fictional Divergence)
  genreLayer: string;
  deviations: Partial<Record<DeviationType, DeviationLevel>>;

  // Hybrid — Section C (optional)
  motif: string;

  // Common
  extraContext: string;
}
