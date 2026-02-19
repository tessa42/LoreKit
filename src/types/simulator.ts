// ─── Vibe ─────────────────────────────────────────────────────────────────────
export type VibeType = 'dark' | 'cozy' | 'tragic' | 'whimsical';

// ─── Preset worlds ────────────────────────────────────────────────────────────
export interface PresetWorld {
  id:          string;
  name:        string;
  emoji:       string;
  tagline:     string;
}

// ─── Generated character card ─────────────────────────────────────────────────
export interface SimulatorCard {
  name:          string;           // character name (from input)
  world:         PresetWorld;
  roleArchetype: string;           // e.g. "The Hollow Archivist"
  storyHook:     string[];         // 4–6 prose sentences displayed as a paragraph
  fateQuote:     string;           // one-line prophecy / fate
  vibe:          VibeType | '';    // controls card accent colours
}

// ─── Input form state ─────────────────────────────────────────────────────────
export interface SimulatorForm {
  name:         string;
  vibe:         VibeType | '';
  imageDataUrl: string | null;     // client-side preview only, never uploaded
}
