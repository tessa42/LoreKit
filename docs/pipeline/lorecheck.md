# Lorecheck 파이프라인 스펙

## Quick 파이프라인

**엔드포인트**: `POST /api/lorecheck/quick`  
**응답 방식**: SSE (Server-Sent Events)

### 단계 구성

```
normalize → analyze → research → check → format
```

| 단계 | 파일 | 모델 | max_tokens | 역할 |
|---|---|---|---|---|
| normalize | `quick/normalize.ts` | — | — | 입력값 정규화 (genre/existingSetting 기본값 처리) |
| analyze | `quick/analyze.ts` | sonnet | 4096 | 장르·시대·배경·소재·집단·의도적 상상력 여부 추출 |
| research | `quick/research.ts` | sonnet | 2000 | 소재/집단별 내부자 규칙 수집 |
| check | `quick/check.ts` | sonnet | 4096 | 몰입 저해 이슈 탐지 (analyze + research 결과 활용) |
| format | `quick/format.ts` | — | — | 결과를 LorcheckQuickPayload로 정리 |

### SSE 이벤트

```
progress { step: 'normalize', message: '입력값 검증 완료' }
progress { step: 'analyze',   message: '텍스트 분석 중...' }
progress { step: 'analyze',   message: '텍스트 분석 완료' }
progress { step: 'research',  message: '내부자 맥락 분석 중...' }
progress { step: 'research',  message: '내부자 맥락 분석 완료' }
progress { step: 'check',     message: '고증 검토 중...' }
progress { step: 'check',     message: '고증 검토 완료' }
done     { step: 'format',    payload: LorcheckQuickPayload }
error    { message: string }
```

### 타입 (src/types/lorecheck.ts)

```ts
LorcheckQuickInput          // 사용자 입력
NormalizedLorcheckQuickInput // normalize 출력
LorcheckAnalyzeResult       // analyze 출력
LorcheckResearchResult      // research 출력 — insider_rules[]
LorcheckCheckResult         // check 출력 — issues[]
LorcheckIssue               // 이슈 단위 (type/severity/description/suggestion)
LorcheckQuickPayload        // done 이벤트 payload
```

### research 단계 상세

- **입력**: `NormalizedLorcheckQuickInput` + `LorcheckAnalyzeResult`
- **출력**: `LorcheckResearchResult`
- user content 구성: `analyze.materials + analyze.groups` (소재 목록), `analyze.genre`, `input.text`
- `extractJson()` 사용 필수 (JSON 파싱 안전 처리)

### check 단계 — insider_rules 반영

research 결과를 user content에 다음 형태로 추가:
```
내부자 맥락 규칙 - [subject]: [rule1, rule2, ...]
```

---

## Deep 파이프라인

2차 구현 예정.
