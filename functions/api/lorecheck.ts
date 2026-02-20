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
  'You are LoreKit, a perceptive and slightly mischievous assistant cat who specialises in narrative and worldbuilding plausibility analysis. ' +
  'You read passages the way a sharp-eyed editor and a cultural historian would — catching what strains credibility before a reader does. ' +
  'You are warm, constructive, and precise. You never dismiss creative choices; you illuminate their risks and offer paths forward. ' +
  'You respond ONLY with a valid JSON object — no surrounding prose, no markdown code fences.';

function buildPromptEN(body: LoreCheckRequest): string {
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

3. **Cultural Alignment** — Do the norms, values, and social dynamics match the stated time period, region, and cultural context? Consider what is realistic for the relevant age cohort, cultural norms, and role expectations given the setting. Flag anachronisms, cultural contradictions, or mismatched social logic. Use the metadata (if provided) to sharpen this layer.

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

// ─── Korean prompt ────────────────────────────────────────────────────────────
const SYSTEM_KO =
  '당신은 로어킷(LoreKit)입니다. 내러티브 및 세계관 개연성 분석을 전문으로 하는 예리하고 약간 장난스러운 고양이 조수입니다. ' +
  '날카로운 편집자와 문화 역사학자처럼 글을 읽어, 독자가 알아채기 전에 신뢰성을 해치는 부분을 잡아냅니다. ' +
  '따뜻하고 건설적이며 정밀합니다. 창의적 선택을 결코 무시하지 않고, 그 위험을 조명하며 나아갈 방향을 제시합니다. ' +
  'JSON 내 산문은 반드시 존댓말(공손한 제안형)로 통일하며, 반말과 존댓말을 섞지 않습니다. ' +
  '반드시 유효한 JSON 객체만 응답합니다 — 앞뒤 산문이나 마크다운 코드 펜스 없이.';

function buildPromptKO(body: LoreCheckRequest): string {
  return `\
다음 세계관 또는 내러티브 단락을 분석하세요. 다섯 가지 평가 레이어 전체에 걸쳐 자동으로 Quick Scan을 실행하세요 — 창작자에게 카테고리를 선택하도록 요청하지 마세요. 가장 의미 있는 발견만 제시하세요.

### 단락:
---
${body.text}
---
${metaBlockKO(body.optionalMeta)}

### 평가 레이어 (모두 자동으로 평가한 후 결과 보고):

1. **구조적 개연성** — 묘사된 상황, 배경, 또는 시퀀스가 물리적·논리적으로 일관성 있게 유지되나요? 불가능한 인과관계, 모순된 전제, 또는 물리적 불가능성을 찾으세요.

2. **행동 확률** — 캐릭터의 결정과 반응이 그들이 직면한 압박을 고려했을 때 설득력이 있나요? 동기가 없거나, 편의상 타이밍이 맞거나, 심리적으로 믿기 어려운 선택을 표시하세요.

3. **문화적 정합성** — 규범, 가치관, 사회적 역학이 명시된 시대, 지역, 문화적 맥락과 일치하나요? 해당 세대·문화권·직업군에서 실제로 가능성(확률) 있는 행동과 인식인지를 기준으로 판단하세요. 시대착오, 문화적 모순, 또는 맞지 않는 사회적 논리를 표시하세요.

4. **직업적 논리** — 기술, 접근권, 지식이 캐릭터의 명시된 역할과 경험에 부합하나요? 캐릭터가 너무 많이 알거나, 너무 적게 알거나, 개연성 있는 능력 밖의 행동을 하는 경우를 표시하세요.

5. **동기의 일관성** — 목표, 두려움, 행동이 일관된 흐름을 형성하나요? 신뢰성을 해치는 숨겨진 동기나 확립된 캐릭터 필요와 모순되는 목표를 표시하세요.

---

다음 구조에 정확히 맞는 단일 JSON 객체를 반환하세요 (원시 JSON만, 마크다운 펜스 없음).
모든 산문 내용(overallImpression, title, why, fixes 항목, extractedAssumptions, missingInfoQuestions)은 한국어로 작성하세요.

{
  "overallImpression": "단락의 전반적인 개연성에 대한 2–3문장 종합 (한국어). 잘 된 부분을 먼저 언급하되 솔직하게. LoreKit의 첫 번째 노트.",
  "tensionPoints": [
    {
      "title": "특정 긴장 요소를 명명하는 짧은 레이블 (한국어)",
      "why": "1–2문장: 문제가 무엇이며 독자 몰입이나 이야기 신뢰도에 왜 중요한지 (한국어)",
      "riskLevel": "low | medium | high",
      "fixes": [
        "창작자에게 직접 전달하는 구체적이고 실행 가능한 제안 — 무엇을 바꾸거나 명확히 할 수 있는지 (한국어)",
        "다른 내러티브 방향이 적절한 경우의 대안적 수정 방법 (한국어)"
      ]
    }
  ],
  "stability": "low | medium | high",
  "eyebrowRaiseRisk": "low | medium | high",
  "extractedAssumptions": [
    "단락이 명시적으로 언급하지 않은 모든 추론 (한국어). 실제 역사적 주장은 '[Historical]' 또는 '(추정)'으로 태그하세요."
  ],
  "missingInfoQuestions": [
    "분석을 의미 있게 바꿀 수 있는 부재한 맥락에 대한 부드럽고 호기심 어린 질문 (한국어). 결코 비난조가 아니어야 함."
  ]
}

### 필드 정의:
- **stability**: 전반적인 내부 일관성 (high = 논리적 공백이 거의 없음).
- **eyebrowRaiseRisk**: 정보에 밝은 독자가 단락을 읽다가 멈추고 의문을 가질 가능성 (high = 매우 높음).
- **riskLevel**: 해결하지 않을 경우 몰입에 대한 위협의 심각도.

### 엄격한 제약:
- 정확히 3–5개의 긴장 요소만 제시 — 가장 영향력 있는 것만. 사소한 관찰로 채우지 마세요.
- 각 긴장 요소: 정확히 2–3개의 수정 제안.
- missingInfoQuestions: 0–4개 항목, 호기심과 따뜻함으로 표현. 필요 없으면 배열 항목을 완전히 생략하세요.
- extractedAssumptions: 모든 암묵적 추론을 나열하세요. 절대 생략하지 마세요.
- 통계나 역사적 사실을 날조하지 마세요 — 불확실한 주장은 "(추정)"으로 표시하세요.
- riskLevel, stability, eyebrowRaiseRisk 값은 반드시 영어로: "low", "medium", "high" 중 하나.
- JSON 객체만 출력하세요. 앞뒤 산문 없음.`;
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

  let report: unknown;
  try {
    report = await callLLM(env.OPENAI_API_KEY, {
      system:      ko ? SYSTEM_KO : SYSTEM_EN,
      user:        ko ? buildPromptKO(body) : buildPromptEN(body),
      jsonSchema:  {},
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
