#!/bin/bash
set -euo pipefail

# ─── 사용법 ───────────────────────────────────────────────
# ./scripts/orchestrate.sh "lorecheck quick 구현"
# ─────────────────────────────────────────────────────────

TASK="${1:-}"
if [[ -z "$TASK" ]]; then
  echo "사용법: $0 \"태스크 설명\""
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

LOG_DIR="$ROOT_DIR/scripts/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/orchestrate-$(date +%Y%m%d-%H%M%S).log"

# ─── 유틸 ─────────────────────────────────────────────────
log() { echo "[$(date +%H:%M:%S)] $*" | tee -a "$LOG_FILE"; }
section() { echo "" | tee -a "$LOG_FILE"; log "━━━ $* ━━━"; }

# ─── 에이전트 system prompt 정의 ──────────────────────────
PIPELINE_SYSTEM="당신은 LoreKit AI 파이프라인 전담 에이전트입니다.
담당 범위: src/lib/ai/pipeline/**, src/app/api/**
규칙:
- 파이프라인 추가 시 반드시 extractJson() 사용 (src/lib/ai/pipeline/lorecraft/utils.ts 참고)
- max_tokens: analyze/plan/synthesize/review 4096, generate 스트리밍
- 모델: MODELS.sonnet → research/generate, MODELS.haiku → analyze/plan/synthesize/review
- 새 파이프라인 구조: normalize → analyze → ... → generate → format
- AI 호출은 lib/ai/anthropic.ts 또는 lib/ai/openai.ts를 통해서만 할 것
- UI 수정 금지
- 작업 완료 후 npx tsc --noEmit 실행하여 타입 에러 확인"

UI_SYSTEM="당신은 LoreKit UI/컴포넌트 전담 에이전트입니다.
담당 범위: src/components/**, src/app/(app)/**
규칙:
- CSS 변수(var(--accent) 등) 사용, 색상 하드코딩 금지
- ui/ 컴포넌트(Button, Input, Textarea, Card, Badge, TagButton) 우선 재사용
- 'use client'는 필요한 경우에만 사용
- 마크다운 렌더링 필요 시 LorcraftMarkdown 컴포넌트 재사용
- 스트리밍 미리보기는 LorcraftForm의 StreamingPreview 패턴 참고
- 파이프라인/API 수정 금지
- 작업 완료 후 npx tsc --noEmit 실행하여 타입 에러 확인"

REVIEWER_SYSTEM="당신은 LoreKit 코드 리뷰 전담 에이전트입니다.
새 기능 구현 금지. 리뷰와 수정만 담당.
작업 시작 시 반드시 npx tsc --noEmit 실행.
체크 항목:
- 타입 에러 및 any 타입 사용 여부
- 미사용 import
- 누락된 에러 처리 (try/catch)
- 파이프라인 파일에서 extractJson() 누락 여부
- max_tokens 설정 (research/synthesize/review/plan: 4096 이상)
- useEffect 의존성 배열 누락 여부
문제 발견 시 직접 수정 후 재검증. 3회 시도 후 실패 시 보고."

DOCS_SYSTEM="당신은 LoreKit 문서 작성 전담 에이전트입니다.
코드 수정 금지. 문서 작업만 담당.
작업:
- 새 기능 추가 시 docs/overview.md 업데이트
- 파이프라인 변경 시 docs/pipeline/ 해당 파일 업데이트
- CLAUDE.md 현재 진행 상황 업데이트"

# ─── 에이전트 실행 함수 ───────────────────────────────────
run_agent() {
  local label="$1"
  local system_prompt="$2"
  local user_prompt="$3"

  log "[$label] 시작"

  local agents_json
  agents_json=$(printf '{"type":"custom","system":"%s"}' \
    "$(echo "$system_prompt" | tr '\n' ' ' | sed 's/"/\\"/g')")

  if claude \
    --agents "[${agents_json}]" \
    --add-dir "$ROOT_DIR" \
    -p "$user_prompt" \
    2>&1 | tee -a "$LOG_FILE"; then
    log "[$label] 완료"
    return 0
  else
    log "[$label] 실패"
    return 1
  fi
}

# ─── 태스크 분석 ──────────────────────────────────────────
section "태스크 분석"
log "태스크: $TASK"

NEEDS_PIPELINE=false
NEEDS_UI=false

if echo "$TASK" | grep -qiE "파이프라인|pipeline|api|route|ai|단계|stage|스트리밍|streaming|추출|extract|프롬프트|prompt"; then
  NEEDS_PIPELINE=true
fi

if echo "$TASK" | grep -qiE "ui|페이지|page|컴포넌트|component|폼|form|버튼|button|디자인|화면|레이아웃|layout|렌더링"; then
  NEEDS_UI=true
fi

if [[ "$NEEDS_PIPELINE" == false && "$NEEDS_UI" == false ]]; then
  log "키워드 매칭 없음 → pipeline + ui 모두 실행"
  NEEDS_PIPELINE=true
  NEEDS_UI=true
fi

log "pipeline: $NEEDS_PIPELINE / ui: $NEEDS_UI"

# ─── 구현 단계 ────────────────────────────────────────────
IMPL_OK=true

if [[ "$NEEDS_PIPELINE" == true ]]; then
  section "1단계: Pipeline 에이전트"
  run_agent "pipeline" "$PIPELINE_SYSTEM" "$TASK" || IMPL_OK=false
fi

if [[ "$NEEDS_UI" == true && "$IMPL_OK" == true ]]; then
  section "2단계: UI 에이전트"
  run_agent "ui" "$UI_SYSTEM" "$TASK" || IMPL_OK=false
fi

if [[ "$IMPL_OK" == false ]]; then
  log "구현 단계 실패. 오케스트레이션 중단."
  exit 1
fi

# ─── 리뷰 단계 ────────────────────────────────────────────
section "3단계: Reviewer 에이전트"
REVIEW_OK=true
run_agent "reviewer" "$REVIEWER_SYSTEM" "다음 태스크 구현 결과를 리뷰해줘: $TASK" || REVIEW_OK=false

if [[ "$REVIEW_OK" == false ]]; then
  log "리뷰 실패. docs 단계를 건너뜁니다."
  log "로그 파일: $LOG_FILE"
  exit 1
fi

# ─── 문서 단계 ────────────────────────────────────────────
section "4단계: Docs 에이전트"
run_agent "docs" "$DOCS_SYSTEM" "다음 태스크 완료 후 문서를 업데이트해줘: $TASK" \
  || log "[docs] 실패 (선택적 — 수동으로 재시도 가능)"

# ─── 완료 리포트 ──────────────────────────────────────────
section "완료 리포트"
log "태스크:   $TASK"
log "pipeline: $NEEDS_PIPELINE"
log "ui:       $NEEDS_UI"
log "review:   $REVIEW_OK"
log "로그:     $LOG_FILE"
log "오케스트레이션 완료."
