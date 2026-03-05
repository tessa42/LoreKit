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
 * { name: string, vibe?: "dark"|"cozy"|"tragic"|"whimsical", lang?: 'en-US'|'ko-KR' }
 *
 * Output (200)
 * ────────────
 * {
 *   name:           string,
 *   assignedWorld:  string,    // always the English world name, verbatim
 *   roleArchetype:  string,
 *   storyHookLines: string[],  // 4–6 items
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
import { getLang, isKorean } from '../_shared/i18n';

// ─── Preset worlds ────────────────────────────────────────────────────────────
type Vibe = 'dark' | 'cozy' | 'tragic' | 'whimsical';

interface PresetWorld {
  name:    string;
  tagline: string;
  vibes:   Vibe[];
}

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

// ─── Shared: world list (always in English — verbatim matching required) ──────
function worldList(): string {
  return WORLDS
    .map((w, i) => `${i + 1}. **${w.name}** [${w.vibes.join(', ')}] — ${w.tagline}`)
    .join('\n');
}

// ─── English prompt ───────────────────────────────────────────────────────────
const SYSTEM_EN =
  'You are LoreKit, a magical assistant cat who assigns wanderers to interdimensional worlds and writes their character cards. ' +
  'Your writing is mythic, poetic, and precise. ' +
  'You respond ONLY with a valid JSON object — no surrounding prose, no markdown fences.';

function buildPromptEN(name: string, vibe?: Vibe): string {
  const vibeNote = vibe
    ? `Vibe: **${vibe}** — favour worlds tagged "${vibe}" and match the card's tone.`
    : 'No vibe — let the name guide the world choice.';

  return `\
Visitor: **${name}**. ${vibeNote}

### Available Worlds:
${worldList()}

Pick the best-fit world and write the character card as a JSON object (raw JSON only, no markdown fences):

{
  "name": "${name}",
  "assignedWorld": "Exact world name from the list — verbatim",
  "roleArchetype": "Specific, evocative title unique to this world. Never a generic class (warrior/mage/rogue/hero).",
  "storyHookLines": [
    "Line 1: cinematic arrival — immediate and specific.",
    "Line 2: something unexpected they notice or feel.",
    "Line 3: the gift or tension that marks them as different.",
    "Line 4: what they must face, choose, or sacrifice.",
    "Line 5 (optional): raised stakes or deepened mystery.",
    "Line 6 (optional): a beat of quiet significance."
  ],
  "fateQuote": "One archaic-register sentence — prophecy, warning, or promise. Memorable, no clichés."
}

assignedWorld: verbatim. storyHookLines: 4–6 items, one sentence each, lyrical. fateQuote: exactly 1 sentence. Tone: dark→ominous, cozy→warm, tragic→elegiac, whimsical→playful-eerie. Output ONLY the JSON object.`;
}

// ─── Korean prompt ────────────────────────────────────────────────────────────
const SYSTEM_KO =
  '당신은 로어킷(LoreKit)입니다. 방문자들을 이차원 세계에 배정하고 캐릭터 카드를 작성하는 마법의 고양이 조수입니다. ' +
  '글쓰기는 신화적이고 시적이며 정확합니다. ' +
  '반드시 유효한 JSON 객체만 응답합니다 — 앞뒤 산문이나 마크다운 펜스 없이.';

function buildPromptKO(name: string, vibe?: Vibe): string {
  const vibeMap: Record<string, string> = {
    dark: '어두운', cozy: '아늑한', tragic: '비극적인', whimsical: '환상적인',
  };
  const vibeNote = vibe
    ? `분위기: **${vibe}** (${vibeMap[vibe]}) — "${vibe}" 태그 세계를 우선하고 카드 톤도 맞춰주세요.`
    : '분위기 미선택 — 이름만으로 세계를 안내하세요.';

  return `\
방문자: **${name}**. ${vibeNote}

### 이용 가능한 세계 (영어 이름 그대로 사용):
${worldList()}

가장 적합한 세계를 선택하고 캐릭터 카드를 JSON으로 반환하세요 (원시 JSON만, 마크다운 펜스 없음). roleArchetype, storyHookLines, fateQuote는 한국어로, assignedWorld는 영어 그대로:

{
  "name": "${name}",
  "assignedWorld": "목록의 영어 이름 그대로 — 번역 금지",
  "roleArchetype": "이 세계 특화 직함 (한국어). 전사·마법사·도적·영웅 같은 일반 클래스 금지.",
  "storyHookLines": [
    "1번: 영화적 도착 장면 (한국어)",
    "2번: 예상치 못한 발견 (한국어)",
    "3번: 그들을 다르게 만드는 선물 또는 긴장감 (한국어)",
    "4번: 직면해야 할 것 (한국어)",
    "5번(선택): 판돈 상승 (한국어)",
    "6번(선택): 조용한 의미의 순간 (한국어)"
  ],
  "fateQuote": "고어체 1문장 — 예언, 경고, 또는 약속 (한국어)"
}

assignedWorld: 영어 그대로. storyHookLines: 4–6개, 각 1문장, 서정적. fateQuote: 정확히 1문장. JSON 객체만 출력하세요.`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const guard = requireApiKey(env.OPENAI_API_KEY);
  if (guard) return guard;

  const ip = getClientIp(request);
  const rl = checkRateLimit(ip, { windowMs: 60_000, maxRequests: 20 });
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError('Request body must be valid JSON.', 400);
  }

  const lang = getLang(request, raw as Record<string, unknown>);

  const err = validate(raw);
  if (err) return jsonError(err, 400);

  const b    = raw as Record<string, unknown>;
  const name = (b['name'] as string).trim().slice(0, 60);
  const vibe = b['vibe'] as Vibe | undefined;

  const ko = isKorean(lang);

  let card: unknown;
  try {
    card = await callLLM(env.OPENAI_API_KEY, {
      system:      ko ? SYSTEM_KO : SYSTEM_EN,
      user:        ko ? buildPromptKO(name, vibe) : buildPromptEN(name, vibe),
      jsonSchema:  {},
      model:           'gpt-5-mini',
      maxTokens:       1_200,
      reasoningEffort: 'low',
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
