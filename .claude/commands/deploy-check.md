배포 전 체크리스트:
- npx tsc --noEmit 통과 확인
- npx next build 통과 확인
- .env.local에 필요한 환경변수 모두 있는지 확인
- console.log, TODO, FIXME 잔재 없는지 확인
- Supabase Redirect URL에 배포 도메인 등록 여부 확인
- CLAUDE.md 현재 진행 상황 최신화 여부 확인

모두 통과 시에만 배포 진행.
