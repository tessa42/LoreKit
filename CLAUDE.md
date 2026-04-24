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
- 2026-04-10: Edge Runtime에서 Anthropic SDK `getDefaultAgent is not a function` 오류 → `getAnthropicClient()`에 `fetch: fetch` 명시 필수, 싱글턴 캐싱 금지
- 2026-04-11: ArchiveCard LoreCheckContent — issues 배열이 렌더링 안 되던 버그 수정. `payload.issues ?? []` 패턴 필수. type별 border/badge 스타일은 ISSUE_BORDER_CLASS, ISSUE_TYPE_BADGE_CLASS, ISSUE_SEVERITY_BADGE_CLASS 상수로 분리 관리.
- 2026-04-11: LoreCheckPayload 타입 확정 — `{ text, genre, issues, checked_at, existingSetting }`. `LorcheckIssue`는 src/types/lorecheck.ts에서 import. severity 뱃지는 intentional 타입 제외.

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

## 현재 진행 상황 (2026-04-15 기준, 2차 개선 완료)
### 완료
- 인증 (Google OAuth)
- Simulator 파이프라인 + UI
- My Page 아카이브 (탭 필터, 카드 렌더링)
- Lorecraft 파이프라인 8단계 + UI
- Lorecraft 결과 페이지 디자인 (마크다운 렌더링)
- Lorecheck Quick 파이프라인 (normalize → analyze → research → check → format + API route)
- Lorecheck Quick UI (입력 페이지 + 결과 페이지 — LorcheckForm, LorcheckResult 컴포넌트)
- ArchiveCard LoreCheckContent issues 렌더링 수정 (type별 border/badge 스타일, severity 뱃지, description/suggestion 표시, 빈 상태 메시지)
- 계정 페이지 (계정 정보 표시, 로그아웃, 회원 탈퇴 + POST /api/account/delete)
- 씨앗 구매 페이지 (/mypage/shop — ShopSection + POST /api/checkout)
  - 3종 패키지 (5씨앗 $4.99 / 12씨앗 $9.99 / 30씨앗 $23.99), Polar 체크아웃 연동
  - 웹훅 서명 검증 + addCreditsAdmin 호출 (POST /api/webhooks/polar)
  - 웹훅은 유저 세션 없음 → service role 클라이언트로 RLS 우회 (addCreditsAdmin in transaction.ts)
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
  - src/components/mypage/note/NoteEditorClient.tsx — 편집 루트 컴포넌트 (74줄)
  - src/components/mypage/note/useNoteEditor.ts — 편집 상태·API 훅 (156줄)
  - src/components/mypage/note/noteEditorUtils.ts — blockToSectionTitle/Content 유틸 + ArchiveItem 타입 (45줄)
  - src/components/mypage/note/NoteEditorHeader.tsx — 제목 인라인 편집 + 뒤로가기 (42줄)
  - src/components/mypage/note/NoteEditorActionBar.tsx — 블록 추가/아카이브/발행 액션 바 (54줄)
  - src/components/mypage/note/AddBlockMenu.tsx — 블록 타입 선택 드롭다운 메뉴 (51줄)
  - src/components/mypage/note/PublishLorebookModal.tsx — 로어북 선택 발행 모달 (77줄)
  - src/components/mypage/note/ImportArchiveModal.tsx — 아카이브 불러오기 모달 (49줄)
  - src/components/mypage/note/NoteBlockList.tsx — @dnd-kit 드래그 앤 드롭 블록 재배치
  - src/components/mypage/note/NoteBlockEditor.tsx — 타입 뱃지, 드래그 핸들, blur 시 자동 저장
  - 블록 6종: TextBlock / WorldOverviewBlock / SettingBlock / CharacterBlock / TimelineBlock / PlotBlock
  - 블록 본문(body, description 등) 표시 시 LorcraftMarkdown 컴포넌트로 렌더링 (TextBlock, WorldOverviewBlock, SettingBlock, CharacterBlock, TimelineBlock)
  - Lorecraft 아카이브 섹션 → world_overview 블록 일괄 변환 지원
  - 로어북으로 발행 버튼: 연결된 lorebook 있으면 POST /api/lorebooks/[id]/publish 직접 호출 후 뷰어로 이동
  - 연결된 lorebook 없으면 기존 로어북 선택 모달 표시 (PublishLorebookModal)
  - NoteEditorClient: linkedLorebookId prop 수신 → useNoteEditor에 전달 → handleOpenPublishModal에서 분기
