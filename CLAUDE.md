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

## 현재 진행 상황 (2026-04-08 기준)
### 완료
- 인증 (Google OAuth)
- Simulator 파이프라인 + UI
- My Page 아카이브 (탭 필터, 카드 렌더링)
- Lorecraft 파이프라인 8단계 + UI
- Lorecraft 결과 페이지 디자인 (마크다운 렌더링)
- Lorecheck Quick 파이프라인 (normalize → analyze → research → check → format + API route)
- Lorecheck Quick UI (입력 페이지 + 결과 페이지 — LorcheckForm, LorcheckResult 컴포넌트)

### 진행중
- 계정 페이지 (로그아웃 버튼)

### 다음
- 씨앗 단가 확정 (토큰 비용 측정 후)
- Lorecraft 속도 최적화 (현재 2.6분 → 목표 30초 이내)

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
