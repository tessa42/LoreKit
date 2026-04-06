# Lorecraft 파이프라인 설계 문서

> 이 문서는 Lorecraft 기능의 AI 파이프라인 구조와 설계 의도를 기술합니다.
> Claude Code 등 AI 코딩 보조 도구가 파이프라인 수정 시 반드시 참조하세요.

---

## 기능 개요

유저가 창작 세계관의 배경/장르/설정을 입력하면,
실존 역사·문화·지리 정보와 유저의 가상 설정을 결합하여
단행본 설정집/팬 위키 수준의 세계관 설정집 초안을 생성합니다.

생성된 결과물은 아카이브에 저장되며, 추후 로어북 편집의 재료가 됩니다.

---

## 입력 구조

```ts
interface LoreCraftInput {
  background: string      // 시대/시공간 배경 (자유 서술)
  genre: string           // 장르
  existingSetting?: string // 이미 잡아 놓은 설정 (선택)
  areas: AreaType[]       // 요청 영역 (복수 선택)
}

type AreaType =
  | '역사와 배경'
  | '지리와 공간'
  | '사회 구조와 계층'
  | '조직과 세력'
  | '기술/마법 체계'
  | '문화와 일상'
  | '주요 인물'
  | '사건과 갈등 구조'
```

---

## 파이프라인 구조

```
normalize → analyze → plan → research → synthesize → review → generate → format
```

단계별 AI 모델 배치:

| 단계 | 모델 | 이유 |
|---|---|---|
| normalize | 없음 | 기계적 검증 |
| analyze | Claude Haiku | 빠른 맥락 파악 |
| plan | Claude Haiku | 구조 설계 |
| research | Claude Sonnet | 정확한 지식 기반 리서치 |
| synthesize | Claude Haiku | 자료 압축/재구성 |
| review | Claude Haiku | 빠른 검토 |
| generate | Claude Sonnet | 고품질 문체 생성 (스트리밍) |
| format | 없음 | 후처리 |

> **추후 멀티모델 전환 계획**
> research/synthesize/review → GPT-4o mini
> generate → Claude Sonnet 유지
> 현재는 전부 Claude 단일 모델로 운영

---

## 단계별 설계 의도

### 1. normalize.ts
**역할**: 입력값 기계적 검증

- background, genre 필수값 확인
- areas 유효값 확인 (8개 중 하나 이상)
- 길이 제한 체크
- AI 호출 없음

---

### 2. analyze.ts
**역할**: 입력값 의미 파악 (AI)

유저가 주관식으로 쓴 내용을 AI가 해석한다.
실존 배경인지, 가상 설정인지, 혼합인지 분류하고
어떤 리서치가 필요한지 추출한다.

출력 (JSON):
```json
{
  "setting_type": "real" | "fictional" | "hybrid",
  "priority_axes": ["politics", "religion", "trade"],
  "genre_tone": "dark mystery",
  "research_needs": ["1894년 상해 조계 구조", "망명자 이동 경로"],
  "fictional_elements": ["역행 능력자", "가명 시스템"]
}
```

**설계 원칙**: 자유 텍스트 출력 금지. 반드시 구조화 JSON으로 반환.
파싱 실패 시 1회 재시도.

---

### 3. plan.ts
**역할**: 생성 계획 수립 (AI)

analyze 결과를 받아 섹션별 생성 계획을 세운다.
어떤 섹션을 만들지, 실존 기반인지 가상 설정 기반인지,
각 섹션에서 무엇을 강조할지 결정한다.

**중요**: 무엇을 생성하지 않을지도 결정한다.
(플롯과 무관한 세부 정보, 과도한 군사 체계 등 제외)

출력 (JSON):
```json
{
  "sections": [
    {
      "title": "조선 내외 주요 세력",
      "area": "조직과 세력",
      "type": "hybrid",
      "focus": "실존 세력 구도 + 역행자의 정보 우위",
      "key_points": ["청·일 세력 대립", "망명 개화파 내부 분열"]
    }
  ]
}
```

---

### 4. research.ts
**역할**: 실존 배경 정보 수집 (AI)

