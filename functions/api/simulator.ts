/**
 * POST /api/simulator
 *
 * Free / viral endpoint. Accepts a name + optional vibe, selects the best-fit
 * world from a hardcoded list of 12 presets, and returns a short character
 * story card as structured JSON.
 *
 * Token budget is kept deliberately small — gpt-4o-mini, max 420 tokens.
 *
 * Input
 * ─────
 * { name: string, vibe?: "dark"|"cozy"|"tragic"|"whimsical" }
 *
 * Output (200)
 * ────────────
 * {
 *   name:           string,
 *   assignedWorld:  string,
 *   roleArchetype:  string,
 *   storyHookLines: string[],   // 4–6 items
 *   fateQuote:      string,
 * }
 */

import type { Env } from '../_shared/env';
import {
  jsonOk, jsonError, corsPreflightResponse,
  requireApiKey, rateLimitResponse,
} from '../_shared/response';
import { callLLM, LLMError } from '../lib/openai';
import { checkRateLimit, getClientIp } from '../lib/ratelimit';

// ─── Preset worlds ────────────────────────────────────────────────────────────
type Vibe = 'dark' | 'cozy' | 'tragic' | 'whimsical';

interface PresetWorld {
  name:    string;
  tagline: string;
  vibes:   Vibe[];
}

/**
 * 12 preset worlds. Each carries 1–2 vibe tags so the model can match a
 * visitor's stated vibe to an appropriate setting.
 */
const WORLDS: readonly PresetWorld[] = [
  {
    name:    'The Hollow Crown',
    tagline: 'A kingdom whose king died and left only his expectations behind.',
    vibes:   ['dark', 'tragic'],
  },
  {
    name:    'The Neon Depths',
    tagline: 'A bioluminescent city beneath a toxic sea where survival is commerce.',
    vibes:   ['dark'],
  },
  {
    name:    'The Ashborne Wastes',
    tagline: 'A post-collapse desert civilisation where memory is contraband.',
    vibes:   ['dark', 'tragic'],
  },
  {
    name:    'The Saltwater Sanctum',
    tagline: 'A hidden island community of retired spellweavers who swore to rest.',
    vibes:   ['cozy'],
  },
  {
    name:    'The Verdant Labyrinth',
    tagline: 'A living forest-maze that rearranges itself to guide — or to mislead.',
    vibes:   ['cozy', 'whimsical'],
  },
  {
    name:    'The Moonlit Carnival',
    tagline: 'An eternal travelling carnival that exists slightly outside of time.',
    vibes:   ['whimsical', 'cozy'],
  },
  {
    name:    'The Emberfall Kingdom',
    tagline: 'A realm where the sun set permanently and warmth is slowly running out.',
    vibes:   ['tragic', 'cozy'],
  },
  {
    name:    'The Drift Between Stars',
    tagline: 'A nomadic fleet culture in deep space where everyone is the last of something.',
    vibes:   ['tragic', 'whimsical'],
  },
  {
    name:    'The Forgotten Archives',
    tagline: 'An interdimensional library where lost memories and unwritten books go to die.',
    vibes:   ['tragic', 'dark'],
  },
  {
    name:    'The Gossamer Veil',
    tagline: 'The shimmering border between dreams and waking, inhabited by both.',
    vibes:   ['whimsical'],
  },
  {
    name:    'The Clockwork Wilds',
    tagline: 'A forest of mechanical animals and organic machines in fragile coexistence.',
    vibes:   ['whimsical', 'tragic'],
  },
  {
    name:    'The Upside Market',
    tagline: 'A floating bazaar where impossible goods are bought, sold, and occasionally stolen back.',
    vibes:   ['whimsical', 'cozy'],
  },
];

// ─── Input / output types ─────────────────────────────────────────────────────
const VALID_VIBES = new Set<string>(['dark', 'cozy', 'tragic', 'whimsical']);

interface SimulatorRequest {
  name:  string;
  vibe?: Vibe;
}

interface SimulatorCard {
  name:           string;
  assignedWorld:  string;
  roleArchetype:  string;
  storyHookLines: string[];
  fateQuote:      string;
}

// ─── Validation ───────────────────────────────────────────────────────────────
function validate(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) {
    return 'Request body must be a JSON object.';
  }
  const b = body as Record<string, unknown>;
  const name = b['name'];

  if (typeof name !== 'string' || name.trim().length === 0) {
    return 'name is required.';
  }
  if (name.trim().length > 60) {
    return 'name must be 60 characters or fewer.';
  }
  if (b['vibe'] !== undefined && !VALID_VIBES.has(b['vibe'] as string)) {
    return 'vibe must be "dark", "cozy", "tragic", or "whimsical" if provided.';
  }
  return null;
}

