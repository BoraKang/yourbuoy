# yourBuoy 자동화

yourBuoy의 비공개 경험 수집, 소재 수확, 블로그 편집 루프를 연결하는 운영 도구다.

## 데이터 흐름

1. VPS의 `alma-daily-catch-question.sh`가 매일 21:30 KST에 질문한다.
2. Alma가 답변을 VPS의 `memory/YYYY-MM-DD.md` 내 `## Daily Catch`로 보존한다.
3. Mac의 `sync-alma-daily-catch.sh`가 매일 07:00 KST에 해당 섹션만 Obsidian `i. Raw/alma/`로 동기화한다.
4. Codex `yourBuoy 일일 편집 루프`가 매일 07:30 KST에 Notion의 기존 아이템을 질문·초안·게이트로 발전시킨다.
5. Codex `yourBuoy 주간 씨앗 선별`이 매주 일요일 09:00 KST에 최근 Daily Catch에서 후보를 제안한다.
6. Codex `yourBuoy 주간 수확 루프`가 매주 수요일 09:00 KST에 최근 프로젝트 흔적과 공개 검색에서 후보를 제안한다.

Daily Catch 전체나 수확 후보가 자동으로 블로그 아이템이 되지는 않는다. 선별·수확 결과를 사용자가 선택한 뒤에만 Notion 씨앗으로 등록한다. 수확 루프는 GSC·Ahrefs 커넥터가 실제로 연결되기 전에는 해당 데이터를 사용하거나 수치를 추정하지 않는다. 발행·커밋·푸시는 사용자 승인 없이 수행하지 않는다.

## 파일

- `alma-daily-catch-question.sh`: VPS 질문 및 답변 대기 마커 생성
- `sync-alma-daily-catch.sh`: Daily Catch 섹션의 Obsidian 동기화
- `com.riverpurple.alma-daily-catch-sync.plist`: Mac LaunchAgent 예약
- `status.md`: 현재 운영 상태와 다음 확인 항목
- `.claude/skills/yourbuoy-harvest/`: 대화·메모·프로젝트·공개 검색용 수확 규칙

## 설치 위치

- VPS 실행본: `/root/alma-daily-catch-question.sh`
- Mac LaunchAgent: `~/Library/LaunchAgents/com.riverpurple.alma-daily-catch-sync.plist`
- Codex 자동화: `~/.codex/automations/yourbuoy-2`, `yourbuoy-3`, `yourbuoy`

실제 키나 개인 Daily Catch 원문은 이 저장소에 넣지 않는다.
