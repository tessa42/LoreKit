# Lorekit 구현 계획

## Lorecheck Quick 구현 계획

### 기능 개요
유저가 시놉시스/플롯/원고를 입력하면 현실 고증 오류, 내부 설정 충돌, 개연성 문제를 점검해주는 기능.

### 입력
- 장르 (선택)
- 검토할 텍스트 (시놉시스/플롯/원고, 필수)
- 기존 설정 (선택)

### 출력
- 발견된 문제 목록 (유형, 심각도, 설명, 개선 제안)

### 파이프라인
Lorecraft와 동일한 구조 참고:
normalize → analyze → check → format

### API route
POST /api/lorecheck/quick
SSE 스트리밍

### 씨앗
단가 미확정 — 일단 0으로 진행

### 파일 구조
- src/lib/ai/pipeline/lorecheck/quick/
- src/app/api/lorecheck/quick/route.ts
- src/app/(app)/lorecheck/page.tsx
- src/app/(app)/lorecheck/result/page.tsx
- src/components/lorecheck/

### 미확정
- 씨앗 단가
- Deep 버전 파이프라인 (2차)
