# Lorekit — Claude Code 작업 규칙

## 필수 규칙

1. **큰 변경 전 반드시 먼저 물어볼 것**
   - 여러 파일을 동시에 수정해야 한다면 실행 전에 계획을 먼저 설명하고 승인을 받아라.
   - 예상 수정 범위가 3개 파일 이상이면 무조건 먼저 물어볼 것.

2. **요청이 불명확하면 실행하지 말 것**
   - 요청 내용이 명확하지 않을 때는 실행하지 말고, 내용을 제대로 이해했는지 먼저 말해라.

3. **기존 코드를 함부로 삭제하지 말 것**
   - 수정은 최소한으로. 요청한 부분만 건드릴 것.
   - 전체 파일을 새로 쓰지 말고 필요한 부분만 교체할 것.

4. **모듈화 원칙 유지**
   - 하나의 파일에 모든 코드를 넣지 말 것.
   - 컴포넌트, 훅, 유틸리티는 반드시 분리할 것.

5. **docs/overview.md를 항상 참조할 것**
   - 폴더 구조, AI 호출 원칙, 씨앗 처리 원칙을 따를 것.
   - AI 호출은 lib/ai/anthropic.ts 또는 lib/ai/openai.ts를 통해서만 할 것.
   - 씨앗 처리는 lib/credits/transaction.ts를 통해서만 할 것.

