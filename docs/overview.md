# Lorekit — 프로젝트 설계 개요 (LLM 컨텍스트용)

> 이 문서는 Claude Code 등 AI 코딩 보조 도구가 프로젝트 구조와 설계 의도를 파악하기 위한 참조 문서입니다.
> 코드 작성 전 반드시 이 문서를 읽고 컨텍스트를 확보하세요.

---

## 1. 서비스 개요

**Lorekit**은 창작자를 위한 세계관 설계 도구입니다.

핵심 기능 4개:
- **Lorecraft** — AI가 세계관 설정집을 생성
- **Lorecheck** — 작성한 설정의 개연성을 검토 (Quick / Deep 2종)
- **Simulator** — 특정 상황에서 캐릭터가 어떻게 행동할지 시뮬레이션 (비로그인 허용)
- **My Page** — 내 서재 (아카이브, 작가 노트, 로어북, 계정, 결제)

글로벌 서비스를 목표로 하며, 씨앗(크레딧) 기반 과금 모델을 사용합니다.

---

## 2. 기술 스택

| 항목 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 14 (App Router) | Cloudflare Pages 호환 |
| 언어 | TypeScript | strict 모드 |
| 스타일 | Tailwind CSS | |
| DB / Auth | Supabase | Google OAuth 단독 |
| AI (최종 생성) | Claude Sonnet | Anthropic API |
| AI (전처리) | GPT-4o / GPT-4o mini | OpenAI API — MVP 이후 멀티모델 전환 |
| 결제 | Polar | 씨앗 충전, 웹훅 처리 |
| 이메일 | Resend | |
| 배포 | Cloudflare Pages | wrangler 사용 |

> MVP는 Claude Sonnet 단일 모델로 출시 후, 전처리에 GPT 계열 추가 예정.

---

## 3. 프로젝트 폴더 구조

```
lorekit/
├── docs/
│   ├── overview.md                  ← 이 파일
│   ├── ia.md                        ← 정보구조도
│   ├── spec/                        ← 화면 기능명세서
│   │   ├── CM_AU.md
│   │   ├── LT.md
│   │   ├── LK.md
│   │   ├── SI.md
│   │   └── MY.md
│   ├── pipeline/                    ← AI 파이프라인 스펙
│   │   ├── lorecraft.md
│   │   ├── lorecheck.md
│   │   └── simulator.md
│   └── llm-context/                 ← 외부 API 레퍼런스
│       ├── polar.txt
│       ├── supabase-schema.md
│       ├── anthropic-api.md
│       └── openai-api.md
│
├── public/
│   ├── favicon.ico
│   ├── og-image.png
│   ├── robots.txt
│   └── images/
│
├── src/
│   ├── app/
│   │   ├── (auth)/                  ← 인증 페이지 (헤더/푸터 없음)
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   │
│   │   ├── (app)/                   ← 메인 앱 (공통 레이아웃 적용)
│   │   │   ├── layout.tsx           ← Header + Footer 포함
│   │   │   ├── page.tsx             ← 홈
│   │   │   ├── lorecraft/
│   │   │   │   ├── page.tsx
│   │   │   │   └── result/page.tsx
│   │   │   ├── lorecheck/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── result/page.tsx       ← Quick 결과
│   │   │   │   └── result-deep/page.tsx  ← Deep 결과
│   │   │   ├── simulator/
│   │   │   │   ├── page.tsx
│   │   │   │   └── result/page.tsx
│   │   │   └── mypage/              ← (app) 안에 위치 — 공통 레이아웃 공유
│   │   │       ├── layout.tsx       ← My Page 전용 사이드 탭
│   │   │       ├── archive/page.tsx
│   │   │       ├── note/page.tsx
│   │   │       ├── lorebook/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [id]/page.tsx
│   │   │       ├── account/page.tsx
│   │   │       └── billing/page.tsx
│   │   │
│   │   ├── api/
│   │   │   ├── auth/callback/route.ts
│   │   │   ├── lorecraft/route.ts
│   │   │   ├── lorecheck/
│   │   │   │   ├── quick/route.ts   ← Quick 전용 엔드포인트
│   │   │   │   └── deep/route.ts    ← Deep 전용 엔드포인트 (2차)
│   │   │   ├── simulator/route.ts
│   │   │   ├── credits/route.ts
│   │   │   └── webhooks/polar/route.ts
│   │   │
│   │   ├── terms/page.tsx
│   │   ├── refund/page.tsx
│   │   └── privacy/page.tsx
│   │
│   ├── components/
│   │   ├── common/                  ← 버튼, 인풋, 모달 등
│   │   ├── layout/                  ← Header, Footer, Nav
│   │   ├── lorecraft/
│   │   ├── lorecheck/
│   │   ├── simulator/
│   │   └── mypage/
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            ← 브라우저용 Supabase client
│   │   │   └── server.ts            ← 서버 컴포넌트/API용 Supabase client
│   │   │
│   │   ├── ai/
│   │   │   ├── anthropic.ts         ← Anthropic 클라이언트 래퍼 (단일 진입점)
│   │   │   ├── openai.ts            ← OpenAI 클라이언트 래퍼 (단일 진입점)
│   │   │   └── pipeline/
│   │   │       ├── lorecraft/       ← 단계별 파일 분리 (디버깅 편의)
│   │   │       │   ├── normalize.ts
│   │   │       │   ├── plan.ts
│   │   │       │   ├── generate.ts
│   │   │       │   ├── review.ts
│   │   │       │   └── compose.ts
│   │   │       ├── lorecheck/
│   │   │       │   ├── validate.ts
│   │   │       │   ├── extract.ts
│   │   │       │   ├── quick.ts
│   │   │       │   ├── deep.ts
│   │   │       │   ├── similarity.ts
│   │   │       │   └── compose.ts
│   │   │       └── simulator/
│   │   │           ├── normalize.ts
│   │   │           ├── load-context.ts
│   │   │           ├── generate.ts
│   │   │           └── format.ts
│   │   │
│   │   ├── polar/                   ← Polar 결제 연동
│   │   ├── resend/                  ← 이메일 발송
│   │   └── credits/
│   │       └── transaction.ts       ← 씨앗 잔액 조회/차감/복구
│   │
│   ├── types/
│   │   ├── auth.ts
│   │   ├── credits.ts
│   │   ├── lorecraft.ts
│   │   ├── lorecheck.ts
│   │   ├── simulator.ts
│   │   └── mypage.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCredits.ts
│   │   └── useSession.ts
│   │
│   └── utils/
│       ├── format.ts
│       └── validate.ts
│
├── .dev.vars                        ← Cloudflare Functions 환경변수 (gitignore)
├── .dev.vars.example                ← 커밋용 예시
├── .env.local                       ← Next.js 브라우저 환경변수 (gitignore)
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── wrangler.toml
└── package.json
```

