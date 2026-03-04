/**
 * POST /api/lorecraft
 *
 * Accepts a structured worldbuilding form and returns a deep worldbuilding
 * research dossier as a typed JSON object. Each section contains scholarly
 * prose paragraphs describing the world as if it exists — not a validation
 * or critique, not advice to the creator.
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
 *     deviations?: Record<string, string>,
 *     motif?: string,
 *   },
 *   extraContext?: string,
 *   lang?: 'en-US' | 'ko-KR',
 * }
 *
 * Output (200)
 * ────────────
 * {
 *   title: string,
 *   overview: string,
 *   sections: Array<{ id, title, paragraphs: string[] }>,
 *   sourcesAndAssumptions?: string[],
 *   uncertaintyNotes?: string[],
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
import { spendSeeds, refundSeeds } from '../_shared/seeds';

const SEEDS_COST = 4;

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
}

interface LoreCraftReport {
  title:                  string;
  overview:               string;
  sections:               ReportSection[];
  sourcesAndAssumptions?: string[];
  uncertaintyNotes?:      string[];
}

// ─── Validation ───────────────────────────────────────────────────────────────
const VALID_TYPES = new Set<WorldType>(['reality', 'fiction', 'hybrid']);

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
    (r['sections'] as unknown[]).length >= 4
  );
}

// ─── World input block (shared) ───────────────────────────────────────────────
function worldBlock(body: LoreCraftRequest): string {
  const lines: string[] = [];
  const { worldType, fields } = body;

  if (worldType === 'reality') {
    const f = fields as RealityFields;
    lines.push(
      '## World Specification: Historical Reality',
      `- Time Period: ${f.timePeriod}`,
      `- Location / Region: ${f.location}`,
    );
  } else if (worldType === 'fiction') {
    const f = fields as FictionFields;
    lines.push('## World Specification: Fictional World', `- Genre: ${f.genre}`);
    if (f.techLevel)            lines.push(`- Technology Level: ${f.techLevel}`);
    if (f.environmentCondition) lines.push(`- Environmental Conditions: ${f.environmentCondition}`);
  } else {
    const f = fields as HybridFields;
    lines.push(
      '## World Specification: Historical-Speculative Hybrid',
      '',
      '### Historical Foundation:',
      `- Base Time Period: ${f.baseTimePeriod}`,
      `- Base Location: ${f.baseLocation}`,
      '',
      '### Speculative Divergence Layer:',
      `- Genre / Divergence Character: ${f.genreLayer}`,
    );
    if (f.deviations && Object.keys(f.deviations).length > 0) {
      lines.push('- Divergence Domains and Magnitude:');
      for (const [domain, severity] of Object.entries(f.deviations)) {
        lines.push(`  - ${domain}: ${severity}`);
      }
    }
    if (f.motif) lines.push(`- Central Motif / Thematic Core: ${f.motif}`);
  }

  if (body.extraContext) {
    lines.push('', '### Additional Research Notes:', body.extraContext);
  }

  return lines.join('\n');
}

// ─── Detect whether supernatural/fantasy elements are present ─────────────────
function hasFantasyElements(body: LoreCraftRequest): boolean {
  if (body.worldType === 'fiction') return true;
  if (body.worldType === 'hybrid') {
    const f = body.fields as HybridFields;
    const devKeys = Object.keys(f.deviations ?? {});
    if (devKeys.includes('supernatural')) return true;
    const genre = (f.genreLayer ?? '').toLowerCase();
    const motif = (f.motif ?? '').toLowerCase();
    const fantasyTerms = ['fant', 'magic', 'myth', 'supernatural', 'spirit', 'god', 'divine', 'cosmic', 'horror', 'gothic'];
    return fantasyTerms.some(t => genre.includes(t) || motif.includes(t));
  }
  return false;
}

// ─── English system + prompt ───────────────────────────────────────────────────
const SYSTEM_EN =
  'You are a scholarly research analyst specializing in cultural geography, social history, and speculative world studies. ' +
  'You produce authoritative research dossiers that describe worlds — real, fictional, or hybrid — with academic depth and precision. ' +
  'Write in continuous prose: dense, confident, third-person analytical paragraphs in the present tense. ' +
  'Describe the world as if it exists and has been studied. Do not reference "the author", "the story", "the creator", or "the fiction". ' +
  'If supernatural or fantastical elements are present, treat them as internal reality and analyze their social, spatial, and material consequences as a scholar would. ' +
  'Never evaluate, advise, or critique. Never use words such as "fragile", "inconsistency", "verdict", "rating", "you should", "consider fixing", "strength", or "weakness". ' +
  'Avoid bullet points and tables entirely. Write in connected prose paragraphs only. ' +
  'Output only a valid JSON object — no surrounding prose, no markdown code fences.';

function buildPromptEN(body: LoreCraftRequest): string {
  const mythSection = hasFantasyElements(body) ? `,
    {
      "id": "myth-supernatural-system",
      "title": "Cosmology and Supernatural Systems",
      "paragraphs": [
        "Describe the cosmological order and how metaphysical or supernatural forces are understood to operate within this world. Two or more full paragraphs.",
        "Describe how these forces manifest materially: their institutional expressions, spatial presences, ritual economies, and consequences for social organization."
      ]
    }` : '';

  return `\
${worldBlock(body)}

---

Produce a deep worldbuilding research dossier for the world described above.
Output a single JSON object matching EXACTLY this schema (raw JSON only, no markdown fences):

{
  "title": "An evocative, scholarly dossier title — 4–8 words, naming the world, civilisation, or epoch under study",
  "overview": "2–4 dense prose paragraphs synthesizing the world's spatial situation, historical moment, dominant social forces, environmental character, and defining atmosphere. Present tense, third person, scholarly register.",
  "sections": [
    {
      "id": "spatial-morphology",
      "title": "Spatial Morphology and Settlement Patterns",
      "paragraphs": [
        "Paragraph 1 (4–6 sentences): Describe macro-geography — territorial extent, topographic character, dominant landscape types, relationship between land and population distribution.",
        "Paragraph 2 (4–6 sentences): Describe micro-spatial logic — how settlements are organized, how people orient themselves, how space is divided between public, private, sacred, and productive uses."
      ]
    },
    {
      "id": "climate-environment",
      "title": "Climate, Ecology, and Environmental Forces",
      "paragraphs": [
        "Paragraph 1 (4–6 sentences): Describe prevailing climate systems, seasonal rhythms, ecological zones, and how the environment conditions agriculture, movement, and shelter.",
        "Paragraph 2 (4–6 sentences): Describe resource distribution, environmental pressures — scarcity or abundance — and how the natural world figures in the collective imagination and cosmology."
      ]
    },
    {
      "id": "built-environment-architecture",
      "title": "Built Environment and Architecture",
      "paragraphs": [
        "Paragraph 1 (4–6 sentences): Describe the character of settlements — their scale, materials, density, and spatial organization. What do structures communicate about power, hierarchy, and communal life?",
        "Paragraph 2 (4–6 sentences): Describe vernacular versus monumental building traditions, the spatial grammar of public space, and how the built world mediates between social order and natural environment."
      ]
    },
    {
      "id": "economy-industry",
      "title": "Economy, Production, and Trade",
      "paragraphs": [
        "Paragraph 1 (4–6 sentences): Describe the dominant mode of production — agricultural, extractive, industrial, or otherwise — its scale, geography, and labor organization.",
        "Paragraph 2 (4–6 sentences): Describe trade flows, market structures, currency or exchange systems, and how economic activity structures space and social relations."
      ]
    },
    {
      "id": "demographics-social-hierarchy",
      "title": "Demographics and Social Hierarchy",
      "paragraphs": [
        "Paragraph 1 (4–6 sentences): Describe population composition, settlement density, demographic dynamics, and patterns of mobility or migration.",
        "Paragraph 2 (4–6 sentences): Describe the structure of social hierarchy — its organizing axes (class, caste, lineage, ability, species), mechanisms of reproduction, and characteristic expressions in everyday life."
      ]
    },
    {
      "id": "culture-norms-collective-psychology",
      "title": "Culture, Norms, and Collective Psychology",
      "paragraphs": [
        "Paragraph 1 (4–6 sentences): Describe dominant value systems, cultural practices, ritual life, aesthetic sensibilities, and the role of art, story, or performance in social reproduction.",
        "Paragraph 2 (4–6 sentences): Describe the collective emotional register — what this society fears, desires, celebrates, and suppresses; how individual psychology is shaped by collective life."
      ]
    },
    {
      "id": "infrastructure-technology-everyday-life",
      "title": "Infrastructure, Technology, and Everyday Life",
      "paragraphs": [
        "Paragraph 1 (4–6 sentences): Describe the technological substrate of the world — energy sources, communication systems, transport networks, food and water infrastructure.",
        "Paragraph 2 (4–6 sentences): Describe the texture of ordinary daily life: what people do, how they move, what they consume, what rhythms and institutions structure their days."
      ]
    },
    {
      "id": "history-transition",
      "title": "Historical Formation and Ongoing Transitions",
      "paragraphs": [
        "Paragraph 1 (4–6 sentences): Describe the world's historical trajectory — the formative events, ruptures, migrations, and continuities that produced its present condition.",
        "Paragraph 2 (4–6 sentences): Describe current transformations, structural pressures, and the historical forces — economic, environmental, political, cultural — that are actively reshaping the world at the moment of study."
      ]
    }${mythSection}
  ],
  "sourcesAndAssumptions": [
    "List every inference or assumption made to complete the dossier — geographic, historical, social. Tag real-world claims as [Historical] where applicable. Be exhaustive."
  ],
  "uncertaintyNotes": [
    "List any aspects of the world where the input was ambiguous or insufficient for a confident analysis. Describe what was assumed in each case."
  ]
}

STRICT CONSTRAINTS:
- Each section must have at least 2 paragraphs. Each paragraph must be substantive (minimum 4 sentences).
- Write entirely in scholarly, analytical, present-tense prose. Never address the reader.
- Zero evaluation language: no "fragile", "inconsistent", "strength", "weakness", "verdict", "rating", "fix", "consider", "you should", "the author should".
- Zero reference to LoreKit, LoreCheck, or any external tool.
- Output ONLY the JSON object — no text before or after.`;
}

// ─── Korean system + prompt ────────────────────────────────────────────────────
const SYSTEM_KO =
  '당신은 문화지리학, 사회사, 사변적 세계 연구를 전문으로 하는 학술 연구 분석가입니다. ' +
  '실재하는, 허구적인, 또는 혼합된 세계를 학문적 깊이와 정밀함으로 기술하는 권위 있는 연구 도서를 작성합니다. ' +
  '연속된 산문으로 작성합니다 — 밀도 있고 자신감 있는 3인칭 분석적 단락, 현재 시제. ' +
  '세계를 실제로 존재하고 연구된 대상처럼 기술합니다. "작가", "이야기", "창작자", "허구"를 절대 언급하지 않습니다. ' +
  '초자연적이거나 환상적 요소가 있다면 내적 현실로 취급하며, 학자처럼 사회적·공간적·물질적 결과를 분석합니다. ' +
  '절대 평가하거나 조언하거나 비판하지 않습니다. "취약함", "불일치", "평결", "평점", "해야 한다", "고려해야", "강점", "약점" 같은 단어를 사용하지 않습니다. ' +
  '글머리표와 표를 완전히 배제합니다. 오직 연결된 산문 단락으로만 작성합니다. ' +
  '유효한 JSON 객체만 출력합니다 — 앞뒤 산문이나 마크다운 코드 펜스 없이.';

function buildPromptKO(body: LoreCraftRequest): string {
  const mythSection = hasFantasyElements(body) ? `,
    {
      "id": "myth-supernatural-system",
      "title": "우주론과 초자연 체계",
      "paragraphs": [
        "이 세계에서 형이상학적 또는 초자연적 힘이 어떻게 작동하는 것으로 이해되는지 우주론적 질서를 기술하는 2개 이상의 완전한 단락.",
        "이러한 힘이 물질적으로 어떻게 나타나는지 — 제도적 표현, 공간적 현존, 의례적 경제, 사회 조직에 대한 결과."
      ]
    }` : '';

  return `\
${worldBlock(body)}

---

위에 기술된 세계에 대한 심층 세계관 연구 도서를 작성하세요.
아래 스키마에 정확히 일치하는 단일 JSON 객체를 출력하세요 (원시 JSON만, 마크다운 펜스 없음).
모든 산문 내용(title, overview, paragraphs, sourcesAndAssumptions, uncertaintyNotes)은 자연스러운 한국어 학술 문체로 작성하세요.
section의 "id" 값은 반드시 아래 명시된 영어 그대로 유지하세요.

{
  "title": "연구 대상 세계, 문명, 또는 시대를 명명하는 4–8단어의 인상적이고 학술적인 도서 제목 (한국어)",
  "overview": "세계의 공간적 상황, 역사적 국면, 지배적 사회 세력, 환경적 특성, 그리고 고유한 분위기를 종합하는 2–4개의 밀도 있는 산문 단락. 현재 시제, 3인칭, 학술적 문체.",
  "sections": [
    {
      "id": "spatial-morphology",
      "title": "공간 형태와 정주 패턴",
      "paragraphs": [
        "단락 1 (4–6문장): 거시 지리학 — 영토적 범위, 지형적 특성, 지배적 경관 유형, 토지와 인구 분포의 관계.",
        "단락 2 (4–6문장): 미시 공간 논리 — 정주지 조직, 방향 감각 체계, 공공·사적·신성·생산 공간의 구분."
      ]
    },
    {
      "id": "climate-environment",
      "title": "기후, 생태, 환경적 힘",
      "paragraphs": [
        "단락 1 (4–6문장): 지배적 기후 체계, 계절적 리듬, 생태 지대, 그리고 환경이 농업·이동·주거를 어떻게 조건 짓는가.",
        "단락 2 (4–6문장): 자원 분포, 환경적 압력 — 결핍 또는 풍요 — 그리고 자연 세계가 집단적 상상력과 우주론에서 차지하는 위치."
      ]
    },
    {
      "id": "built-environment-architecture",
      "title": "건조 환경과 건축",
      "paragraphs": [
        "단락 1 (4–6문장): 정주지의 특성 — 규모, 재료, 밀도, 공간 조직. 구조물이 권력, 위계, 공동체적 삶에 대해 무엇을 말하는가.",
        "단락 2 (4–6문장): 토착적 건축과 기념비적 건축 전통, 공공 공간의 공간 문법, 건조 세계가 사회 질서와 자연 환경을 매개하는 방식."
      ]
    },
    {
      "id": "economy-industry",
      "title": "경제, 생산, 교역",
      "paragraphs": [
        "단락 1 (4–6문장): 지배적 생산 양식 — 농업, 추출, 산업, 또는 기타 — 그 규모, 지리, 노동 조직.",
        "단락 2 (4–6문장): 교역 흐름, 시장 구조, 화폐 또는 교환 체계, 경제 활동이 공간과 사회적 관계를 구조화하는 방식."
      ]
    },
    {
      "id": "demographics-social-hierarchy",
      "title": "인구와 사회 위계",
      "paragraphs": [
        "단락 1 (4–6문장): 인구 구성, 정주 밀도, 인구 동태, 이동 또는 이주 패턴.",
        "단락 2 (4–6문장): 사회 위계의 구조 — 조직 축(계급, 카스트, 혈통, 능력, 종족), 재생산 메커니즘, 일상생활에서의 특징적 표현."
      ]
    },
    {
      "id": "culture-norms-collective-psychology",
      "title": "문화, 규범, 집단 심리",
      "paragraphs": [
        "단락 1 (4–6문장): 지배적 가치 체계, 문화적 실천, 의례 생활, 미적 감수성, 사회적 재생산에서 예술·이야기·공연의 역할.",
        "단락 2 (4–6문장): 집단적 정서적 레지스터 — 이 사회가 두려워하고, 욕망하고, 기념하고, 억압하는 것; 집단적 삶이 개인 심리를 형성하는 방식."
      ]
    },
    {
      "id": "infrastructure-technology-everyday-life",
      "title": "인프라, 기술, 일상생활",
      "paragraphs": [
        "단락 1 (4–6문장): 세계의 기술적 기반 — 에너지 원천, 통신 체계, 교통 네트워크, 식량 및 수자원 인프라.",
        "단락 2 (4–6문장): 평범한 일상의 질감: 사람들이 하는 일, 이동 방식, 소비하는 것, 그들의 하루를 구조화하는 리듬과 제도."
      ]
    },
    {
      "id": "history-transition",
      "title": "역사적 형성과 진행 중인 전환",
      "paragraphs": [
        "단락 1 (4–6문장): 세계의 역사적 궤적 — 현재의 상태를 만들어 낸 형성적 사건, 단절, 이주, 연속성.",
        "단락 2 (4–6문장): 현재의 변환, 구조적 압력, 그리고 연구 시점에 세계를 적극적으로 재형성하고 있는 역사적 힘 — 경제적, 환경적, 정치적, 문화적."
      ]
    }${mythSection}
  ],
  "sourcesAndAssumptions": [
    "도서를 완성하기 위해 이루어진 모든 추론 또는 가정 — 지리적, 역사적, 사회적. 실제 역사적 주장에는 [Historical] 태그 사용. 빠짐없이 나열할 것."
  ],
  "uncertaintyNotes": [
    "입력이 모호하거나 자신 있는 분석에 불충분했던 세계의 측면을 나열하고, 각 경우 무엇을 가정했는지 기술하세요."
  ]
}

엄격한 제약:
- 각 섹션은 최소 2개의 단락을 포함해야 합니다. 각 단락은 실질적이어야 합니다 (최소 4문장).
- 완전히 학술적이고 분석적이며 현재 시제의 산문으로 작성하세요. 절대로 독자를 직접 언급하지 마세요.
- 평가적 언어 금지: "취약함", "불일치", "강점", "약점", "평결", "평점", "수정", "고려", "해야 한다", "작가가 해야".
- LoreKit, LoreCheck, 또는 외부 도구에 대한 언급 금지.
- JSON 객체만 출력 — 앞뒤에 어떤 텍스트도 없이.`;
}

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

  const lang = getLang(request, raw as Record<string, unknown>);

  const err = validate(raw);
  if (err) return jsonError(err, 400);

  const body = sanitise(raw as LoreCraftRequest);
  const ko   = isKorean(lang);

  // ── Spend seeds ────────────────────────────────────────────────────────────
  let userId: string | undefined;
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
    const seedResult = await spendSeeds(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_KEY,
      request.headers.get('Authorization'),
      SEEDS_COST,
    );
    if (!seedResult.ok) {
      return jsonError(seedResult.error ?? 'Seeds error.', seedResult.status ?? 400);
    }
    userId = seedResult.userId;
  }

  // ── AI call (refund seeds on failure) ──────────────────────────────────────
  let report: unknown;
  try {
    report = await callLLM(env.OPENAI_API_KEY, {
      system:      ko ? SYSTEM_KO : SYSTEM_EN,
      user:        ko ? buildPromptKO(body) : buildPromptEN(body),
      jsonSchema:  {},
      model:     'gpt-5.2-pro',
      maxTokens: 6_000,
    });
  } catch (e) {
    if (userId && env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
      try { await refundSeeds(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, userId, SEEDS_COST); } catch {}
    }
    if (e instanceof LLMError) {
      return jsonError('AI service returned an error.', e.status, e.message || `HTTP ${e.status}`);
    }
    return jsonError('Unexpected server error.', 500, String(e));
  }

  if (!isValidReport(report)) {
    if (userId && env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
      try { await refundSeeds(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, userId, SEEDS_COST); } catch {}
    }
    return jsonError(
      'The AI returned an unexpected response shape. Please try again.',
      500,
    );
  }

  return jsonOk(report);
};

export const onRequestOptions: PagesFunction = () =>
  Promise.resolve(corsPreflightResponse('POST, OPTIONS'));
