# yourBuoy 운영 포인터

## 하네스: 콘텐츠 수확

**목표:** 사용자에게 이미 남은 흔적과 확인 가능한 공개 수요에서 블로그 후보를 발견한다.

**트리거:** yourBuoy 소재 수확·아이템 발굴·검색 씨앗 조사·결과 재실행이나 보완 요청 시 `yourbuoy-harvest` 스킬을 사용한다. 단순 질문은 직접 응답할 수 있다.

**변경 이력:**

| 날짜 | 변경 내용 | 대상 | 사유 |
|---|---|---|---|
| 2026-08-24 | 수확 루프 초기 구성 | `.claude/agents/harvest-curator.md`, `.claude/skills/yourbuoy-harvest/` | 회고·편집과 분리된 아이템 발굴 트랙 복원 |
| 2026-08-24 | 수요 우선 모드 추가 | `.claude/skills/yourbuoy-harvest/` | 초기 콘텐츠 확보를 위해 AX 리더십·업무 운영 검색 수요에서 출발 |
| 2026-08-24 | 루프 접점 정합화 | Writer·Daily Catch·자동화 | Notion 정본, Obsidian 경로, 답변 채널, 유실 방지 규칙 통일 |
| 2026-10-08 | 댓글 시스템 자체 구축 | `tools/comments-worker/`, `_includes/comments-providers/custom.html`, `_config.yml` | Cusdis 호스팅 종료(레포 archived)로 댓글창이 전 기기에서 먹통. 익명 유지 위해 Cloudflare Workers+D1로 이전 |
| 2026-10-07 | Mixpanel 설치·읽기 지표 수집 | `_includes/analytics-providers/mixpanel.html`, `_config.yml` | UA 수집 종료 후 분석 도구가 없어 방문 급감을 알아채지 못함 |
| 2026-10-08 | 2021년 글 예전 주소 리디렉션 복구 | `_posts/2021-*.md`, `_config.yml` | 2025-12-27 카테고리 추가로 주소가 바뀌어 검색 유입이 0이 됨 |

## 댓글

- 익명 댓글은 자체 백엔드다. `comments.yourbuoy.kr` (Cloudflare Workers + D1).
- 소스와 운영법: `tools/comments-worker/README.md`
- 글 주소에 `?admin=1` 을 붙이면 삭제·승인 버튼이 나온다. 토큰은 `tools/comments-worker/.admin-token`.
- `_data/comments.yml` 의 옛 Disqus 댓글은 그대로 두고 새 댓글 위에 함께 표시된다.

## 분석

- Mixpanel 프로젝트 `Yourbuoy.kr`(4070712). 코드는 `_includes/analytics-providers/mixpanel.html`, 토큰은 `_config.yml`의 `analytics.mixpanel`.
- 이벤트: `$mp_web_page_view`(글 페이지는 `article_title`·`article_category`를 붙여 직접 보냄), `article_scrolled`, `article_read_progress`(`percent`), `toc_clicked`, `article_time_spent`(`engaged_seconds`). 글 페이지에만 붙고 `jekyll serve`에서는 수집하지 않는다.
- 리포트 KPI: 검색 노출·클릭(Search Console), 열독률(글 조회 중 75% 도달 비율), 방문당 글 조회(Mixpanel). 주간 메일은 routine `yourBuoy 성과 리포트`가 보낸다.
- 대시보드: https://mixpanel.com/project/4070712/app/boards#id=11572402 (무료 플랜이라 저장 리포트 5개 한도. 나머지는 대시보드 메모 카드의 링크로 본다)

## 글 주소

- 주소 규칙은 `/:categories/:title/`이다. 발행된 글의 `categories`나 `permalink`를 바꾸면 주소가 바뀐다.
- 바꿀 때는 예전 주소를 `redirect_from`에 반드시 남긴다. 2025-12-27에 이걸 빠뜨려 검색 유입의 95%를 잃었다.