- 로어북 저장/수정 플로우 개선 — 노트:로어북 1:1 구조 (Postype 스타일)
  - src/lib/supabase/migrations/004_lorebook_note_link.sql — lorebooks.source_note_id 컬럼 추가, 인덱스, 블록 없는 노트 정리
  - lorebooks.source_note_id: 연결된 작가노트 uuid (ON DELETE SET NULL)
  - 새 로어북 생성 시 같은 제목의 작가노트를 자동 생성 → source_note_id 연결
  - 새 로어북 생성 후 바로 연결된 작가노트 편집 페이지로 이동 (LorebookListClient)
  - 로어북 제목 수정 시 연결된 작가노트 제목도 동기화 (PUT /api/lorebooks/[id])
  - POST /api/lorebooks/[id]/publish — source_note_id 노트의 블록 전체를 섹션으로 덮어쓰기 발행
    - 기존 lorebook_sections 전부 DELETE 후 블록 → 섹션 새로 INSERT (note_block_id 연결)
    - 덮어쓰기 방식 (누적 아님)
- 로어북 UI — 섹션 기반 뷰어 시스템 (편집 기능 없음 — 작가 노트에서 담당)
  - src/app/(app)/mypage/lorebook/page.tsx — 로어북 목록 (서버 컴포넌트)
  - src/app/(app)/mypage/lorebook/[id]/page.tsx — 로어북 뷰어 페이지 (서버 컴포넌트, 섹션 조회)
  - src/components/mypage/lorebook/LorebookListClient.tsx — 목록 클라이언트 (생성/삭제, 생성 후 연결된 노트로 이동)
  - src/components/mypage/lorebook/LorebookCard.tsx — 로어북 카드 (공개 뱃지, 섹션 수, 수정 버튼, 삭제)
    - source_note_id 있으면 '수정' 버튼 → /mypage/note/[source_note_id]로 이동
  - src/components/mypage/lorebook/LorebookViewerClient.tsx — 뷰어 전용 UI
    - max-w-2xl 중앙 정렬, 제목 인라인 편집 (blur 시 PUT /api/lorebooks/[id])
    - 우상단: 공개/비공개 토글, '수정' 링크(연결된 노트), '발행' 버튼 (POST /api/lorebooks/[id]/publish)
    - 섹션: 제목 text-xl font-semibold mb-3, 내용 LorcraftMarkdown 컴포넌트로 렌더링
    - is_public=false 섹션에 비공개 뱃지, 섹션 사이 border-b 구분선, py-8 여백
    - 섹션 편집/추가/삭제/드래그 기능 없음 (읽기 전용)
  - src/components/mypage/lorebook/LorebookEditorClient.tsx — 미사용 (향후 제거 예정)
  - src/components/mypage/lorebook/LorebookSectionList.tsx — 섹션 목록 진입점, DnD 컨텍스트 래핑 (90줄)
  - src/components/mypage/lorebook/SectionItem.tsx — 개별 섹션 카드 (드래그 핸들, 인라인 제목/내용 편집, 공개/AI 토글, 삭제) (139줄)
  - src/components/mypage/lorebook/ImportModal.tsx — 작가 노트 블록 가져오기 모달 (75줄)
  - src/components/mypage/lorebook/useLorebookSections.ts — 섹션 목록 상태·API 훅 (119줄)
  - src/components/mypage/lorebook/lorebookSectionUtils.ts — 블록→섹션 변환 유틸 (blockToSection, blockPreview) (57줄)
  - API routes: GET/POST /api/lorebooks, GET/PUT/DELETE /api/lorebooks/[id], POST /api/lorebooks/[id]/publish, GET/POST /api/lorebooks/[id]/sections, PUT/DELETE /api/lorebooks/[id]/sections/[sectionId]
- Edge Runtime 제거 — Vercel Node.js Runtime으로 전환 완료
  - Anthropic SDK Edge Runtime 비호환 문제로 `export const runtime = 'edge'` 전체 라우트에서 제거
  - Vercel Node.js Runtime은 타임아웃 제한 없음 (300s 기본) → Edge Runtime 불필요
  - 스텁 파일 유지: /api/credits, /api/lorecheck/deep, /(app)/lorecheck/result-deep/page.tsx
