# 현재 상태

- Alma Daily Catch 질문은 VPS에서 매일 21:30 KST에 실행된다.
- 24시간 이내 답변 대기 파일이 있으면 중복 질문을 보내지 않고, 24시간이 지나면 만료해 다음 질문을 보낸다.
- Mac은 매일 07:00 KST에 오늘부터 최근 3일의 `Daily Catch` 섹션을 확인해 Obsidian `i. Raw/alma/`로 백필한다.
- Obsidian 동기화는 관리 영역만 갱신하고 `## 내 메모`를 보존한다.
- Backlog와 상태의 유일한 정본은 Notion이며 `_meta/backlog.md`와 `_meta/daily-catch.md`에는 새 데이터를 쓰지 않는다.
- Codex 자동화 보고에는 해당 Codex 작업에서 답장한다. 커밋은 명시적 발행 승인 뒤, 푸시는 별도 요청 뒤에만 수행한다.
- 기존 Codex `yourBuoy 아침 블로그 루프`는 중지 상태다.
- Codex `yourBuoy 일일 편집 루프`는 매일 07:30 KST에 기존 Notion 아이템의 질문·초안·게이트 처리만 수행한다.
- 검색 수요 기반 아이템 조사 트랙은 `yourbuoy-harvest` 스킬로 분리되어 있다.
- Codex `yourBuoy 수요 우선 수확 루프`는 매주 월·수·금 09:00 KST에 AX 리더십과 업무 운영의 공개 수요를 조사한다.
- 정기 수확은 독자 질문·수요 근거·경쟁 빈틈·경험 연결성을 확인해 최대 3개 후보만 보고한다.
- 마케팅은 독립 주제가 아니라 Martech·콘텐츠 운영·실험 측정처럼 두 기둥과 겹칠 때만 포함한다.
- 사용자가 후보를 선택하고 경험 연결이 확인되기 전에는 Notion을 수정하지 않는다.
- GSC·Ahrefs는 현재 연결되지 않아 수확 루프에서 사용하지 않는다.
- Codex `yourBuoy 주간 씨앗 선별`은 매주 일요일 09:00 KST에 실행된다.
- 주간 선별은 후보만 보고하며 사용자가 선택하기 전에는 Notion을 수정하지 않는다.
- 2026-08-24 운영 검증에서 최근 3일 SSH 백필이 성공했고 `/tmp/alma-daily-catch-sync.err`는 0바이트였다.
- 기존 `2026-08-23 Daily Catch.md`는 관리 영역 형식으로 전환됐고 `.pre-managed` 복구본이 생성됐다.

## 바로 다음 확인

- 다음 Alma 질문에 답한 뒤 그날 `memory/YYYY-MM-DD.md`에 `## Daily Catch`가 생성되는지 확인한다.
- 다음 날 Obsidian에 `YYYY-MM-DD Daily Catch.md`가 생성되는지 확인한다.
- 첫 수요 우선 결과에서 독자·검색 의도, 공개 근거 링크, 경쟁 빈틈, 경험 공백 표시가 맞는지 확인한다.
