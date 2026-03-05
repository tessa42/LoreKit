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
  jsonError, corsPreflightResponse,
  requireApiKey, rateLimitResponse,
} from '../_shared/response';
import { callLLMStream, LLMError } from '../lib/openai';
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
  'Produce authoritative research dossiers describing worlds — real, fictional, or hybrid — with academic depth. ' +
  'Write in dense, third-person, present-tense analytical prose. ' +
  'Describe the world as if it exists and has been studied. Never reference "the author", "the story", "the creator", or "the fiction". ' +
  'Treat supernatural elements as internal reality. Never evaluate, advise, or critique. ' +
  'No evaluation language ("fragile", "inconsistency", "verdict", "rating", "strength", "weakness"). ' +
  'No bullet points or tables — continuous prose paragraphs only. ' +
  'Output only a valid JSON object — no surrounding prose, no markdown code fences.';

function buildPromptEN(body: LoreCraftRequest): string {
  const mythSection = hasFantasyElements(body) ?
    `,\n    {"id":"myth-supernatural-system","title":"Cosmology and Supernatural Systems","paragraphs":["Cosmological order: how supernatural or metaphysical forces are understood to operate in this world — their nature, logic, and the belief systems that have formed around them.","Material manifestations of these forces: institutional expressions, spatial presences, ritual economies, and consequences for social organization."]}` : '';

  return `\
${worldBlock(body)}

---

Produce a deep worldbuilding research dossier as a single JSON object (raw JSON only, no markdown fences). Replace each paragraph placeholder with 4–6 sentences of dense scholarly prose.

{
  "title": "4–8 word scholarly dossier title naming the world or epoch under study",
  "overview": "2–4 dense prose paragraphs: the world's spatial situation, historical moment, dominant forces, environment, and defining atmosphere",
  "sections": [
    {"id":"spatial-morphology","title":"Spatial Morphology and Settlement Patterns","paragraphs":["Macro-geography: territorial extent, topographic character, dominant landscape types, and land-population distribution.","Micro-spatial logic: settlement organization, orientation systems, and division of public, private, sacred, and productive space."]},
    {"id":"climate-environment","title":"Climate, Ecology, and Environmental Forces","paragraphs":["Prevailing climate systems, seasonal rhythms, ecological zones, and how the environment conditions agriculture, movement, and shelter.","Resource distribution, environmental pressures, and how the natural world figures in collective imagination and cosmology."]},
    {"id":"built-environment-architecture","title":"Built Environment and Architecture","paragraphs":["Settlement character — scale, materials, density, spatial organization — and what structures communicate about power, hierarchy, and communal life.","Vernacular vs monumental building traditions, grammar of public space, and how the built world mediates social order and natural environment."]},
    {"id":"economy-industry","title":"Economy, Production, and Trade","paragraphs":["Dominant mode of production — agricultural, extractive, industrial, or otherwise — its scale, geography, and labor organization.","Trade flows, market structures, exchange systems, and how economic activity structures space and social relations."]},
    {"id":"demographics-social-hierarchy","title":"Demographics and Social Hierarchy","paragraphs":["Population composition, settlement density, demographic dynamics, and patterns of mobility or migration.","Social hierarchy: organizing axes (class, caste, lineage, ability, species), mechanisms of reproduction, and characteristic expressions in everyday life."]},
    {"id":"culture-norms-collective-psychology","title":"Culture, Norms, and Collective Psychology","paragraphs":["Dominant values, cultural practices, ritual life, aesthetics, and the role of art and performance in social reproduction.","Collective emotional register — fears, desires, celebrations, suppressions — and how collective life shapes individual psychology."]},
    {"id":"infrastructure-technology-everyday-life","title":"Infrastructure, Technology, and Everyday Life","paragraphs":["Technological substrate: energy sources, communication systems, transport networks, food and water infrastructure.","Texture of ordinary daily life: routines, consumption patterns, and the rhythms and institutions that structure people's days."]},
    {"id":"history-transition","title":"Historical Formation and Ongoing Transitions","paragraphs":["Historical trajectory: formative events, ruptures, migrations, and continuities that produced the present condition.","Current transformations and structural pressures — economic, environmental, political, cultural — actively reshaping the world."]}${mythSection}
  ],
  "sourcesAndAssumptions": ["Every inference or assumption made to complete the dossier. Tag real-world claims as [Historical]."],
  "uncertaintyNotes": ["Aspects where input was ambiguous or insufficient for confident analysis, and what was assumed in each case."]
}

Output ONLY the JSON object.`;
}

