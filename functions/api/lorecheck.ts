/**
 * POST /api/lorecheck
 *
 * Performs an automatic Quick Scan across five plausibility layers and returns
 * a structured JSON report — no checkbox selection required from the user.
 *
 * Input
 * ─────
 * {
 *   text: string,                  // the passage to analyse (30–4000 chars)
 *   optionalMeta?: {
 *     timePeriod?: string,
 *     region?:     string,
 *     ageRange?:   string,
 *     occupation?: string,
 *   }
 * }
 *
 * Output (200)
 * ────────────
 * {
 *   overallImpression:    string,
 *   tensionPoints:        Array<{ title, why, riskLevel, fixes }>,
 *   stability:            "low" | "medium" | "high",
 *   eyebrowRaiseRisk:     "low" | "medium" | "high",
 *   extractedAssumptions: string[],
 *   missingInfoQuestions: string[],
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
interface OptionalMeta {
  timePeriod?: string;
  region?:     string;
  ageRange?:   string;
  occupation?: string;
}

interface LoreCheckRequest {
  text:          string;
  optionalMeta?: OptionalMeta;
}

// ─── Output types ─────────────────────────────────────────────────────────────
type RiskLevel = 'low' | 'medium' | 'high';

interface TensionPoint {
  title:     string;
  why:       string;
  riskLevel: RiskLevel;
  fixes:     string[];
}

interface LoreCheckReport {
  overallImpression:    string;
  tensionPoints:        TensionPoint[];
  stability:            RiskLevel;
  eyebrowRaiseRisk:     RiskLevel;
  extractedAssumptions: string[];
  missingInfoQuestions: string[];
}

// ─── Validation ───────────────────────────────────────────────────────────────
function validate(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) {
    return 'Request body must be a JSON object.';
  }
  const b = body as Record<string, unknown>;
  const text = b['text'];

  if (typeof text !== 'string') {
    return 'text is required and must be a string.';
  }
  if (text.trim().length < 30) {
    return 'text must be at least 30 characters for a meaningful scan.';
  }
  if (text.trim().length > 4_000) {
    return 'text must be under 4 000 characters. Split longer passages and scan in sections.';
  }
  return null;
}

function sanitise(body: LoreCheckRequest): LoreCheckRequest {
  const cap = (s: string | undefined, n: number) => s?.trim().slice(0, n);
  const m = body.optionalMeta;
  return {
    text: body.text.trim().slice(0, 4_000),
    optionalMeta: m
      ? {
          timePeriod: cap(m.timePeriod, 100),
          region:     cap(m.region, 100),
          ageRange:   cap(m.ageRange, 60),
          occupation: cap(m.occupation, 100),
        }
      : undefined,
  };
}

// ─── Runtime shape guard ──────────────────────────────────────────────────────
const RISK_LEVELS = new Set<string>(['low', 'medium', 'high']);

function isValidReport(obj: unknown): obj is LoreCheckReport {
  if (typeof obj !== 'object' || obj === null) return false;
  const r = obj as Record<string, unknown>;
  return (
    typeof r['overallImpression'] === 'string'  &&
    Array.isArray(r['tensionPoints'])            &&
    RISK_LEVELS.has(r['stability'] as string)    &&
    RISK_LEVELS.has(r['eyebrowRaiseRisk'] as string) &&
    Array.isArray(r['extractedAssumptions'])     &&
    Array.isArray(r['missingInfoQuestions'])
  );
}

// ─── Prompt builder ───────────────────────────────────────────────────────────
function metaBlock(meta: OptionalMeta | undefined): string {
  if (!meta) return '';
  const lines: string[] = [];
  if (meta.timePeriod) lines.push(`- **Time Period:** ${meta.timePeriod}`);
  if (meta.region)     lines.push(`- **Region / Setting:** ${meta.region}`);
  if (meta.ageRange)   lines.push(`- **Character Age Range:** ${meta.ageRange}`);
  if (meta.occupation) lines.push(`- **Character Occupation:** ${meta.occupation}`);
  if (lines.length === 0) return '';
  return '\n### Contextual Metadata (provided by the creator):\n' + lines.join('\n');
}

function buildPrompt(body: LoreCheckRequest): string {
  return `\
Analyse the following worldbuilding or narrative passage. Run a Quick Scan across all five evaluation layers automatically — do NOT ask the creator to select categories. Surface only the most meaningful findings.

### Passage:
---
${body.text}
---
${metaBlock(body.optionalMeta)}

### Evaluation Layers (evaluate all silently, then report findings):

1. **Structural Plausibility** — Does the described situation, setting, or sequence hold together physically and logically? Look for impossible causation, contradictory premises, or physical impossibilities.

2. **Behavioral Probability** — Are character decisions and reactions believable given the pressures they face? Flag choices that feel unmotivated, conveniently timed, or psychologically implausible.

3. **Cultural Alignment** — Do the norms, values, and social dynamics match the stated time period, region, and cultural context? Flag anachronisms, cultural contradictions, or mismatched social logic. Use the metadata (if provided) to sharpen this layer.

4. **Occupational Logic** — Are skills, access, and knowledge consistent with the characters' stated roles and experience? Flag when characters know too much, too little, or act outside their plausible competence.

5. **Motivational Coherence** — Do goals, fears, and actions form a coherent arc? Flag hidden motivations that strain credibility or goals that contradict established character needs.

---

Return a single JSON object matching EXACTLY this structure (raw JSON only, no markdown fences):

{
  "overallImpression": "2–3 sentence synthesis of the passage's overall plausibility. Lead with what works — be warm but honest. This is the opening note from LoreKit.",
  "tensionPoints": [
    {
      "title": "Short label naming the specific tension",
      "why": "1–2 sentences: what the issue is and why it matters for reader immersion or story credibility.",
      "riskLevel": "low | medium | high",
      "fixes": [
        "Concrete, actionable suggestion phrased directly to the creator — what they could change or clarify.",
        "An alternative fix if a different narrative direction is appropriate."
      ]
    }
  ],
  "stability": "low | medium | high",
  "eyebrowRaiseRisk": "low | medium | high",
  "extractedAssumptions": [
    "Every inference made that the passage did not state explicitly. Tag real-world claims as '[Historical]' or '(approximation)'."
  ],
  "missingInfoQuestions": [
    "A gentle, curious question about absent context that would meaningfully change the analysis. Never accusatory."
  ]
}

### Field Definitions:
- **stability**: overall internal consistency (high = few or no logic gaps).
- **eyebrowRaiseRisk**: likelihood an informed reader pauses and questions the passage (high = very likely).
- **riskLevel per tension**: severity of threat to immersion if left unaddressed.

### Strict Constraints:
- Surface exactly 3–5 tension points — the most impactful only. Do not pad with trivial observations.
- Each tension: exactly 2–3 fix suggestions.
- missingInfoQuestions: 0–4 items, phrased with curiosity and warmth. Omit the array entry entirely if not needed.
- extractedAssumptions: list every silent inference. Never omit.
- Do NOT fabricate statistics or historical facts — mark uncertain claims as "(approximation)".
- Output ONLY the JSON object. No prose before or after it.`;
}

// ─── System prompt ────────────────────────────────────────────────────────────
const SYSTEM =
  'You are LoreKit, a perceptive and slightly mischievous assistant cat who specialises in narrative and worldbuilding plausibility analysis. ' +
  'You read passages the way a sharp-eyed editor and a cultural historian would — catching what strains credibility before a reader does. ' +
  'You are warm, constructive, and precise. You never dismiss creative choices; you illuminate their risks and offer paths forward. ' +
  'You respond ONLY with a valid JSON object — no surrounding prose, no markdown code fences.';

// ─── Handler ──────────────────────────────────────────────────────────────────
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const guard = requireApiKey(env.OPENAI_API_KEY);
  if (guard) return guard;

  const ip = getClientIp(request);
  const rl = checkRateLimit(ip, { windowMs: 60_000, maxRequests: 15 });
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError('Request body must be valid JSON.', 400);
  }

  const err = validate(raw);
  if (err) return jsonError(err, 400);

  const body = sanitise(raw as LoreCheckRequest);

  let report: unknown;
  try {
    report = await callLLM(env.OPENAI_API_KEY, {
      system:      SYSTEM,
      user:        buildPrompt(body),
      jsonSchema:  {}, // enables JSON mode; shape enforced by prompt
      model:       'gpt-4o',
      temperature: 0.5,
      maxTokens:   1_800,
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