// ─── Runtime shape guard ──────────────────────────────────────────────────────
function isValidCard(obj: unknown): obj is SimulatorCard {
  if (typeof obj !== 'object' || obj === null) return false;
  const c = obj as Record<string, unknown>;
  return (
    typeof c['name']          === 'string' &&
    typeof c['assignedWorld'] === 'string' &&
    typeof c['roleArchetype'] === 'string' &&
    Array.isArray(c['storyHookLines']) &&
    (c['storyHookLines'] as unknown[]).length >= 4 &&
    typeof c['fateQuote']     === 'string'
  );
}

// ─── Prompt builder ───────────────────────────────────────────────────────────
function worldList(): string {
  return WORLDS
    .map((w, i) => `${i + 1}. **${w.name}** [${w.vibes.join(', ')}] — ${w.tagline}`)
    .join('\n');
}

function buildPrompt(name: string, vibe?: Vibe): string {
  const vibeNote = vibe
    ? `Their vibe is **${vibe}** — weight your world choice and the card's tone toward worlds tagged "${vibe}".`
    : 'No vibe was chosen — let the name alone guide the world choice and surprise them.';

  return `\
A visitor named **${name}** has stepped through the LoreKit portal.
${vibeNote}

### Available Worlds:
${worldList()}

Pick the single best-fit world from the list above. Then write their character card.

Return a single JSON object with EXACTLY this structure (raw JSON only, no markdown fences):

{
  "name": "${name}",
  "assignedWorld": "The exact world name from the list — copied verbatim",
  "roleArchetype": "A specific, evocative title unique to this world. Never a generic class. Examples: 'Cartographer of Unwritten Maps', 'Ember-Keeper of the Last Hearth', 'Debt-Collector of Borrowed Hours'.",
  "storyHookLines": [
    "Line 1: set the scene of their arrival — cinematic, immediate, specific.",
    "Line 2: reveal something unexpected they notice or feel in this world.",
    "Line 3: introduce the gift or tension that marks them as different.",
    "Line 4: hint at what they must face, choose, or sacrifice.",
    "Line 5 (optional): deepen the mystery or raise the stakes one notch.",
    "Line 6 (optional): a beat of quiet significance before the journey begins."
  ],
  "fateQuote": "One archaic-register sentence — a prophecy, a warning, or a promise. Memorable. No clichés."
}

CONSTRAINTS:
- assignedWorld: verbatim from the list. No paraphrasing.
- roleArchetype: vivid and world-specific. Never "warrior", "mage", "rogue", "hero".
- storyHookLines: 4–6 items. One sentence each. Lyrical but grounded.
- fateQuote: exactly 1 sentence.
- Tone matches the vibe: dark → tense/ominous; cozy → warm/gentle; tragic → elegiac/bittersweet; whimsical → playful-eerie.
- Output ONLY the JSON object. No prose before or after.`;
}

// ─── System prompt ────────────────────────────────────────────────────────────
const SYSTEM =
  'You are LoreKit, a magical assistant cat who assigns wanderers to interdimensional worlds and writes their character cards. ' +
  'Your writing is mythic, poetic, and precise — like the opening page of a fantasy novel. ' +
  'You make every visitor feel chosen. ' +
  'You respond ONLY with a valid JSON object — no surrounding prose, no markdown fences.';

// ─── Handler ──────────────────────────────────────────────────────────────────
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const guard = requireApiKey(env.OPENAI_API_KEY);
  if (guard) return guard;

  const ip = getClientIp(request);
  // Generous limit — free/viral endpoint
  const rl = checkRateLimit(ip, { windowMs: 60_000, maxRequests: 20 });
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError('Request body must be valid JSON.', 400);
  }

  const err = validate(raw);
  if (err) return jsonError(err, 400);

  const b    = raw as Record<string, unknown>;
  const name = (b['name'] as string).trim().slice(0, 60);
  const vibe = b['vibe'] as Vibe | undefined;

  let card: unknown;
  try {
    card = await callLLM(env.OPENAI_API_KEY, {
      system:      SYSTEM,
      user:        buildPrompt(name, vibe),
      jsonSchema:  {}, // enables JSON mode; shape enforced by prompt
      model:       'gpt-4o-mini', // intentionally lightweight — free endpoint
      temperature: 0.88,
      maxTokens:   420,
    });
  } catch (e) {
    if (e instanceof LLMError) {
      return jsonError('AI service returned an error.', e.status, e.message);
    }
    return jsonError('Unexpected server error.', 500, String(e));
  }

  if (!isValidCard(card)) {
    return jsonError(
      'The AI returned an unexpected response shape. Please try again.',
      502,
    );
  }

  return jsonOk(card);
};

export const onRequestOptions: PagesFunction = () =>
  Promise.resolve(corsPreflightResponse('POST, OPTIONS'));
