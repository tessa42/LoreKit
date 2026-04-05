# LoreKit — Worldbuilding Assistant

창작자를 위한 세계관 놀이터. 세계관을 만들고, 검토하고, 저장하고, 확장한다.

> 기획 문서 전체는 [`docs/`](./docs/) 참고.

---

## 서비스 개요

| 기능 | 화면 ID | 설명 |
|---|---|---|
| **Lorecraft** | LT_001–002 | 장르·배경·플롯 입력 → AI 세계관 설정집 생성 |
| **Lorecheck** | LK_001–003 | 플롯·원고 입력 → 개연성·유사도 검토 리포트 |
| **Simulator** | SI_001–002 | 캐릭터 이름 입력 → 세계관 서사 카드 생성 (비로그인 가능) |
| **내 서재** | MY_LB_001–004 | 아카이브 · 작가 노트 · 로어 북 관리 |

---

## 기술 스택

| 항목 | 선택 |
|---|---|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS |
| DB / Auth | Supabase (Google OAuth) |
| AI | Claude Sonnet (생성) + GPT-4o (전처리) |
| 결제 | Polar |
| 이메일 | Resend |
| 배포 | Cloudflare Pages |

---

## 프로젝트 구조

```
lorekit/
├── docs/                         # 기획·스펙·LLM 컨텍스트 문서
│   ├── overview.md               # 서비스 개요
│   ├── ia.md                     # IA 정보구조도
│   ├── spec/                     # 기능명세서 (화면 ID 기준)
│   │   ├── CM_AU.md              # 공통 모달·인증
│   │   ├── LT.md                 # Lorecraft
│   │   ├── LK.md                 # Lorecheck
│   │   ├── SI.md                 # Simulator
│   │   └── MY.md                 # My Page
│   ├── pipeline/                 # AI 파이프라인 스펙
│   │   ├── lorecraft.md
│   │   ├── lorecheck.md
│   │   └── simulator.md
│   └── llm-context/              # LLM이 읽는 컨텍스트 문서
│       ├── polar.txt
│       ├── supabase-schema.md
│       ├── anthropic-api.md
│       └── openai-api.md
│
├── public/                       # 외부 URL로 직접 접근하는 정적 파일
│   ├── favicon.ico
│   ├── og-image.png
│   ├── robots.txt
│   └── images/
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── _readme.md
│   │   ├── (auth)/               # 인증 페이지 (URL 영향 없음)
│   │   │   ├── login/page.tsx    # AU_001
│   │   │   └── signup/page.tsx   # AU_002
│   │   ├── (app)/                # GN+FT 레이아웃 적용 영역
│   │   │   ├── layout.tsx        # Header + Footer 공통 레이아웃
│   │   │   ├── page.tsx          # HM_001 홈
│   │   │   ├── lorecraft/
│   │   │   │   ├── page.tsx      # LT_001 입력
│   │   │   │   └── result/page.tsx  # LT_002 결과
│   │   │   ├── lorecheck/
│   │   │   │   ├── page.tsx      # LK_001 입력
│   │   │   │   └── result/page.tsx  # LK_002 Quick / LK_003 Deep
│   │   │   └── simulator/
│   │   │       ├── page.tsx      # SI_001 입력
│   │   │       └── result/page.tsx  # SI_002 결과
│   │   ├── mypage/
│   │   │   ├── layout.tsx
│   │   │   ├── archive/page.tsx          # MY_LB_001
│   │   │   ├── note/page.tsx             # MY_LB_002
│   │   │   ├── lorebook/
│   │   │   │   ├── page.tsx              # MY_LB_003 목록
│   │   │   │   └── [id]/page.tsx         # MY_LB_004 상세
│   │   │   ├── account/page.tsx          # MY_AC_001
│   │   │   └── billing/page.tsx          # MY_BL_001
│   │   ├── api/
│   │   │   ├── auth/callback/route.ts    # Google OAuth 콜백
│   │   │   ├── lorecraft/route.ts
│   │   │   ├── lorecheck/route.ts
│   │   │   ├── simulator/route.ts
│   │   │   ├── credits/route.ts
│   │   │   └── webhooks/polar/route.ts   # Polar 결제 웹훅
│   │   ├── terms/page.tsx        # FT_002
│   │   ├── refund/page.tsx       # FT_003
│   │   ├── privacy/page.tsx      # FT_004
│   │   ├── layout.tsx            # 루트 레이아웃
│   │   └── globals.css
│   │
│   ├── components/               # UI 컴포넌트
│   │   ├── _readme.md
│   │   ├── common/               # 공통 모달 (CM)
│   │   │   ├── SeedShortageModal.tsx   # CM_001 씨앗 부족 팝업
│   │   │   └── LoginPromptModal.tsx    # CM_002 로그인 유도 팝업
│   │   ├── layout/
│   │   │   ├── Header.tsx        # GN_001 네비게이션 바
│   │   │   └── Footer.tsx        # FT_001 푸터
│   │   ├── lorecraft/
│   │   ├── lorecheck/
│   │   ├── simulator/
│   │   └── mypage/
│   │
│   ├── lib/                      # 외부 서비스 클라이언트 + 핵심 로직
│   │   ├── _readme.md
│   │   ├── supabase/
│   │   │   ├── client.ts         # 브라우저용 Supabase 클라이언트
│   │   │   └── server.ts         # 서버용 Supabase 클라이언트
│   │   ├── ai/
│   │   │   ├── _readme.md        # 모델 교체 시 이 폴더만 수정
│   │   │   ├── pipeline/
│   │   │   │   ├── lorecraft.ts  # LT AI 파이프라인
│   │   │   │   ├── lorecheck.ts  # LK AI 파이프라인
│   │   │   │   └── simulator.ts  # SI AI 파이프라인
│   │   │   ├── openai.ts         # GPT 클라이언트 (전처리·분류)
│   │   │   └── anthropic.ts      # Claude 클라이언트 (생성·검토)
│   │   ├── polar/
│   │   │   └── client.ts         # Polar 결제 클라이언트
│   │   ├── resend/
│   │   │   └── client.ts         # Resend 이메일 클라이언트
│   │   └── credits/
│   │       └── transaction.ts    # 씨앗 원자적 처리 (RPC 기반)
│   │
│   ├── types/                    # 전역 타입 정의
│   │   ├── auth.ts
│   │   ├── credits.ts
│   │   ├── lorecraft.ts
│   │   ├── lorecheck.ts
│   │   ├── simulator.ts
│   │   └── mypage.ts
│   │
│   ├── hooks/                    # 커스텀 React 훅
│   │   ├── useAuth.ts            # 인증 상태
│   │   ├── useCredits.ts         # 씨앗 잔액 조회·구독
│   │   └── useSession.ts         # 세션 관리
│   │
│   ├── assets/                   # 코드에서 import하는 리소스
│   │   ├── icons/
│   │   └── images/
│   │
│   └── utils/
│       ├── format.ts             # 날짜·숫자 포맷
│       └── validate.ts           # 입력값 검증
│
├── README.md
├── .dev.vars                     # 로컬 환경변수 (gitignore)
├── .dev.vars.example             # 환경변수 목록 (git 포함)
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── wrangler.toml                 # Cloudflare Pages 배포 설정
└── package.json
```

