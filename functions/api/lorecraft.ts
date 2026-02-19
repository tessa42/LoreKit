/**
 * POST /api/lorecraft
 *
 * Accepts a structured worldbuilding form and returns a deep verification
 * report as a typed JSON object so the frontend can render each section
 * independently without parsing markdown.
 *
 * Input
 * ─────
 * {
 *   worldType: "reality" | "fiction" | "hybrid",
 *   fields: {
 *     // reality
 *     timePeriod?: string, location?: string,
 *     // fiction
 *     genre?: string, techLevel?: string, environmentCondition?: string,
 *     // hybrid
 *     baseTimePeriod?: string, baseLocation?: string, genreLayer?: string,
 *     deviations?: Record<string, string>,   // e.g. { supernatural: "major" }
 *     motif?: string,
 *   },
 *   extraContext?: string,
 * }
 *
 * Output (200)
 * ────────────
 * {
 *   title: string,
 *   overview: string,
 *   sections: Array<{ id, title, paragraphs, bullets?, table? }>,
 *   assumptions: string[],
 *   uncertaintyFlags: string[],
 *   suggestedNextChecks: string[],
 * }
 */

import type { Env } from '../_shared/env';
import {
  jsonOk, jsonError, corsPreflightResponse,
  requireApiKey, rateLimitResponse,
} from '../_shared/response';
import { callLLM, LLMError } from '../lib/openai';
import { checkRateLimit, getClientIp } from '../lib/ratelimit';

// ─── Input types ──────────────────────────────────────────────────────────────
type WorldType = 'reality' | 'fiction' | 'hybrid';

interface RealityFields {
  timePeriod: string;
  location:   string;
}

interface FictionFields {
  genre:                 string;
  techLevel?:            string;
  environmentCondition?: string;
}

interface HybridFields {
  baseTimePeriod: string;
  baseLocation:   string;
  genreLayer:     string;
  /** e.g. { climate: "minor", supernatural: "major" } */
  deviations?:    Record<string, string>;
  motif?:         string;
}

type WorldFields = RealityFields | FictionFields | HybridFields;

interface LoreCraftRequest {
  worldType:     WorldType;
  fields:        WorldFields;
  extraContext?: string;
}

// ─── Output types ─────────────────────────────────────────────────────────────
interface ReportSection {
  id:         string;
  title:      string;
  paragraphs: string[];
  bullets?:   string[];
  table?:     { headers: string[]; rows: string[][] };
}

interface LoreCraftReport {
  title:               string;
  overview:            string;
  sections:            ReportSection[];
  assumptions:         string[];
  uncertaintyFlags:    string[];
  suggestedNextChecks: string[];
}

// ─── Validation ───────────────────────────────────────────────────────────────
const VALID_TYPES = new Set<WorldType>(['reality', 'fiction', 'hybrid']);

/** Returns a human-readable error string, or null if valid. */
function validate(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) {
    return 'Request body must be a JSON object.';
  }
  const b = body as Record<string, unknown>;

  if (!VALID_TYPES.has(b['worldType'] as WorldType)) {
    return 'worldType must be "reality", "fiction", or "hybrid".';
  }

  const f = (b['fields'] ?? {}) as Record<string, unknown>;

  switch (b['worldType']) {
    case 'reality':
      if (!str(f['timePeriod'])) return 'fields.timePeriod is required for reality worlds.';
      if (!str(f['location']))   return 'fields.location is required for reality worlds.';
      break;
    case 'fiction':
      if (!str(f['genre'])) return 'fields.genre is required for fiction worlds.';
      break;
    case 'hybrid':
      if (!str(f['baseTimePeriod'])) return 'fields.baseTimePeriod is required for hybrid worlds.';
      if (!str(f['baseLocation']))   return 'fields.baseLocation is required for hybrid worlds.';
      if (!str(f['genreLayer']))     return 'fields.genreLayer is required for hybrid worlds.';
      break;
  }
  return null;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/** Cap individual string fields to mitigate oversized prompt injection. */
