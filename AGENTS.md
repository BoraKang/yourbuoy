# yourBuoy 운영 포인터

## 하네스: 썸네일 이미지

**트리거:** yourBuoy 글의 히어로·썸네일 이미지를 만들거나 수정할 때
`.agents/skills/yourbuoy-image-style/`을 사용한다. 기존 이미지의 단순한
평면 그래픽 문법을 우선하고, 일반적인 AI 에디토리얼 삽화로 만들지 않는다.

## 하네스: 콘텐츠 수확

**목표:** 사용자에게 이미 남은 흔적과 확인 가능한 공개 수요에서 블로그 후보를 발견한다.

**트리거:** yourBuoy 소재 수확·아이템 발굴·검색 씨앗 조사·결과 재실행이나 보완 요청 시 `yourbuoy-harvest` 스킬을 사용한다. 단순 질문은 직접 응답할 수 있다.

**변경 이력:**

| 날짜 | 변경 내용 | 대상 | 사유 |
|---|---|---|---|
| 2026-08-24 | 수확 루프 초기 구성 | `.Codex/agents/harvest-curator.md`, `.Codex/skills/yourbuoy-harvest/` | 회고·편집과 분리된 아이템 발굴 트랙 복원 |
| 2026-08-24 | 수요 우선 모드 추가 | `.Codex/skills/yourbuoy-harvest/` | 초기 콘텐츠 확보를 위해 AX 리더십·업무 운영 검색 수요에서 출발 |
| 2026-08-24 | 루프 접점 정합화 | Writer·Daily Catch·자동화 | Notion 정본, Obsidian 경로, 답변 채널, 유실 방지 규칙 통일 |