analyze + plan 결과를 받아 실존 역사·문화·지리 정보를 생성한다.
이 단계는 최종 본문 생성이 아니라 **근거 자료 패키지** 만들기다.

출력 (JSON):
```json
{
  "sources_summary": [
    {
      "topic": "상해 공동조계",
      "facts": ["치외법권 지대", "복수 국적 혼재", "비공식 정보망 형성에 유리"],
      "confidence": "high"
    }
  ],
  "gaps": ["구체적인 조선인 상인 네트워크 규모 불명확"],
  "creative_flex_points": ["조계 내 특정 거리/건물은 창작 가능"]
}
```

> **추후 GPT 전환 포인트**: research.ts의 AI 호출부만 교체하면 됨.

---

### 5. synthesize.ts
**역할**: 창작용 핵심 포인트 재구성 (AI)

research 결과를 그대로 generate에 넘기면 백과사전식 결과가 나온다.
이 단계에서 **창작 친화적으로 압축**하고,
섹션 간 연결성을 강화한다.

출력 (JSON):
```json
{
  "sections": [
    {
      "title": "조선 내외 주요 세력",
      "key_points": ["원세개의 실질적 내정 장악", "망명파의 일본 의존 한계"],
      "tone_hints": "긴장과 불신이 교차하는 외교 공간",
      "connections": ["역행자의 정보 우위가 이 세력 구도에서 어떻게 작동하는지"]
    }
  ]
}
```

---

### 6. review.ts
**역할**: 생성 전 최종 검토 및 보정 (AI)

synthesize 결과를 generate에 넘기기 전 마지막으로 확인한다.
유저에게 보여주는 검수 리포트가 아니라 **내부 품질 보정** 단계다.

확인 항목:
- 선택한 areas 대비 누락 섹션
- 설정 간 충돌 (실존 정보 vs 가상 설정)
- 장르/시대/배경과 어긋나는 부분
- synthesize 톤 일관성

보정된 결과를 generate에 전달한다.

---

### 7. generate.ts
**역할**: 설정집 본문 생성 (AI, 스트리밍)

review를 통과한 자료로 **글만 잘 쓰는** 단계.
판단과 구조 결정은 앞 단계에서 완료된 상태여야 한다.

**스트리밍**: ReadableStream으로 실시간 출력.
Cloudflare 30초 타임아웃 문제 해결을 위해 스트리밍 필수.

**핵심 프롬프트 원칙**:
- 세계 내부자 시점 유지 (메타적 언급 금지)
- 제시된 설정 외 임의 창작 금지
- 실존 정보와 가상 설정 구분 서술
- 세계관 고유 용어 사용
- 표보다 산문 우선

---

### 8. format.ts
**역할**: 후처리 (AI 없음)

스트리밍 결과를 섹션별로 파싱하고
archive_items 저장용 payload 구조로 변환한다.

---

## 출력 구조

```ts
interface LoreCraftResult {
  title: string           // 세계관 제목 (자동 생성)
  sections: Section[]     // 섹션 목록
  meta: {
    background: string
    genre: string
    areas: AreaType[]
    generatedAt: string
  }
}

interface Section {
  title: string
  area: AreaType
  type: 'real' | 'fictional' | 'hybrid'
  content: string         // 설정집 본문
}
```

---

## 설계 원칙

**없는 것을 만들지 말 것**
유저가 명시하지 않은 조직, 인물, 설정을 임의로 생성하지 않는다.
공백은 공백으로 둔다.

**실존과 가상을 구분**
실존 역사 정보와 유저 창작 가상 설정을 항상 구분하여 서술한다.

**로어북 연결**
생성 결과는 아카이브에 저장되며 추후 로어북 편집의 재료가 된다.
섹션 구조를 로어북 챕터와 일치시킨다.

---

## 미확정 항목

| 항목 | 상태 |
|---|---|
| 씨앗 단가 | 토큰 비용 측정 후 결정 |
| research 단계 GPT 전환 시점 | MVP 출시 후 |
| RAG 연동 (유저 로어북 참조) | 2차 구현 |
| 웹서치 툴 연동 | 검토 중 |
