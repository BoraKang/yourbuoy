# yourBuoy 자동화

yourBuoy의 비공개 경험 수집, 소재 수확, 블로그 편집 루프를 연결하는 운영 도구다.

## 데이터 흐름

1. VPS의 `alma-daily-catch-question.sh`가 매일 21:30 KST에 질문한다.
2. Alma가 답변을 VPS의 `memory/YYYY-MM-DD.md` 내 `## Daily Catch`로 보존한다.
3. Mac의 `sync-alma-daily-catch.sh`가 매일 07:00 KST에 오늘부터 최근 3일을 확인하고 해당 섹션만 Obsidian `i. Raw/alma/`로 동기화한다.
4. Codex `yourBuoy 일일 편집 루프`가 매일 07:30 KST에 Notion의 기존 아이템을 질문·초안·게이트로 발전시킨다.
5. Codex `yourBuoy 주간 씨앗 선별`이 매주 일요일 09:00 KST에 최근 Daily Catch에서 후보를 제안한다.
6. Codex `yourBuoy 수요 우선 수확 루프`가 매주 월·수·금 09:00 KST에 AX 리더십과 업무 운영의 공개 수요에서 후보를 제안한다.

Daily Catch 전체나 수확 후보가 자동으로 블로그 아이템이 되지는 않는다. 선별·수확 결과를 사용자가 선택하고 경험 연결이 확인된 뒤에만 Notion 씨앗으로 등록한다. 수요 우선 수확은 AX 리더십과 업무 운영을 기둥으로 삼으며, 마케팅은 두 기둥의 운영 사례일 때만 포함한다. GSC·Ahrefs 커넥터가 실제로 연결되기 전에는 해당 데이터를 사용하거나 수치를 추정하지 않는다. 발행·커밋·푸시는 사용자 승인 없이 수행하지 않는다.

Backlog와 상태의 유일한 정본은 Notion `yourBuoy Blog Pipeline`이다.
`_meta/backlog.md`와 `_meta/daily-catch.md`는 레거시이며 새 데이터를 쓰지
않는다. 각 Codex 예약 실행은 별도 작업으로 보고를 만들고, 사용자는 그 작업에
답장한다. 후속 대화가 선택·답변·발행 승인을 처리한다. 커밋은 명시적 발행
승인 뒤에만, 푸시는 별도 요청이 있을 때만 수행한다.

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

Obsidian 동기화 파일에서 자동 영역 밖의 `## 내 메모`는 보존된다. 기존 형식
파일의 최초 변환 시 `.pre-managed` 백업이 생성된다.
