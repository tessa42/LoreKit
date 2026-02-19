// ─── Vibe ─────────────────────────────────────────────────────────────────────
export type VibeType = 'dark' | 'cozy' | 'tragic' | 'whimsical';

// ─── Character card — API fields + vibe added client-side from form state ─────
export interface SimulatorCard {
  name:           string;
  assignedWorld:  string;   // exact world name string returned by the API
  roleArchetype:  string;
  storyHookLines: string[]; // 4–6 prose sentences
  fateQuote:      string;
  vibe:           VibeType | ''; // not from API — from form, controls card colours
}

// ─── Input form state ─────────────────────────────────────────────────────────
export interface SimulatorForm {
  name:         string;
  vibe:         VibeType | '';
  imageDataUrl: string | null; // client-side preview only, never uploaded
}