- 씨앗 소모량 표시 + 씨앗 차감 로직 연결
  - Lorecraft 실행 버튼: `설정집 생성 🌱 5` 표시, 5씨앗 차감 (canSpendCredits → spendCredits)
  - Lorecheck Quick 실행 버튼: `고증 검토 실행 🌱 1` 표시, 1씨앗 차감 (canSpendCredits → spendCredits)
  - 두 API 라우트 모두 로그인 필수 확인 (401), 씨앗 부족 시 `insufficient_credits` 반환 (402)
  - 두 폼 컴포넌트 모두 `insufficient_credits` 응답 시 `/mypage/shop`으로 라우터 이동
- Lorecraft/Lorecheck API 씨앗 사전 검증 통일
  - `canSpendCredits(user.id, COST)`로 AI 파이프라인 실행 전 잔액 확인 (로그인 확인 직후)
  - 잔액 부족 시 파이프라인 진입 없이 즉시 402 반환 (`insufficient_credits`)
  - 실제 차감(`spendCredits`)은 파이프라인 실행 직전에 호출 — 실패 시 `refundCredits`로 환불
  - lorecraft: LORECRAFT_COST = 5, lorecheck/quick: LORECHECK_QUICK_COST = 1
- 씨앗 부족 모달 + 입력 내용 저장/복원
  - SeedShortageModal (src/components/common/SeedShortageModal.tsx) — 현재 잔액/필요 씨앗/부족 씨앗 표시, 확인/취소 버튼
  - `insufficient_credits` 응답 시 바로 이동 대신 SeedShortageModal 표시
  - 확인 버튼 누르면 입력 내용을 sessionStorage에 저장 후 /mypage/shop 이동
    - Lorecraft: `lorecraft_draft` 키 (background, genre, existingSetting, areas)
    - Lorecheck: `lorecheck_draft` 키 (text, genre, existingSetting)
  - 컴포넌트 마운트 시 해당 draft 키 있으면 복원 후 삭제
- LorcraftForm 리팩토링 — src/components/lorecraft/ 폴더 분리 완료
  - LorcraftForm.tsx — 루트 폼 컴포넌트 (98줄)
  - LorcraftInputFields.tsx — 입력 필드 UI 컴포넌트 (93줄)
  - LorcraftStreamingPreview.tsx — 스트리밍 진행 미리보기 컴포넌트 (36줄)
  - lorcraftFormConstants.ts — 상수/타입 (DRAFT_KEY, AREAS, STEP_LABELS, SseEvent 등) (40줄)
  - useLorcraftForm.ts — 폼 상태·API·SSE 스트림 처리 훅 (194줄)
- LorcheckForm 리팩토링 — src/components/lorecheck/ 폴더 분리 완료
  - LorcheckForm.tsx — 루트 폼 컴포넌트 (76줄)
  - LorcheckInputFields.tsx — 입력 필드 UI 컴포넌트 (69줄)
  - LorcheckProgressView.tsx — 진행 상태 뷰 컴포넌트 (15줄)
  - lorcheckFormConstants.ts — 상수/타입 (DRAFT_KEY, STEP_LABELS, Status, SseEvent 등) (25줄)
  - useLorcheckForm.ts — 폼 상태·API·SSE 스트림 처리 훅 (148줄)
- ArchiveCard 리팩토링 — src/components/mypage/archive/ 폴더 분리 완료
  - ArchiveCard.tsx — 루트 카드 컴포넌트 (31줄)
  - archive/ArchiveCardHeader.tsx — 타입 뱃지 + 날짜 + 삭제 버튼 헤더 (49줄)
  - archive/SimulatorContent.tsx — Simulator 아카이브 콘텐츠 (36줄)
  - archive/LoreCraftContent.tsx — Lorecraft 아카이브 콘텐츠, 섹션 토글 포함 (79줄)
  - archive/LoreCheckContent.tsx — Lorecheck 아카이브 콘텐츠, issue 목록 렌더링 (73줄)
  - archive/archiveCardUtils.ts — TYPE_LABEL, TYPE_BADGE_VARIANT, formatDate 유틸 (23줄)
