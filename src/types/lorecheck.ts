// ─── Category of tension ─────────────────────────────────────────────────────
export type TensionCategory =
  | 'probability'   // Could this realistically happen?
  | 'culture'       // Does this fit the time / place / society?
  | 'motivation'    // Do characters have believable reasons?
  | 'economics'     // Does money / resource logic hold up?
  | 'logistics';    // Do the mechanics / timelines / access paths work?

// ─── Rating levels ────────────────────────────────────────────────────────────
export type StabilityLevel = 'Low' | 'Medium' | 'High';
export type EyebrowRisk    = 'Low' | 'Medium' | 'High';

// ─── A single tension point ───────────────────────────────────────────────────
export interface TensionPoint {
  title:       string;
  category:    TensionCategory;
  explanation: string;          // why it may feel unrealistic
  fixes:       string[];        // 2–3 suggested solutions
}

// ─── Full LoreCheck report ────────────────────────────────────────────────────
export interface LoreCheckReport {
  overallImpression: string;
  tensions:          TensionPoint[];
  stability:         StabilityLevel;
  eyebrowRisk:       EyebrowRisk;
  catNote:           string;  // closing remark from LoreKit
}

// ─── Input form ───────────────────────────────────────────────────────────────
export interface LoreCheckForm {
  worldText:           string;
  timePeriod:          string;
  countryRegion:       string;
  characterAgeRange:   string;
  characterOccupation: string;
}