// ─── Korean system + prompt ────────────────────────────────────────────────────
const SYSTEM_KO =
  '당신은 문화지리학, 사회사, 사변적 세계 연구를 전문으로 하는 학술 연구 분석가입니다. ' +
  '실재·허구·혼합 세계를 학문적 깊이와 정밀함으로 기술하는 권위 있는 연구 도서를 작성합니다. ' +
  '밀도 있고 자신감 있는 3인칭 분석적 산문, 현재 시제. ' +
  '세계를 실제로 존재하고 연구된 대상처럼 기술합니다. "작가", "이야기", "창작자", "허구"를 절대 언급하지 않습니다. ' +
  '초자연적 요소는 내적 현실로 취급하여 학자처럼 분석합니다. 절대 평가·조언·비판하지 않습니다. ' +
  '글머리표와 표 금지 — 오직 연결된 산문 단락만. ' +
  '유효한 JSON 객체만 출력합니다 — 앞뒤 산문이나 마크다운 코드 펜스 없이.';

function buildPromptKO(body: LoreCraftRequest): string {
  const mythSection = hasFantasyElements(body) ?
    `,\n    {"id":"myth-supernatural-system","title":"우주론과 초자연 체계","paragraphs":["우주론적 질서: 이 세계에서 초자연적·형이상학적 힘이 어떻게 이해되고 작동하는지 — 그 본질, 논리, 그리고 이를 둘러싼 신앙 체계.","이러한 힘의 물질적 현현: 제도적 표현, 공간적 현존, 의례 경제, 사회 조직에 대한 결과."]}` : '';

  return `\
${worldBlock(body)}

---

위에 기술된 세계에 대한 심층 세계관 연구 도서를 JSON 객체로 작성하세요 (원시 JSON만, 마크다운 펜스 없음). 각 단락 자리에 4–6문장의 학술 산문을 작성하세요. 모든 산문은 한국어로, section의 "id" 값은 영어 그대로 유지하세요.

{
  "title": "연구 대상 세계·문명·시대를 명명하는 4–8 단어의 학술적 제목 (한국어)",
  "overview": "세계의 공간적 상황, 역사적 국면, 지배적 세력, 환경적 특성, 분위기를 종합하는 2–4개의 밀도 있는 산문 단락",
  "sections": [
    {"id":"spatial-morphology","title":"공간 형태와 정주 패턴","paragraphs":["거시 지리학: 영토적 범위, 지형적 특성, 지배적 경관 유형, 토지와 인구 분포의 관계.","미시 공간 논리: 정주지 조직, 방향 체계, 공공·사적·신성·생산 공간의 구분."]},
    {"id":"climate-environment","title":"기후, 생태, 환경적 힘","paragraphs":["지배적 기후 체계, 계절적 리듬, 생태 지대, 환경이 농업·이동·주거를 조건 짓는 방식.","자원 분포, 환경적 압력, 자연 세계가 집단적 상상력과 우주론에서 차지하는 위치."]},
    {"id":"built-environment-architecture","title":"건조 환경과 건축","paragraphs":["정주지 특성 — 규모, 재료, 밀도, 공간 조직 — 과 구조물이 권력·위계·공동체적 삶에 대해 말하는 것.","토착 건축과 기념비적 건축 전통, 공공 공간의 공간 문법, 건조 세계가 사회 질서와 자연 환경을 매개하는 방식."]},
    {"id":"economy-industry","title":"경제, 생산, 교역","paragraphs":["지배적 생산 양식 — 규모, 지리, 노동 조직.","교역 흐름, 시장 구조, 교환 체계, 경제 활동이 공간과 사회적 관계를 구조화하는 방식."]},
    {"id":"demographics-social-hierarchy","title":"인구와 사회 위계","paragraphs":["인구 구성, 정주 밀도, 인구 동태, 이동 또는 이주 패턴.","사회 위계의 구조 — 조직 축(계급, 카스트, 혈통, 능력, 종족), 재생산 메커니즘, 일상생활에서의 특징적 표현."]},
    {"id":"culture-norms-collective-psychology","title":"문화, 규범, 집단 심리","paragraphs":["지배적 가치 체계, 문화적 실천, 의례 생활, 미적 감수성, 사회적 재생산에서 예술의 역할.","집단적 정서 — 이 사회가 두려워하고 욕망하고 기념하고 억압하는 것 — 과 집단적 삶이 개인 심리를 형성하는 방식."]},
    {"id":"infrastructure-technology-everyday-life","title":"인프라, 기술, 일상생활","paragraphs":["기술적 기반: 에너지 원천, 통신 체계, 교통 네트워크, 식량 및 수자원 인프라.","평범한 일상의 질감: 사람들이 하는 일, 이동 방식, 소비, 하루를 구조화하는 리듬과 제도."]},
    {"id":"history-transition","title":"역사적 형성과 진행 중인 전환","paragraphs":["역사적 궤적: 현재를 만들어 낸 형성적 사건, 단절, 이주, 연속성.","현재의 변환과 구조적 압력 — 경제적, 환경적, 정치적, 문화적 — 이 세계를 재형성하고 있는 힘."]}${mythSection}
  ],
  "sourcesAndAssumptions": ["도서 완성을 위한 모든 추론 또는 가정. 실제 역사적 주장에는 [Historical] 태그."],
  "uncertaintyNotes": ["자신 있는 분석에 불충분했던 측면과 각 경우 가정한 내용."]
}

JSON 객체만 출력하세요.`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;

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

  // ── Set up SSE stream ──────────────────────────────────────────────────────
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer  = writable.getWriter();
  const enc     = new TextEncoder();

  const sseWrite = (event: string, data: unknown): Promise<void> =>
    writer.write(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

  const doRefund = () => {
    if (userId && env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
      ctx.waitUntil(
        refundSeeds(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, userId, SEEDS_COST).catch(() => {}),
      );
    }
  };

  // ── Stream OpenAI response in background ───────────────────────────────────
  ctx.waitUntil((async () => {
    const hbTimer = setInterval(() => {
      writer.write(enc.encode(': keep-alive\n\n')).catch(() => {});
    }, 5_000);

    try {
      const stream = await callLLMStream(env.OPENAI_API_KEY, {
        system:          ko ? SYSTEM_KO : SYSTEM_EN,
        user:            ko ? buildPromptKO(body) : buildPromptEN(body),
        model:           'gpt-5.2',
        maxTokens:       5_000,
        reasoningEffort: 'low',
      });

      let fullText = '';
      const reader = stream.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += value;
      }

      const cleaned = fullText
        .replace(/^```(?:json)?\s*\n?/, '')
        .replace(/\n?```\s*$/, '')
        .trim();

      let report: unknown;
      try {
        report = JSON.parse(cleaned);
      } catch {
        doRefund();
        await sseWrite('error', { message: 'AI returned malformed JSON.', status: 502 });
        return;
      }

      if (!isValidReport(report)) {
        doRefund();
        await sseWrite('error', { message: 'AI returned unexpected shape. Please try again.', status: 502 });
        return;
      }

      await sseWrite('result', report);

    } catch (e) {
      doRefund();
      const message = e instanceof LLMError ? e.message : String(e);
      const status  = e instanceof LLMError ? e.status  : 500;
      await sseWrite('error', { message, status });
    } finally {
      clearInterval(hbTimer);
      writer.close().catch(() => {});
    }
  })());

  return new Response(readable, {
    headers: {
      'Content-Type':                'text/event-stream',
      'Cache-Control':               'no-cache',
      'X-Accel-Buffering':           'no',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

export const onRequestOptions: PagesFunction = () =>
  Promise.resolve(corsPreflightResponse('POST, OPTIONS'));
