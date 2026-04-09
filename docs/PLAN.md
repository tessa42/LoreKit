# Lorekit 구현 계획

## Lorecheck Quick 구현 계획 ✅ 완료 (2026-04-07)

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

### 파일 구조 (구현 완료)
- src/lib/ai/pipeline/lorecheck/quick/normalize.ts  ← 입력 검증
- src/lib/ai/pipeline/lorecheck/quick/analyze.ts    ← Haiku, 장르/시대/배경 분석
- src/lib/ai/pipeline/lorecheck/quick/check.ts      ← Sonnet, 몰입 파괴 통합 판단
- src/lib/ai/pipeline/lorecheck/quick/format.ts     ← payload 변환 (AI 없음)
- src/app/api/lorecheck/quick/route.ts              ← POST, SSE 스트리밍
- src/app/(app)/lorecheck/page.tsx
- src/app/(app)/lorecheck/result/page.tsx
- src/components/lorecheck/

### 검토 철학
Lorecheck는 단순 오류 탐지가 아니라 독자 몰입 관점에서 판단한다.

세 가지를 통합적으로 판단:
- 몰입 파괴 오류: 현실과 달라서 독자가 위화감을 느낄 수 있는 고증 오류
- 의도적 상상력: 현실과 다르지만 작품 맥락상 허용되거나 오히려 강점인 요소 → 오류로 분류하지 않음
- 내부자 맥락: 해당 문화/직군/집단에 속한 독자만 알 수 있는 현실 규칙 위반

판단 원칙:
- 확신 없으면 지적하지 않음
- 장르 관습은 오류가 아님
- 의도적 재해석이 명백한 경우 오류 분류 금지
- 지적 시 반드시 "왜 독자가 위화감을 느끼는가" 근거 제시

출력 타입:
- type: 'immersion_break' | 'intentional' | 'insider_context'
- severity: 'high' | 'medium' | 'low' (intentional은 없음)
- description: 판단 근거
- suggestion: 수정 방향 또는 강점을 살리는 방법

### 미확정
- 씨앗 단가
- Deep 버전 파이프라인 (2차)

---

## 작가 노트 + 로어북 설계

### 전체 데이터 흐름

```
아카이브(archive_items) → 작가 노트(notes + note_blocks) → 로어북(lorebooks + lorebook_sections)
```

### DB 구조

#### notes 테이블 (기존 content text 컬럼 제거, 블록 구조로 전환)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK→profiles | |
| title | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

> ⚠️ 기존 `content text` 컬럼 제거 — 블록(note_blocks)으로 대체

#### note_blocks 테이블 (신규)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| note_id | uuid FK→notes | |
| user_id | uuid FK→profiles | |
| type | text | `text \| character \| timeline \| plot \| org_chart \| scenario \| world_overview \| setting` |
| content | jsonb | 블록 타입별 구조화 데이터 |
| order_index | integer default 0 | 블록 순서 |
| source_archive_id | uuid nullable FK→archive_items | 아카이브 불러오기 시 원본 참조 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### lorebooks 테이블 추가 컬럼
| 컬럼 | 타입 | 설명 |
|---|---|---|
| is_public | boolean default false | 전체 공개 여부 |

#### lorebook_sections 테이블 추가 컬럼
| 컬럼 | 타입 | 설명 |
|---|---|---|
| note_block_id | uuid nullable FK→note_blocks | 연결된 노트 블록 |
| is_public | boolean default false | 섹션 개별 공개 여부 |
| is_usable | boolean default false | 추후 활용 요청 기능용 플래그 |

### MVP 범위 (1단계)

**작가 노트**
- 노트 생성 / 삭제 / 목록
- 블록 추가 / 편집 / 삭제 / 순서 변경
- 지원 블록 타입: `text`, `character`, `world_overview`, `setting`
- 아카이브에서 Lorecraft 결과물 불러오기 → note_block 변환

**로어북**
- 로어북 생성 + note_blocks에서 섹션 선택해서 발행
- 섹션 / 전체 공개·비공개 토글
- 내 로어북 목록 + 상세 페이지

### 2단계 (추후)
- `timeline`, `plot`, `org_chart`, `scenario` 블록 타입 추가
- 공개 로어북 퍼블릭 URL
- 활용 요청 기능 (`is_usable` 연동)
