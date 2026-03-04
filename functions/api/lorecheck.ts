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
 *   },
 *   lang?: 'en-US' | 'ko-KR',
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
import { getLang, isKorean } from '../_shared/i18n';
import { spendSeeds, refundSeeds } from '../_shared/seeds';

const SEEDS_COST = 1;

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
    typeof r['overallImpression'] === 'string'       &&
    Array.isArray(r['tensionPoints'])                &&
    RISK_LEVELS.has(r['stability'] as string)        &&
    RISK_LEVELS.has(r['eyebrowRaiseRisk'] as string) &&
    Array.isArray(r['extractedAssumptions'])          &&
    Array.isArray(r['missingInfoQuestions'])
  );
}

// ─── Meta context blocks (one per language) ───────────────────────────────────
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

function metaBlockKO(meta: OptionalMeta | undefined): string {
  if (!meta) return '';
  const lines: string[] = [];
  if (meta.timePeriod) lines.push(`- **시대:** ${meta.timePeriod}`);
  if (meta.region)     lines.push(`- **지역 / 배경:** ${meta.region}`);
  if (meta.ageRange)   lines.push(`- **주요 인물 나이대:** ${meta.ageRange}`);
  if (meta.occupation) lines.push(`- **주요 인물 직업:** ${meta.occupation}`);
  if (lines.length === 0) return '';
  return '\n### 창작자가 제공한 참고 정보:\n' + lines.join('\n');
}

// ─── English prompt ───────────────────────────────────────────────────────────
const SYSTEM_EN =
  'You are LoreKit, a perceptive assistant cat specializing in narrative and worldbuilding plausibility analysis. ' +
  'You read passages like a sharp-eyed editor and cultural historian — catching what strains credibility before a reader does. ' +
  'You are warm, constructive, and precise. You never dismiss creative choices; you illuminate genuine risks and offer concrete paths forward. ' +
  'If a passage is internally coherent and plausible, say so warmly and directly — returning no tension points is correct when the passage holds up. ' +
  'You respond ONLY with a valid JSON object — no surrounding prose, no markdown code fences.';

function buildPromptEN(body: LoreCheckRequest): string {
  return `\
Analyse this worldbuilding or narrative passage for plausibility. Evaluate all five layers silently; report only genuine, evidence-based findings.

### Passage:
---
${body.text}
---
${metaBlock(body.optionalMeta)}

### Evaluation Layers:
1. **Structural Plausibility** — impossible causation, contradictory premises, physical impossibilities.
2. **Behavioral Probability** — unmotivated decisions, conveniently timed reactions, psychologically implausible choices.
3. **Cultural Alignment** — anachronisms, cultural contradictions, mismatched social logic for the stated time/region/context.
4. **Occupational Logic** — characters knowing too much, too little, or acting outside their plausible competence.
5. **Motivational Coherence** — goals or fears that contradict established character needs or strain credibility.

---

Return a single JSON object (raw JSON only, no markdown fences):

{
  "overallImpression": "2–3 sentences on the passage's overall plausibility. If it holds up well, say so warmly and directly.",
  "tensionPoints": [
    {
      "title": "Short label naming the specific tension",
      "why": "1–2 sentences: what the issue is and why it matters. Must cite a concrete detail from the passage.",
      "riskLevel": "low | medium | high",
      "fixes": [
        "Concrete, actionable suggestion.",
        "Alternative fix if another narrative direction applies."
      ]
    }
  ],
  "stability": "low | medium | high",
  "eyebrowRaiseRisk": "low | medium | high",
  "extractedAssumptions": [
    "Every inference made that the passage did not state explicitly. Tag real-world claims '[Historical]' or '(approximation)'."
  ],
  "missingInfoQuestions": [
    "A genuine question about absent context that would meaningfully change the analysis."
  ]
}

### Critical rules:
- Report 0–3 tension points — only genuine, evidence-based issues tied to a concrete passage detail.
- If the passage is internally coherent and plausible, return tensionPoints: [], stability: "high", eyebrowRaiseRisk: "low".
- Do NOT invent problems to fill the array. Prefer returning zero issues to reporting a weak or speculative one.
- Each tension: 2–3 concrete fix suggestions, only when a real issue exists.
- missingInfoQuestions: 0–3 items. Omit entirely if no meaningful gap exists.
- extractedAssumptions: list every silent inference. Never omit.
- Do NOT fabricate statistics — mark uncertain claims "(approximation)".
- Output ONLY the JSON object.`;
}