function sanitise(body: LoreCraftRequest): LoreCraftRequest {
  const cap = (s: string | undefined, n: number) => s?.trim().slice(0, n);
  const f = body.fields as unknown as Record<string, unknown>;
  for (const key of Object.keys(f)) {
    if (typeof f[key] === 'string') {
      f[key] = cap(f[key] as string, 400);
    }
  }
  return {
    ...body,
    fields:       f as unknown as WorldFields,
    extraContext: cap(body.extraContext, 800),
  };
}

// ─── Runtime shape guard ──────────────────────────────────────────────────────
function isValidReport(obj: unknown): obj is LoreCraftReport {
  if (typeof obj !== 'object' || obj === null) return false;
  const r = obj as Record<string, unknown>;
  return (
    typeof r['title']    === 'string' &&
    typeof r['overview'] === 'string' &&
    Array.isArray(r['sections']) &&
    Array.isArray(r['assumptions']) &&
    Array.isArray(r['uncertaintyFlags']) &&
    Array.isArray(r['suggestedNextChecks'])
  );
}

// ─── Prompt builder ───────────────────────────────────────────────────────────
function worldBlock(body: LoreCraftRequest): string {
  const lines: string[] = [];
  const { worldType, fields } = body;

  if (worldType === 'reality') {
    const f = fields as RealityFields;
    lines.push(
      '## World Type: Historical Reality',
      `- **Time Period:** ${f.timePeriod}`,
      `- **Location / Region:** ${f.location}`,
    );
  } else if (worldType === 'fiction') {
    const f = fields as FictionFields;
    lines.push('## World Type: Fictional World', `- **Genre:** ${f.genre}`);
    if (f.techLevel)            lines.push(`- **Technology Level:** ${f.techLevel}`);
    if (f.environmentCondition) lines.push(`- **Environment / Conditions:** ${f.environmentCondition}`);
  } else {
    const f = fields as HybridFields;
    lines.push(
      '## World Type: Hybrid (Reality + Fiction)',
      '',
      '### Reality Anchor — these rules ALWAYS hold, never bend them:',
      `- **Base Time Period:** ${f.baseTimePeriod}`,
      `- **Base Location:** ${f.baseLocation}`,
      '',
      '### Fictional Divergence Layer — these break or bend reality:',
      `- **Genre Layer:** ${f.genreLayer}`,
    );
    if (f.deviations && Object.keys(f.deviations).length > 0) {
      lines.push('- **Allowed Deviations (domain → severity):**');
      for (const [domain, severity] of Object.entries(f.deviations)) {
        lines.push(`  - ${domain}: ${severity}`);
      }
    }
    if (f.motif) lines.push(`- **Core Motif / Themes:** ${f.motif}`);
  }

  if (body.extraContext) {
    lines.push('', '### Additional Context from the Creator:', body.extraContext);
  }

  return lines.join('\n');
}

