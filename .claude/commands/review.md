npx tsc --noEmit 실행 후 결과 확인.

체크 항목:
- 타입 에러 및 any 타입 사용 여부
- 미사용 import
- 누락된 에러 처리 (try/catch)
- 파이프라인 파일에서 extractJson() 사용 여부
- max_tokens 설정 (research/synthesize/review/plan: 4096 이상)
- useEffect 의존성 배열 누락 여부

문제 발견 시 수정 후 재검증. 3회 시도 후 실패 시 메인 세션에 보고.
