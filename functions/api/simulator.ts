/**
 * POST /api/simulator
 *
 * Free / viral endpoint. Accepts a name + optional vibe, selects the best-fit
 * world from a hardcoded list of 12 presets, and returns a short character
 * story card as structured JSON.
 *
 * Token budget is kept deliberately small — gpt-5-mini, max 420 tokens.
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
  'Your writing is mythic, poetic, and precise — like the opening page of a fantasy novel. ' +
  'You make every visitor feel chosen. ' +
  'You respond ONLY with a valid JSON object — no surrounding prose, no markdown fences.';

function buildPromptEN(name: string, vibe?: Vibe): string {
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

// ─── Korean prompt ────────────────────────────────────────────────────────────
const SYSTEM_KO =
  '당신은 로어킷(LoreKit)입니다. 방문자들을 이차원 세계에 배정하고 그들의 캐릭터 카드를 작성하는 마법의 고양이 조수입니다. ' +
  '당신의 글쓰기는 신화적이고, 시적이며, 정확합니다 — 판타지 소설의 첫 페이지처럼. ' +
  '모든 방문자를 선택받은 느낌이 들게 합니다. ' +
  '반드시 유효한 JSON 객체만 응답합니다 — 앞뒤 산문이나 마크다운 펜스 없이.';

function buildPromptKO(name: string, vibe?: Vibe): string {
  const vibeMap: Record<string, string> = {
    dark:      '어두운 (tense/ominous 톤)',
    cozy:      '아늑한 (warm/gentle 톤)',
    tragic:    '비극적인 (elegiac/bittersweet 톤)',
    whimsical: '환상적인 (playful-eerie 톤)',
  };
  const vibeNote = vibe
    ? `방문자의 분위기는 **${vibe}** (${vibeMap[vibe]})입니다 — "${vibe}"로 태그된 세계를 우선하고 카드의 톤도 그에 맞춰주세요.`
    : '분위기가 선택되지 않았습니다 — 이름만으로 세계 선택을 안내하고 방문자를 놀라게 해주세요.';

  return `\
**${name}**이라는 방문자가 LoreKit 포털을 통해 들어왔습니다.
${vibeNote}

### 이용 가능한 세계 (영어 이름을 정확히 그대로 사용해야 함):
${worldList()}

위 목록에서 가장 적합한 세계 하나를 선택하세요. 그런 다음 캐릭터 카드를 작성하세요.

다음 구조에 정확히 맞는 단일 JSON 객체를 반환하세요 (원시 JSON만, 마크다운 펜스 없음).
roleArchetype, storyHookLines, fateQuote는 한국어로 작성하세요.

{
  "name": "${name}",
  "assignedWorld": "목록에 있는 정확한 세계 이름 — 영어 그대로 복사 (번역 금지)",
  "roleArchetype": "이 세계에 특화된 구체적이고 인상적인 직함 (한국어). 일반적인 클래스명 금지. 예: '기록되지 않은 지도의 제도사', '마지막 난로의 불씨 수호자', '빌린 시간의 채권 추심인'",
  "storyHookLines": [
    "1번 줄: 도착 장면 설정 — 영화적이고 즉각적이며 구체적으로 (한국어)",
    "2번 줄: 이 세계에서 예상치 못하게 느끼거나 알아채는 무언가 (한국어)",
    "3번 줄: 그들을 다르게 만드는 선물 또는 긴장감 소개 (한국어)",
    "4번 줄: 직면해야 할 것, 선택해야 할 것, 또는 희생해야 할 것에 대한 암시 (한국어)",
    "5번 줄 (선택): 미스터리를 깊게 하거나 판돈을 한 단계 높이기 (한국어)",
    "6번 줄 (선택): 여정이 시작되기 전의 조용한 의미의 순간 (한국어)"
  ],
  "fateQuote": "고어체의 단 한 문장 — 예언, 경고, 또는 약속. 기억에 남도록. 클리셰 금지 (한국어)"
}

제약:
- assignedWorld: 목록의 영어 이름을 그대로 사용. 번역하거나 바꿔 쓰지 마세요.
- roleArchetype: 생생하고 세계 특화적. "전사", "마법사", "도적", "영웅" 같은 단어 금지.
- storyHookLines: 4–6개 항목. 각각 한 문장. 서정적이지만 현실적으로.
- fateQuote: 정확히 1문장.
- JSON 객체만 출력하세요. 앞뒤 산문 없음.`;
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
      model:       'gpt-5-mini',
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