function buildPrompt(body: LoreCraftRequest): string {
  const hybridNote = body.worldType === 'hybrid'
    ? '- HYBRID RULE: The Reality Anchor is immutable ground truth. Only the domains listed under Allowed Deviations may diverge, and only up to the stated severity. Do not invent additional deviations.\n'
    : '';

  return `\
${worldBlock(body)}

---

Generate a comprehensive worldbuilding verification report as a single JSON object matching EXACTLY this structure (output raw JSON only, no markdown fences):

{
  "title": "Short evocative world title, 3–6 words",
  "overview": "2–3 paragraphs synthesising the world's essence, atmosphere, and what makes it distinctive.",
  "sections": [
    {
      "id": "internal-logic",
      "title": "Internal Logic Assessment",
      "paragraphs": ["Evaluative paragraph on overall coherence — what holds together and what is fragile."],
      "bullets": [
        "Strength: <observation>",
        "Strength: <observation>",
        "Fragility: <observation>",
        "Fragility: <observation>"
      ]
    },
    {
      "id": "world-laws",
      "title": "Key World Laws",
      "paragraphs": [],
      "table": {
        "headers": ["Law", "Strength", "Note"],
        "rows": [
          ["Concise law statement", "Strong | Moderate | Fragile", "One-sentence implication for stories set here"]
        ]
      }
    },
    {
      "id": "tensions",
      "title": "Potential Tensions & Paradoxes",
      "paragraphs": [],
      "table": {
        "headers": ["Tension", "Severity", "Suggested Resolution"],
        "rows": [
          ["Tension name — brief description of the contradiction or unresolved question", "Low | Medium | High", "One concrete path the creator could take"]
        ]
      }
    },
    {
      "id": "narrative-hooks",
      "title": "Narrative Opportunities",
      "paragraphs": [],
      "bullets": [
        "Hook title: 2–3 sentence description of the story possibility this world naturally generates."
      ]
    },
    {
      "id": "checklist",
      "title": "Worldbuilder's Checklist",
      "paragraphs": [],
      "bullets": [
        "Question phrased as something the creator must decide before writing (e.g. 'Have you defined what happens when …?')"
      ]
    },
    {
      "id": "verdict",
      "title": "LoreKit's Verdict",
      "paragraphs": [
        "In-character paragraph from LoreKit the assistant cat — knowledgeable, a little witty, warm and honest.",
        "✦✦✦✦☆ 4/5 — One-sentence summary of the rating rationale."
      ]
    }
  ],
  "assumptions": [
    "Every factual assumption you made that the creator did not explicitly state. Tag real-world claims as '[Historical]' or '(approximation)'."
  ],
  "uncertaintyFlags": [
    "Anything ambiguous or potentially contradictory in the creator's inputs that they should clarify."
  ],
  "suggestedNextChecks": [
    "Concrete follow-up action phrased as a recommendation, e.g. 'Run a LoreCheck on the economic model to test market plausibility.'"
  ]
}

STRICT CONSTRAINTS:
- Output ONLY the JSON object — no prose before or after.
- world-laws table: exactly 5–7 rows.
- tensions table: exactly 3–5 rows.
- narrative-hooks bullets: 4–6 items.
- checklist bullets: 5–8 items, each a question.
- assumptions: list every inference you made. Never omit one.
- uncertaintyFlags: flag ambiguity; do NOT silently resolve it by inventing details.
- Do NOT fabricate statistics, population figures, or historical claims. If you must estimate, write "(approximation)" inline.
${hybridNote}`;
}

// ─── System prompt ────────────────────────────────────────────────────────────
const SYSTEM =
  'You are LoreKit, a meticulous and slightly mischievous assistant cat who specialises in worldbuilding consistency analysis for writers and creators. ' +
  'You produce rigorous, well-reasoned reports that balance scholarly depth with creative insight. ' +
  'You flag every assumption, never confabulate statistics, and mark uncertain estimates as approximations. ' +
  'You respond ONLY with a valid JSON object — no surrounding prose, no markdown code fences.';

// ─── Handler ──────────────────────────────────────────────────────────────────
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const guard = requireApiKey(env.OPENAI_API_KEY);
  if (guard) return guard;

  const ip = getClientIp(request);
  const rl = checkRateLimit(ip, { windowMs: 60_000, maxRequests: 10 });
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError('Request body must be valid JSON.', 400);
  }

  const err = validate(raw);
  if (err) return jsonError(err, 400);

  const body = sanitise(raw as LoreCraftRequest);

  let report: unknown;
  try {
    report = await callLLM(env.OPENAI_API_KEY, {
      system:      SYSTEM,
      user:        buildPrompt(body),
      jsonSchema:  {}, // enables JSON mode; shape is enforced by the prompt
      model:       'gpt-4o',
      temperature: 0.55,
      maxTokens:   2_800,
    });
  } catch (e) {
    if (e instanceof LLMError) {
      return jsonError('AI service returned an error.', e.status, e.message);
    }
    return jsonError('Unexpected server error.', 500, String(e));
  }

  if (!isValidReport(report)) {
    return jsonError(
      'The AI returned an unexpected response shape. Please try again.',
      502,
    );
  }

  return jsonOk(report);
};

export const onRequestOptions: PagesFunction = () =>
  Promise.resolve(corsPreflightResponse('POST, OPTIONS'));
