export interface SimulatorInput {
  name: string;
  mood: string;
  genre: string;
}

export interface SimulatorResult {
  summary: string;
  story: string;
  quote: string;
}

export type SimulatorApiResponse =
  | { ok: true; data: SimulatorResult }
  | { ok: false; error: string; code?: string };
