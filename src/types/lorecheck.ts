// ─── Risk levels — lowercase to match API output ─────────────────────────────
export type RiskLevel = 'low' | 'medium' | 'high';

// ─── A single tension point — matches /api/lorecheck tensionPoints item ───────
export interface TensionPoint {
  title:     string;
  why:       string;       // the explanation
  riskLevel: RiskLevel;
  fixes:     string[];
}

// ─── Full LoreCheck report — matches /api/lorecheck output ───────────────────
export interface LoreCheckReport {
  overallImpression:    string;
  tensionPoints:        TensionPoint[];
  stability:            RiskLevel;
  eyebrowRaiseRisk:     RiskLevel;
  extractedAssumptions: string[];
  missingInfoQuestions: string[];
}

// ─── Input form state (frontend only) ────────────────────────────────────────
export interface LoreCheckForm {
  worldText:           string;
  timePeriod:          string;
  countryRegion:       string;
  characterAgeRange:   string;
  characterOccupation: string;
}