- 닉네임 기능 — 프로필 닉네임 자동 부여 + 편집 + 헤더 표시
  - src/lib/supabase/migrations/003_nickname.sql — profiles.nickname 컬럼 추가, 랜덤 닉네임 생성 함수, 신규 가입 트리거, 기존 계정 일괄 부여
  - src/hooks/useProfile.ts — 로그인 유저 프로필(nickname, display_name, avatar_url) 실시간 구독 훅
  - src/components/layout/Header.tsx — nickname → display_name → 'My Page' 폴백 순서로 표시
  - src/components/mypage/AccountSection.tsx — 닉네임 인라인 편집 UI (2~16자, 한글/영문/숫자 유효성 검사)
  - src/app/(app)/mypage/account/page.tsx — 서버에서 nickname 조회 후 AccountSection에 전달
  - src/app/api/profile/nickname/route.ts — PUT /api/profile/nickname (로그인 필수, 유효성 검사, profiles 업데이트)
- 로어북 저장/수정 플로우 2차 개선 (2026-04-15)
  - GET /api/lorebooks: ?source_note_id={noteId} 쿼리 파라미터 필터 지원
  - 작가 노트 '로어북으로 발행' 버튼 개선 (useNoteEditor.handleOpenPublishModal)
    - source_note_id로 연결된 로어북 자동 탐색 → 없으면 자동 생성 → 발행 → 뷰어 이동
    - 연결된 로어북이 있을 때는 모달 없이 바로 발행
  - 로어북 목록 카드(LorebookCard): source_note_id 있으면 '수정' 버튼 표시 → /mypage/note/[source_note_id] 이동
  - 로어북 뷰어(LorebookViewerClient): 제목 인라인 편집 제거(읽기 전용), '수정하기' + '발행하기' 버튼 상단 고정
  - docs/PLAN.md에 '추후 기능: 로어북 표지 업로드' 섹션 추가 (Supabase Storage 버킷 lorebook-covers)
- 작가노트 제목 변경 시 연결된 로어북 제목 자동 동기화 (2026-04-15)
  - PUT /api/notes/[id]: title 업데이트 후 source_note_id로 연결된 lorebook 조회 → lorebook.title 동기화
  - 서버사이드 처리 (API route) — 클라이언트 추가 호출 불필요
  - 로어북 제목 수정(PUT /api/lorebooks/[id])도 동일하게 source_note 제목 동기화 기존 구현과 대칭 구조
- 클라이언트 연결 끊김 처리 (2026-04-21)
  - src/app/api/lorecraft/route.ts — request.signal 수신, 각 파이프라인 단계 전 signal.aborted 체크, AbortError 조용히 종료
  - src/app/api/lorecheck/quick/route.ts — 동일 패턴 적용
  - send() 함수 내부 try-catch로 스트림 write 실패 시 조용히 무시 (연결 끊김 방어)
- 로그인 상태에서 메인 페이지(/) 접속 시 /dashboard로 리다이렉트 (2026-04-21)
  - src/app/(app)/page.tsx — 서버 컴포넌트에서 supabase.auth.getUser() 확인 후 user 있으면 redirect('/dashboard')
- 씨앗 관련 함수 전체 service role client 적용 (2026-04-24)
  - src/lib/credits/transaction.ts — spendCredits/getCreditBalance/canSpendCredits/refundCredits 모두 getServiceClient() 사용
  - RLS 우회로 웹훅/서버사이드 컨텍스트에서도 안정적으로 동작
  - addCreditsAdmin은 기존부터 service role 사용 중 (변경 없음)
- 씨앗 차감 시점 변경 — 파이프라인 실행 직전으로 (2026-04-24)
  - lorecraft/route.ts, lorecheck/quick/route.ts — spendCredits를 스트림 시작 전(파이프라인 진입 전)에 호출
  - 파이프라인 실패(AbortError 제외) 시 refundCredits로 자동 환불
  - 흐름: canSpendCredits → spendCredits → 파이프라인 실행 → (실패 시 refundCredits)

### 진행중
- (없음)

### 다음
- 씨앗 단가 확정 (토큰 비용 측정 후)
- Lorecraft 속도 최적화 (현재 2.6분 → 목표 30초 이내)
- 로어북 표지 업로드 (docs/PLAN.md 참조)

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
