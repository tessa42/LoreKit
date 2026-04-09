# Supabase 스키마 참조

LLM 컨텍스트용 — Supabase 테이블 구조 요약.

---

## profiles

유저 기본 정보 (auth.users와 1:1).

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK FK→auth.users | |
| email | text | |
| created_at | timestamptz | |

---

## credit_wallets

유저별 씨앗(크레딧) 잔액.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK→profiles | |
| balance | integer default 0 | 현재 잔액 |
| updated_at | timestamptz | |

---

## credit_transactions

씨앗 거래 내역.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK→profiles | |
| amount | integer | 양수=충전, 음수=차감 |
| balance_after | integer | 거래 후 잔액 |
| reason | text | 거래 사유 |
| reference_id | text nullable | 외부 결제 ID 등 참조값 |
| created_at | timestamptz | |

> 씨앗 처리는 반드시 `src/lib/credits/transaction.ts`를 통해서만 할 것.
> 신규 가입 시 트리거(`on_auth_user_created_credits`)로 6씨앗 자동 지급.

---

## archive_items

AI 기능 결과물 저장소.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK→profiles | |
| type | text | `lorecraft \| lorecheck_quick \| lorecheck_deep \| simulator` |
| title | text | |
| payload | jsonb | 타입별 결과 데이터 |
| created_at | timestamptz | |

---

## notes

작가 노트. 블록(note_blocks)과 1:N 관계.

> ⚠️ `content text` 컬럼 없음 — 블록 구조로만 관리.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK→profiles | |
| title | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## note_blocks

노트를 구성하는 개별 블록.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| note_id | uuid FK→notes | 소속 노트 |
| user_id | uuid FK→profiles | |
| type | text | `text \| character \| timeline \| plot \| org_chart \| scenario \| world_overview \| setting` |
| content | jsonb | 블록 타입별 구조화 데이터 |
| order_index | integer default 0 | 노트 내 블록 순서 |
| source_archive_id | uuid nullable FK→archive_items | 아카이브 불러오기 시 원본 참조 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## lorebooks

완성된 로어북.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK→profiles | |
| title | text | |
| description | text nullable | |
| is_public | boolean default false | 전체 공개 여부 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## lorebook_sections

로어북을 구성하는 섹션. note_blocks에서 선택해 발행.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| lorebook_id | uuid FK→lorebooks | 소속 로어북 |
| note_block_id | uuid nullable FK→note_blocks | 연결된 노트 블록 |
| title | text | |
| content | text | |
| order_index | integer default 0 | 섹션 순서 |
| is_public | boolean default false | 섹션 개별 공개 여부 |
| is_usable | boolean default false | 추후 활용 요청 기능용 플래그 |
| created_at | timestamptz | |

---

## 관계 요약

```
auth.users
  └── profiles
        ├── credit_wallets (1:1)
        ├── credit_transactions (1:N)
        ├── archive_items (1:N)
        ├── notes (1:N)
        │     └── note_blocks (1:N)
        │           └── archive_items (참조, source_archive_id)
        └── lorebooks (1:N)
              └── lorebook_sections (1:N)
                    └── note_blocks (참조, note_block_id)
```
