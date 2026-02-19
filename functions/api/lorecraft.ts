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
 *   lang?: 'en-US' | 'ko-KR',
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
import { getLang, isKorean } from '../_shared/i18n';

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
    Array.isArray(r['assumptions']) &&
    Array.isArray(r['uncertaintyFlags']) &&
    Array.isArray(r['suggestedNextChecks'])
  );
}

// ─── Shared: world input block ────────────────────────────────────────────────
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

// ─── English prompt ───────────────────────────────────────────────────────────
const SYSTEM_EN =
  'You are LoreKit, a meticulous and slightly mischievous assistant cat who specialises in worldbuilding consistency analysis for writers and creators. ' +
  'You produce rigorous, well-reasoned reports that balance scholarly depth with creative insight. ' +
  'You flag every assumption, never confabulate statistics, and mark uncertain estimates as approximations. ' +
  'You respond ONLY with a valid JSON object — no surrounding prose, no markdown code fences.';

function buildPromptEN(body: LoreCraftRequest): string {
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

// ─── Korean prompt ────────────────────────────────────────────────────────────
const SYSTEM_KO =
  '당신은 LoreKit입니다. 작가와 창작자를 위한 세계관 일관성 분석을 전문으로 하는 치밀하고 약간 장난스러운 고양이 조수입니다. ' +
  '학문적 깊이와 창의적 통찰의 균형 잡힌 엄격한 보고서를 작성합니다. ' +
  '모든 가정을 명시하고, 통계를 날조하지 않으며, 불확실한 추정은 근사치로 표시합니다. ' +
  '반드시 유효한 JSON 객체만 응답합니다 — 앞뒤 산문이나 마크다운 코드 펜스 없이.';

function buildPromptKO(body: LoreCraftRequest): string {
  const hybridNote = body.worldType === 'hybrid'
    ? '- 하이브리드 규칙: Reality Anchor는 불변의 기반 진실입니다. Allowed Deviations에 나열된 도메인만 벗어날 수 있으며, 명시된 심각도 이내로만 허용됩니다. 추가 이탈을 만들어내지 마세요.\n'
    : '';

  return `\
${worldBlock(body)}

---

아래 구조에 정확히 맞는 포괄적인 세계관 검증 보고서를 단일 JSON 객체로 생성하세요 (원시 JSON만 출력, 마크다운 펜스 없음).
모든 산문 내용(title, overview, paragraphs, bullets의 내용, assumptions, uncertaintyFlags, suggestedNextChecks)은 한국어로 작성하세요.

{
  "title": "3–6단어의 간결하고 인상적인 세계 제목 (한국어)",
  "overview": "세계의 본질, 분위기, 독특한 특성을 종합하는 2–3개의 단락 (한국어)",
  "sections": [
    {
      "id": "internal-logic",
      "title": "내부 논리 평가",
      "paragraphs": ["전반적인 일관성 평가 단락 — 무엇이 유지되고 무엇이 취약한지 (한국어)"],
      "bullets": [
        "Strength: <한국어 관찰 내용>",
        "Strength: <한국어 관찰 내용>",
        "Fragility: <한국어 관찰 내용>",
        "Fragility: <한국어 관찰 내용>"
      ]
    },
    {
      "id": "world-laws",
      "title": "핵심 세계 법칙",
      "paragraphs": [],
      "table": {
        "headers": ["Law", "Strength", "Note"],
        "rows": [
          ["간결한 법칙 서술 (한국어)", "Strong | Moderate | Fragile", "이야기에 미치는 함의 한 문장 (한국어)"]
        ]
      }
    },
    {
      "id": "tensions",
      "title": "잠재적 긴장과 역설",
      "paragraphs": [],
      "table": {
        "headers": ["Tension", "Severity", "Suggested Resolution"],
        "rows": [
          ["긴장 이름 — 모순 또는 미해결 질문 간략 서술 (한국어)", "Low | Medium | High", "창작자가 취할 수 있는 구체적인 방향 한 가지 (한국어)"]
        ]
      }
    },
    {
      "id": "narrative-hooks",
      "title": "서사 기회",
      "paragraphs": [],
      "bullets": [
        "후크 제목: 이 세계가 자연스럽게 생성하는 이야기 가능성 2–3문장 설명 (한국어)"
      ]
    },
    {
      "id": "checklist",
      "title": "세계 건설자 체크리스트",
      "paragraphs": [],
      "bullets": [
        "글쓰기 전에 창작자가 결정해야 할 사항을 질문 형식으로 (한국어, 예: '…일 때 어떤 일이 일어나는지 정했나요?')"
      ]
    },
    {
      "id": "verdict",
      "title": "LoreKit의 평결",
      "paragraphs": [
        "LoreKit 고양이 조수 캐릭터로 — 지식이 풍부하고 약간 재치 있으며 따뜻하고 솔직하게 (한국어)",
        "✦✦✦✦☆ 4/5 — 평점 근거 한 문장 요약 (한국어)"
      ]
    }
  ],
  "assumptions": [
    "창작자가 명시적으로 언급하지 않은 모든 사실적 가정 (한국어). 실제 역사적 주장은 '[Historical]' 또는 '(근사치)'로 태그하세요."
  ],
  "uncertaintyFlags": [
    "창작자 입력에서 모호하거나 잠재적으로 모순되어 명확히 해야 할 사항 (한국어)"
  ],
  "suggestedNextChecks": [
    "권고 형식의 구체적인 후속 조치 (한국어, 예: '경제 모델에 대해 LoreCheck를 실행하여 시장 개연성을 테스트하세요.')"
  ]
}

엄격한 제약:
- JSON 객체만 출력 — 앞뒤 산문 없음.
- 반드시 영어로 유지할 항목 (프론트엔드 파싱에 필수):
  * section의 "id" 값: "internal-logic", "world-laws", "tensions", "narrative-hooks", "checklist", "verdict"
  * table "headers" 배열: ["Law", "Strength", "Note"] 및 ["Tension", "Severity", "Suggested Resolution"]
  * "Strength" 열 셀 값: 반드시 "Strong", "Moderate", "Fragile" 중 하나 (정확히 이 단어)
  * "Severity" 열 셀 값: 반드시 "Low", "Medium", "High" 중 하나 (정확히 이 단어)
  * internal-logic bullets의 접두사: 정확히 "Strength:" 또는 "Fragility:" (콜론 포함)
- world-laws 테이블: 정확히 5–7행.
- tensions 테이블: 정확히 3–5행.
- narrative-hooks bullets: 4–6개.
- checklist bullets: 5–8개, 각각 질문 형식.
- assumptions: 모든 추론을 빠짐없이 나열하세요.
- uncertaintyFlags: 모호함을 표시하되, 세부 사항을 만들어내어 조용히 해결하지 마세요.
- 통계, 인구 수치, 역사적 주장을 날조하지 마세요. 추정 필요 시 "(근사치)"를 인라인으로 표기하세요.
${hybridNote}`;
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

  const ko = isKorean(lang);

  let report: unknown;
  try {
    report = await callLLM(env.OPENAI_API_KEY, {
      system:      ko ? SYSTEM_KO : SYSTEM_EN,
      user:        ko ? buildPromptKO(body) : buildPromptEN(body),
      jsonSchema:  {},
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