## ❌ 반복 실수 기록 (세션마다 확인)
- 2026-04-06: AI 응답 JSON 파싱 시 ```json 블록 포함될 수 있음 → 항상 extractJson() 사용 (src/lib/ai/pipeline/lorecraft/utils.ts)
- 2026-04-06: max_tokens 부족으로 JSON 잘림 → research 4096, synthesize/review/plan 4096 유지
- 2026-04-06: useState(initialItems)는 props 변경 시 자동 갱신 안 됨 → useEffect로 동기화 필요
- 2026-04-06: Codespace 재시작 시 포트 3000 충돌 → kill [PID] 후 npm run dev
- 2026-04-06: Supabase Redirect URL은 Codespace URL 변경 시 반드시 업데이트

## 검증 원칙
- 코드 작성 후 반드시 실행: npx tsc --noEmit
- 타입 에러 0개 확인 후 작업 완료 선언
- 3회 시도 후에도 실패 시 같은 방법 반복 금지, 다른 접근법 먼저 제안

## 검증 루프 워크플로우
1. 구현 완료
2. npx tsc --noEmit 통과 확인
3. reviewer 에이전트에서 코드 리뷰
4. 이슈 없으면 main merge

## 테스트 환경 (미설치 — MVP 이후 세팅 예정)
- 테스트 프레임워크: Vitest (예정)
- 테스트 작성: tester 에이전트 담당

## 현재 진행 상황 (2026-04-10 기준, Edge Runtime 적용 완료)
### 완료
- 인증 (Google OAuth)
- Simulator 파이프라인 + UI
- My Page 아카이브 (탭 필터, 카드 렌더링)
- Lorecraft 파이프라인 8단계 + UI
- Lorecraft 결과 페이지 디자인 (마크다운 렌더링)
- Lorecheck Quick 파이프라인 (normalize → analyze → research → check → format + API route)
- Lorecheck Quick UI (입력 페이지 + 결과 페이지 — LorcheckForm, LorcheckResult 컴포넌트)
- 계정 페이지 (계정 정보 표시, 로그아웃, 회원 탈퇴 + POST /api/account/delete)
- 씨앗 구매 페이지 (/mypage/shop — ShopSection + POST /api/checkout)
  - 3종 패키지 (5씨앗 $4.99 / 12씨앗 $9.99 / 30씨앗 $23.99), Polar 체크아웃 연동
  - 웹훅 서명 검증 + addCredits 호출 (POST /api/webhooks/polar)
- 결제 내역 페이지 (/mypage/billing — BillingSection, 거래 이력 목록)
- Header 씨앗 버튼 → /mypage/shop 이동
- MypageNav: 씨앗 구매(/mypage/shop) + 결제 내역(/mypage/billing) 분리
- 신규 가입 씨앗 6개 자동 지급 (Supabase DB Function + Trigger — src/lib/supabase/migrations/001_signup_credits.sql)
- 작가 노트 + 로어북 구조 개편 마이그레이션 — src/lib/supabase/migrations/002_notes_lorebook_redesign.sql
  - notes.content 컬럼 제거 (블록 구조 전환)
  - note_blocks 테이블 신규 생성 (RLS + 트리거 + 인덱스 포함)
  - lorebooks.is_public 컬럼 추가
  - lorebook_sections에 note_block_id, is_public, is_usable 컬럼 추가
- 법적 문서 페이지 3종 — (legal) 라우트 그룹으로 통합
  - src/app/(legal)/layout.tsx — 법적 문서 전용 헤더/푸터
  - src/app/(legal)/terms/page.tsx — 서비스 이용약관 (15개 섹션)
  - src/app/(legal)/privacy/page.tsx — 개인정보처리방침 (12개 섹션)
  - src/app/(legal)/refund/page.tsx — 환불 정책 (7개 섹션, Polar MoR 기준)
  - Footer.tsx에 /terms /privacy /refund 링크 포함
- 작가 노트 UI — 블록 기반 노트 편집 시스템
  - src/app/(app)/mypage/note/page.tsx — 노트 목록 (생성/삭제/이동)
  - src/app/(app)/mypage/note/[id]/page.tsx — 노트 편집 페이지 (서버 컴포넌트)
  - src/components/mypage/note/NoteListClient.tsx — 노트 카드 목록 클라이언트
  - src/components/mypage/note/NoteEditorClient.tsx — 제목 인라인 편집, 블록 추가 드롭다운, 아카이브 불러오기 모달
  - src/components/mypage/note/NoteBlockList.tsx — @dnd-kit 드래그 앤 드롭 블록 재배치
  - src/components/mypage/note/NoteBlockEditor.tsx — 타입 뱃지, 드래그 핸들, blur 시 자동 저장
  - 블록 6종: TextBlock / WorldOverviewBlock / SettingBlock / CharacterBlock / TimelineBlock / PlotBlock
  - 블록 본문(body, description 등) 표시 시 LorcraftMarkdown 컴포넌트로 렌더링 (TextBlock, WorldOverviewBlock, SettingBlock, CharacterBlock, TimelineBlock)
  - Lorecraft 아카이브 섹션 → world_overview 블록 일괄 변환 지원
  - 로어북으로 발행 버튼 활성화 (로어북 선택 모달 → 블록 → 섹션 변환 후 이동)
- 로어북 UI — 섹션 기반 뷰어 시스템 (편집 기능 없음 — 작가 노트에서 담당)
  - src/app/(app)/mypage/lorebook/page.tsx — 로어북 목록 (서버 컴포넌트)
  - src/app/(app)/mypage/lorebook/[id]/page.tsx — 로어북 뷰어 페이지 (서버 컴포넌트, 섹션 조회)
  - src/components/mypage/lorebook/LorebookListClient.tsx — 목록 클라이언트 (생성/삭제)
  - src/components/mypage/lorebook/LorebookCard.tsx — 로어북 카드 (공개 뱃지, 섹션 수, 삭제)
  - src/components/mypage/lorebook/LorebookViewerClient.tsx — 뷰어 전용 UI
    - max-w-2xl 중앙 정렬, 제목 text-3xl font-bold
    - 우상단: 전체 공개/비공개 토글 버튼 + '작가 노트에서 편집' 링크(/mypage/note)
    - 섹션: 제목 text-xl font-semibold mb-3, 내용 LorcraftMarkdown 컴포넌트로 렌더링
    - is_public=false 섹션에 비공개 뱃지, 섹션 사이 border-b 구분선, py-8 여백
    - 섹션 편집/추가/삭제/드래그 기능 없음 (읽기 전용)
  - src/components/mypage/lorebook/LorebookEditorClient.tsx — 미사용 (향후 제거 예정)
  - src/components/mypage/lorebook/LorebookSectionList.tsx — 미사용 (향후 제거 예정)
  - API routes: GET/POST /api/lorebooks, GET/PUT/DELETE /api/lorebooks/[id], GET/POST /api/lorebooks/[id]/sections, PUT/DELETE /api/lorebooks/[id]/sections/[sectionId]
- Cloudflare Pages Edge Runtime 적용 — 전체 라우트 확장 완료
  - `export const runtime = 'edge'` 전체 API 라우트 + 페이지 파일에 적용
    - API: auth/callback, auth/signin, lorebooks (4개 라우트), notes (4개 라우트), lorecraft, lorecheck/quick, simulator, account/delete, checkout, webhooks/polar
    - 페이지: (auth)/login, (auth)/signup, mypage (page, account, archive, billing, shop, lorebook, lorebook/[id], note, note/[id])
  - next.config.ts: @cloudflare/next-on-pages 관련 코드 제거됨 (wrangler 의존성 빌드 실패 문제로)
  - wrangler.toml: name + compatibility_date + nodejs_compat + [vars] NEXT_PUBLIC_APP_URL만 유지 (간소화)
  - @cloudflare/next-on-pages: devDependencies에서 완전 제거
  - 스텁 파일 모듈화: /api/credits, /api/lorecheck/deep, /(app)/lorecheck/result-deep/page.tsx

### 진행중
- (없음)

### 다음
- 씨앗 단가 확정 (토큰 비용 측정 후)
- Lorecraft 속도 최적화 (현재 2.6분 → 목표 30초 이내, Edge Runtime으로 타임아웃은 해결됨)

## 에이전트 구조 (Layer 1 조율 지침)

### Layer 2 — 전문가 에이전트
| 에이전트 | 디렉토리 | 역할 |
|---|---|---|
| reviewer | ../lorekit-reviewer | 코드 리뷰 + tsc |
| pipeline | ../lorekit-pipeline | AI 파이프라인 |
| ui | ../lorekit-ui | 컴포넌트/페이지 |
| security | ../lorekit-security | 보안 검토 |
| tester | ../lorekit-tester | 테스트 작성 |

### Layer 3 — 실행자 에이전트
| 에이전트 | 디렉토리 | 역할 |
|---|---|---|
| builder | ../lorekit-builder | 빌드 에러 수정 |
| refactor | ../lorekit-refactor | 코드 정리 |
| docs | ../lorekit-docs | 문서 작성 |
| lorecraft-pipeline | src/lib/ai/pipeline/lorecraft/ | Lorecraft 실행 |
| lorecheck-pipeline | src/lib/ai/pipeline/lorecheck/ | Lorecheck 실행 |
| simulator-pipeline | src/lib/ai/pipeline/simulator/ | Simulator 실행 |

### 기능 구현 표준 워크플로우
1. 메인 세션: 기능 구현
2. reviewer 세션: 코드 리뷰 + tsc 확인
3. tester 세션: 테스트 작성
4. security 세션: 보안 이슈 체크 (API/인증 관련 시)
5. docs 세션: 문서 업데이트
6. 이슈 없으면 main 브랜치에 merge

### 언제 어떤 에이전트를 쓰는가
- 파이프라인 수정/추가 → pipeline 에이전트
- UI 컴포넌트/페이지 → ui 에이전트
- 빌드 에러 → builder 에이전트
- 코드가 복잡해졌다 싶으면 → refactor 에이전트
- 기능 완료 후 → reviewer → tester → docs 순서