// ─── Korean prompt ────────────────────────────────────────────────────────────
const SYSTEM_KO =
  '당신은 로어킷(LoreKit)입니다. 내러티브 및 세계관 개연성 분석을 전문으로 하는 예리한 고양이 조수입니다. ' +
  '날카로운 편집자와 문화 역사학자처럼 글을 읽어, 독자가 알아채기 전에 신뢰성을 해치는 부분을 잡아냅니다. ' +
  '따뜻하고 건설적이며 정밀합니다. 단락이 탄탄하고 개연성 있으면 그렇다고 직접 말하세요 — 문제가 없을 때 텐션 포인트를 반환하지 않는 것이 올바른 답변입니다. ' +
  'JSON 내 산문은 반드시 존댓말(공손한 제안형)로 통일하며, 반말과 존댓말을 섞지 않습니다. ' +
  '반드시 유효한 JSON 객체만 응답합니다 — 앞뒤 산문이나 마크다운 코드 펜스 없이.';

function buildPromptKO(body: LoreCheckRequest): string {
  return `\
다음 세계관 또는 내러티브 단락을 개연성 관점에서 분석하세요. 다섯 가지 레이어를 모두 자동으로 평가한 뒤, 근거 있는 발견만 보고하세요.

### 단락:
---
${body.text}
---
${metaBlockKO(body.optionalMeta)}

### 평가 레이어:
1. **구조적 개연성** — 불가능한 인과관계, 모순된 전제, 물리적 불가능성.
2. **행동 확률** — 동기 없는 결정, 편의상 타이밍, 심리적으로 믿기 어려운 선택.
3. **문화적 정합성** — 시대착오, 문화적 모순, 명시된 시대·지역·맥락에 맞지 않는 사회적 논리.
4. **직업적 논리** — 역할과 경험에 비해 너무 많이 알거나 너무 적게 알거나 능력 밖의 행동.
5. **동기의 일관성** — 확립된 캐릭터 필요와 모순되는 목표, 신뢰성을 해치는 동기.

---

단일 JSON 객체를 반환하세요 (원시 JSON만, 마크다운 펜스 없음). 모든 산문은 한국어로 작성하세요.

{
  "overallImpression": "단락의 전반적인 개연성에 대한 2–3문장 종합 (한국어). 탄탄하면 그렇다고 따뜻하고 직접적으로 말하세요.",
  "tensionPoints": [
    {
      "title": "긴장 요소를 명명하는 짧은 레이블 (한국어)",
      "why": "1–2문장: 문제와 그 중요성. 반드시 단락의 구체적 내용을 근거로 해야 합니다 (한국어).",
      "riskLevel": "low | medium | high",
      "fixes": [
        "구체적이고 실행 가능한 제안 (한국어)",
        "대안적 수정 방법 (한국어)"
      ]
    }
  ],
  "stability": "low | medium | high",
  "eyebrowRaiseRisk": "low | medium | high",
  "extractedAssumptions": [
    "단락이 명시하지 않은 모든 추론 (한국어). 실제 역사적 주장은 '[Historical]' 또는 '(추정)'으로 태그."
  ],
  "missingInfoQuestions": [
    "분석을 의미 있게 바꿀 수 있는 부재한 맥락에 대한 호기심 어린 질문 (한국어)."
  ]
}

### 핵심 규칙:
- 긴장 요소는 0–3개만 — 단락의 구체적 내용에 근거한 진짜 문제만. 채우기 위해 억지로 만들지 마세요.
- 단락이 내적으로 일관되고 개연성 있으면: tensionPoints: [], stability: "high", eyebrowRaiseRisk: "low".
- 약하거나 추측성 문제 제기보다 0개가 더 정확한 답입니다.
- missingInfoQuestions: 0–3개. 의미 있는 공백이 없으면 완전히 생략하세요.
- extractedAssumptions: 모든 암묵적 추론을 나열하세요. 생략 금지.
- 통계·역사적 사실 날조 금지 — 불확실한 주장은 "(추정)".
- riskLevel, stability, eyebrowRaiseRisk 값은 영어: "low", "medium", "high" 중 하나.
- JSON 객체만 출력하세요.`;
}

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

  const lang = getLang(request, raw as Record<string, unknown>);

  const err = validate(raw);
  if (err) return jsonError(err, 400);

  const body = sanitise(raw as LoreCheckRequest);

  const ko = isKorean(lang);

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
      model:      'gpt-5.2',
      maxTokens:  2_500,
    });
  } catch (e) {
    if (userId && env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
      try { await refundSeeds(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, userId, SEEDS_COST); } catch {}
    }
    if (e instanceof LLMError) {
      return jsonError('AI service returned an error.', e.status, e.message);
    }
    return jsonError('Unexpected server error.', 500, String(e));
  }

  if (!isValidReport(report)) {
    if (userId && env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
      try { await refundSeeds(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, userId, SEEDS_COST); } catch {}
    }
    return jsonError(
      'The AI returned an unexpected response shape. Please try again.',
      502,
    );
  }

  return jsonOk(report);
};

export const onRequestOptions: PagesFunction = () =>
  Promise.resolve(corsPreflightResponse('POST, OPTIONS'));