---

## 로컬 개발 환경 세팅

### 사전 준비
- Node.js 20.19+
- GitHub Codespace 또는 로컬 환경
- Supabase 프로젝트
- Cloudflare 계정

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

```bash
cp .dev.vars.example .dev.vars
```

`.dev.vars` 파일에 다음 값 입력:

```
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
RESEND_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
```

### 3. 개발 서버 실행

```bash
npm run dev
# http://localhost:3000
```

---

## 프로덕션 배포

```bash
npm run build
npm run deploy
```

Cloudflare Pages 대시보드 → Settings → Environment Variables에서 `.dev.vars`와 동일한 환경변수 설정.

---

## AI 파이프라인 구조

단계별로 역할에 맞는 모델을 배치한다. 자세한 스펙은 [`docs/pipeline/`](./docs/pipeline/) 참고.

| 단계 | 역할 | 모델 |
|---|---|---|
| 전처리 | 입력 정제·분류·검증 | GPT-4o mini |
| 중간 처리 | 설정 추출·충돌 탐지 | GPT-4o |
| 최종 생성 | 설정집 문체·서사 생성 | Claude Sonnet |
| 포맷 정리 | 출력 구조화 | Claude Haiku |

---

## 씨앗(크레딧) 시스템

- 씨앗은 `lib/credits/transaction.ts`에서 Supabase RPC를 통해 원자적으로 처리된다.
- 차감 실패 시 롤백 보장. 레이스 컨디션 방지.
- 기능별 씨앗 단가는 AI 파이프라인 토큰 비용 확정 후 책정 예정.

---

## 환경변수 목록

| 변수명 | 용도 |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API |
| `OPENAI_API_KEY` | GPT API |
| `POLAR_ACCESS_TOKEN` | Polar 결제 |
| `POLAR_WEBHOOK_SECRET` | Polar 웹훅 서명 검증 |
| `RESEND_API_KEY` | 이메일 발송 |
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_KEY` | Supabase 서비스 롤 키 |

---

*"Every world has a logic. My job is to find where yours bends." — LoreKit 🐱*