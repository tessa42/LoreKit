// ─── Risk levels — lowercase to match API output ─────────────────────────────
export type RiskLevel = 'low' | 'medium' | 'high';

// ─── A single tension point — matches /api/lorecheck tensionPoints item ───────
export interface TensionPoint {
  title:     string;
  why:       string;       // the explanation
  riskLevel: RiskLevel;
  fixes:     string[];
}

// ─── Full LoreCheck Quick Scan report — matches /api/lorecheck quick output ───
export interface LoreCheckReport {
  mode?:                'quick';
  overallImpression:    string;
  tensionPoints:        TensionPoint[];
  stability:            RiskLevel;
  eyebrowRaiseRisk:     RiskLevel;
  extractedAssumptions: string[];
  missingInfoQuestions: string[];
}

// ─── Deep Audit types ─────────────────────────────────────────────────────────
export interface DeepFinding {
  title:     string;
  why:       string;
  riskLevel: RiskLevel;
  evidence?: string;
  fixes:     string[];
}

export interface DeepReport {
  mode:             'deep';
  executiveSummary: string;
  layerFindings: {
    structural:   DeepFinding[];
    behavioral:   DeepFinding[];
    cultural:     DeepFinding[];
    occupational: DeepFinding[];
    motivational: DeepFinding[];
  };
  topRisks:             Array<{ title: string; riskLevel: RiskLevel; why: string; fixes: string[] }>;
  assumptions:          string[];
  uncertaintyFlags:     string[];
  researchGapQuestions: string[];
}

// ─── Union type for result rendering ─────────────────────────────────────────
export type LoreCheckResult = (LoreCheckReport & { mode: 'quick' }) | DeepReport;

// ─── Input form state (frontend only) ────────────────────────────────────────
export interface LoreCheckForm {
  worldText:           string;
  timePeriod:          string;
  countryRegion:       string;
  characterAgeRange:   string;
  characterOccupation: string;
}