---

## 4. 환경변수

### `.dev.vars` (Cloudflare Functions용, gitignore)

```env
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
RESEND_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
```

### `.env.local` (Next.js 브라우저용, gitignore)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 5. DB 핵심 테이블 (개념)

```
profiles              ← Supabase auth.users 연동
credit_wallets        ← 씨앗 잔액
credit_transactions   ← 씨앗 사용/충전 이력
projects              ← 세계관 프로젝트 단위
archive_items         ← Lorecraft / Lorecheck / Simulator 결과 저장
                         type: 'lorecraft' | 'lorecheck_quick' | 'lorecheck_deep' | 'simulator'
                         payload: jsonb
lorebooks             ← 완성 로어북 (archive_items와 별도 분리)
                         챕터/섹션 구조로 인해 처음부터 독립 테이블 유지
notes                 ← 작가 노트
```

> **설계 원칙**:
> `archive_items`는 type + payload jsonb로 단순하게 시작합니다.
> `lorebooks`는 챕터/섹션 구조가 있어 나중에 분리하면 마이그레이션 비용이 크므로
> **처음부터 독립 테이블로 분리**합니다.

---

## 6. API 응답 공통 포맷

모든 API 라우트는 아래 형식을 따릅니다. `utils/api.ts`에 정의하고 import해서 사용합니다.

```ts
type ApiSuccess<T> = { ok: true; data: T };
type ApiError   = { ok: false; error: string; code?: string };
```

직접 `Response.json()`에 임의 형식을 쓰지 않습니다.

---

## 7. AI 파이프라인 원칙

- **모든 AI 호출은 `lib/ai/anthropic.ts` 또는 `lib/ai/openai.ts`를 통해서만** 이루어집니다.
- 페이지/API 라우트에서 SDK를 직접 import하지 않습니다.
- 파이프라인 각 단계는 독립 함수로 분리해 단계별 디버깅이 가능하게 합니다.
- 각 단계 함수는 순수 함수(pure function)에 가깝게 작성합니다 (입력 → 출력).

**MVP → 2차 전환 계획:**

| 단계 | MVP | 2차 |
|---|---|---|
| 전처리 | Claude Sonnet | GPT-4o mini |
| 중간처리 | Claude Sonnet | GPT-4o |
| 최종 생성 | Claude Sonnet | Claude Sonnet |
| 포맷 정리 | Claude Sonnet | Claude Haiku |

---

## 8. 씨앗(크레딧) 원칙

- 모든 크레딧 조작은 `lib/credits/transaction.ts`를 통해서만 합니다.
- 핵심 함수: `getCreditBalance`, `canSpendCredits`, `spendCredits`, `refundCredits`
- **씨앗 단가는 미확정 — 코드에 하드코딩 금지**
- 단가는 DB 설정 테이블(`settings`) 또는 환경변수로 관리 예정

---

## 9. 인증 원칙

- Google OAuth 단독 (Kakao 제외 — 글로벌 서비스 우선)
- 이메일 수집 필수 (결제 영수증 발송)
- Simulator는 비로그인 허용, 저장 시 로그인 유도 (`CM_002` 모달)
- 보호 라우트: `(app)/lorecraft`, `(app)/lorecheck`, `(app)/mypage`

---

## 10. 구현 우선순위

```
1. 앱 셸 — 레이아웃, 헤더, 푸터
2. 인증 — 로그인, 회원가입, 세션 훅
3. Simulator — 가장 단순한 수직 슬라이스 (AI 호출 구조 검증)
4. Lorecraft
5. Lorecheck Quick
6. 아카이브 / 작가 노트
7. Lorecheck Deep (2차)
```

> **Simulator 먼저 구현하는 이유**:
> AI 호출 → 결과 페이지 → 로그인 분기 → 저장까지
> 가장 짧은 파이프라인으로 전체 구조를 검증할 수 있습니다.

---

## 11. 미확정 항목 (TBD)

| 항목 | 상태 |
|---|---|
| 씨앗 기본 단가 | 토큰 비용 측정 후 결정 |
| 신규 가입 지급 씨앗 수 | 미정 |
| 작가 노트 에디터 형식 | 미정 (마크다운 vs 리치텍스트) |
| Lorecheck Deep | 2차 구현 |
| RAG 도입 시점 | 2차 구현 |
| 멀티모델 파이프라인 전환 | MVP 출시 후 |
