# yourBuoy 작업 기록 (WORK.md)

업데이트: 2026-07-11 (v3) · 용도: 무엇이 되어 있고 무엇이 남았는지의 이정표. 다음 세션은 이 문서에서 시작한다.

---

## ★ 진행 중 (2026-07-11) — 대장간 상세 헤더 여백이 안 먹는 문제

다음 대화에서 이 항목부터 이어간다.

### 지금 막힌 것
대장간 상세 페이지(`/forge/*`) 다크 헤더의 **위·아래 여백 대칭**이 화면에 반영되지 않는다.
- 원하는 모습: 다크 헤더 안에서 브레드크럼 위 여백(GNB → `Blog › Resource`)과 인용문 아래 여백(리드 → 흰선)이 같아야 한다.
- 추가로 흰선(스펙표가 시작되는 다크/흰 경계) 위에 패딩이 있어 인용문과 붙지 않아야 한다.
- 증상: SCSS 값을 44px로 바꿔도 브라우저에서 변화가 안 보인다. ("안되는데")

### 테스트 페이지
`http://localhost:4000/forge/mixpanel-bot-detection/`

### 관련 파일·위치
- `_sass/custom.scss`
  - `.yb-forge-item { padding-top: 44px; ... }` (헤더 위 여백, 8px→44px로 방금 변경)
  - `.yb-forge-item__lead { margin: 0 0 44px; ... }` (리드 아래 여백, 36px→44px로 변경)
  - `.yb-forge-detail .page__main-inner` + `::before` (흰 영역을 `top: var(--forge-head-h)`부터 그림)
- `_layouts/forge-item.html` — 헤더(브레드크럼/제목/리드) + 스펙표 + 본문 + 하단 메타 + 하단 `<script>`.

### 구조 요약 (핵심)
1. `.yb-forge-detail .page__main-inner` 전체가 다크(불빛 차콜) 배경.
2. `::before`로 흰 사각형을 `top: var(--forge-head-h)`부터 덮음 → 위=다크(헤더), 아래=흰색(본문).
3. `--forge-head-h`는 `forge-item.html` 하단 JS가 실시간 계산: `target = .yb-spec`, `head-h = target.top - inner.top`. 즉 흰 영역은 스펙표 윗선부터, 리드는 다크 헤더에 남음.
4. 같은 JS가 사이드 패널(`.page__aside--static`) `margin-top`도 스펙표 윗선에 맞춤.

### 여백 출처 (가정 — 미검증)
- 헤더 위 여백 = `.yb-forge-item` `padding-top`
- 헤더 아래 여백 = `.yb-forge-item__lead` `margin-bottom` (흰선이 리드 밑 44px 지점에 그려져 다크로 남음)

### "안 보이는" 원인 후보 (다음 대화에서 이 순서로 확인)
1. SCSS 미컴파일 — `_site` 지우고 `bundle exec jekyll serve` 재시작.
2. 브라우저 캐시 — 하드 리프레시(Cmd+Shift+R).
3. 셀렉터 우선순위 — 개발자도구 Computed 탭에서 `.yb-forge-item`의 실제 padding-top 확인. 위 여백이 사실은 상위 `.page__content`/`.page__main-inner` 패딩에서 올 수도 있음.
4. 위 여백의 진짜 출처 특정 — 브레드크럼 위 간격을 만드는 실제 박스를 개발자도구로 집기.
5. JS 타이밍 — 콘솔에서 `getComputedStyle(document.querySelector('.page__main-inner')).getPropertyValue('--forge-head-h')`로 실제 값 확인.

### 다음 단계
1. 로컬 개발자도구로 위·아래 여백을 만드는 실제 요소와 계산값을 먼저 특정한다(가정 검증).
2. 값이 안 먹으면 상위 셀렉터를 찾아 `.yb-forge-detail` 스코프로 정확히 겨냥한다.
3. 위·아래를 같은 변수(예: `--forge-head-pad`)로 묶어 한 값만 바꿔도 대칭이 유지되게 정리한다.

### 이번 세션에서 이미 처리한 것 (대장간 상세)
- 다크 헤더의 코랄 배지 제거, 리드 앞 코랄 세로선 제거.
- 사이드 정렬 기준을 라벨 → 패널(`aside`) top으로 변경.

---

## 1. 완료된 것

### 0단계. 방향 결정
- 정체성: 일과 마음에서 얻은 것을 나를 위해 정리하고, 언젠가 아이들이 읽도록 남기는 개인 블로그. nitrox(회사)와 역할 분리.
- 플랫폼: Jekyll(TeXt 테마) + GitHub Pages 유지. 도메인 yourbuoy.kr, Cloudflare 경유.
  - Ghost 이전은 두 신호가 올 때 재검토한다: ① 뉴스레터 구독자가 수백 명이 되어 발송이 중심 채널이 될 때 ② 예약·자동 발행이 매주 실제로 필요할 때. 콘텐츠가 전부 md라 이전 비용은 낮다.
- 카테고리 5개: 직장생활표류기 Work(/work) · 멘탈샵 Mental(/mind) · 카바나 Life(/life) · AI(/ai) · Dwarven Forge Resource(/forge).
- 원칙: 링크만 받아 AI가 자동 생성하는 글은 올리지 않는다. 본인 일화 없는 글은 발행 보류.

### 1단계. 구조·내비게이션
- GNB(Webflow 문법): 로고+카테고리 좌측(일반 굵기, 간격 30px) / About·검색·구독 버튼 우측.
- 검색 모달 = 탐색 허브: 검색 + 태그 클라우드 + 전체 아카이브 링크. 타이핑 시 태그 숨김.
- 아카이브(/archive/): 태그 클라우드 + 연도별 리스트. 진입은 검색 모달·푸터.
- 푸터: Archive · About · RSS · 구독하기.
- 홈: 좌정렬 히어로(yourBuoy Blog) → featured 큰 카드 1(front matter `featured: true`로 지정, 기본 최신글) → 박스 카드 6(3×2, 칩+읽기시간) → 전체 글 보기 → 구독 밴드.

### 2단계. 디자인 시스템
- 색 3개: 잉크 #0b0f14(제목) / Sea 틸 #0f7c8c(보조: 링크·칩·카테고리 라벨) / 부표 오렌지 #ff5a3c(유일한 강조: 호버·목차 현재 위치·인용구). 배경 온기는 모래빛 #f8f4ec.
- 라운드 한 스케일: 4~10px. 알약(999px) 금지, 원형은 아바타·검색 아이콘만.
- 폰트: 한글 Pretendard(확정), 라틴 Poppins(로고·GNB — Space Grotesk 교체 실험 예정).
- 그라데이션: 글 상단 히어로에 물빛 하나(아쿠아+바다블루+모래 힌트, 저알파). 카테고리별 색 변주는 촌스러워서 폐기(클래스 yb-hero--{cat}은 남아 있음).
- 본문 표: 마크다운 표에 자동 적용(바다빛 헤더, 라운드 8, 행 호버). 풀 인용구는 `> **문장**`.
- 테마의 레드 포인트는 전부 Sea로 교체.

### 3단계. 본문(아티클) 페이지
- 히어로: 브레드크럼(Blog › 카테고리) + 좌 제목·부제 / 우 썸네일.
- 목차: 우측 카드형(Table of contents), sticky, 본문 상단 정렬. 아래에 소형 태그 + Share(링크복사·LinkedIn·X·Facebook).
- 글 하단: 본문 → 구독 카드 → 태그 칩 → Last updated·Category → 작성자 카드(Written by) → 댓글 → 이전글.
- FAQ: front matter `faq:` 하나로 본문 렌더와 FAQPage 스키마 동시 생성(텍스트 일치 자동 보장).

### 4단계. AEO/GEO
- 글마다 JSON-LD @graph 1개: BlogPosting + Person(jobTitle·sameAs) + BreadcrumbList (+FAQPage).
- llms.txt, robots.txt 정상화, meta keywords(tags+internal_tags), internal_tags 지원.
- 기존 글 URL 전부 보존. 멘탈 글 2편은 mind 카테고리로 이동하되 permalink 고정.

### 5단계. 댓글
- Disqus → giscus 교체 완료(광고 0, 데이터는 리포 Discussions·Announcements에 저장, pathname 매핑, 한국어).
- 기존 Disqus 댓글 7개는 docs/disqus-comments-archive.md에 원문·추정 원글 매핑으로 보존. Disqus 계정 원본도 이식 확인 전까지 유지.

### 6단계. 구독
- 접점 3곳: GNB 버튼 · 본문 끝 카드 · 푸터 링크. 현재 RSS 연결.
- 스티비 가입 후 _config.yml의 subscribe_url(구독 페이지)과 subscribe_form_action(폼 action) 채우면 이메일 구독으로 자동 전환.

### 7단계. 콘텐츠 파이프라인
- yourbuoy-content 스킬 v2: 기획 인터뷰 → 작성(표준 블록 10개) → 발행 게이트 11항목. nicky-style-check 검수 연계.
- 첫 글 발행: "블로그를 5년 만에 다시 시작한 이유"(카바나, featured).

### 8단계. 운영 인프라
- 로컬 미리보기 확립(config 변경 시에만 서버 재시작). CSS 캐시버스팅 자동화. Chirpy 서비스워커 킬스위치.
- 백업 브랜치: backup-text-theme(옛 사이트), chirpy-version(Chirpy 실험).

## 2. 글 발행 프로세스

1. 기획: 스킬 인터뷰로 글감 도출 → 카테고리 판별 → _drafts/
2. 작성: 내 구술·메모 → 구조화(내 문장 유지) → nicky-style-check
3. front matter: title / subtitle(155자) / date(+09:00, 미래 날짜 금지) / categories 1개 / tags(첫 태그=기둥) / internal_tags / hero_image(1.9:1) / (정보성) faq / (홈 고정) featured
4. 발행 게이트 통과 → _posts/YYYY-MM-DD-slug.md → 커밋 → Push origin
5. 실사이트에서 렌더링·JSON-LD·댓글창 확인. 수정 재발행 시 last_modified_at 갱신, URL 불변

## 3. 다음 작업 (우선순위)

1. **썸네일 자동 생성 시스템** (확정: 스크립트 방식) — tools/thumbnail.py, 1200×630, 배경 3종 로테이션(물빛/모래빛/잉크) + 키워드 타이포(Pretendard Bold, 폰트 파일 리포 추가) + 플랫 오브젝트 1개. 기존 글 8개 일괄 재생성으로 홈 카드 톤 통일. 완료 후 featured 카드의 풀블리드 이미지형 업그레이드 재검토.
2. **Disqus 댓글 7개 이식** — 아카이브의 추정 원글 매핑을 Nicky가 확인 → 각 글 Discussion에 원작성자·시기 표기로 등록(브라우저에서 Nicky 계정 사용, 승인 후 진행).
3. **반응형 전체 점검** — 모바일에서 GNB 유틸 그룹, 히어로, 목차, 카드 그리드, 구독 카드.
4. **폰트 실험** — 라틴(로고·GNB·히어로)만 Poppins → Space Grotesk 교체 비교.
5. **검색 모달 라이트 테마** — 다크 오버레이가 무겁다는 피드백.
6. **연관글 섹션** — 댓글 아래, 같은 카테고리 우선 2~3카드.
7. **세션C 측정** — GA4/GTM: AI referrer(chatgpt.com, perplexity.ai, gemini.google.com) 태깅, 타깃 프롬프트 세트, 가시성/인용/임팩트 3층 지표, 결과보고 에이전트 + 주간 기획 리마인더(예약 실행).

### Nicky가 직접
- Cloudflare 대시보드에서 AI 크롤러(GPTBot, ClaudeBot, PerplexityBot) 차단이 꺼져 있는지 확인
- 스티비 가입 → 구독폼 URL 2개를 _config.yml에 반영
- LinkedIn URL(`linkedin:`)과 프로필 사진(`avatar:` + 파일) 채우기
- 댓글 아카이브의 추정 원글 매핑 확인 (특히 최민경님 → 멘탈 1인지 2인지)
- 초안 4개 소화: 임신일기 2편(카바나), 회의록·태도 조각글(Work)
- giscus 첫 테스트 댓글 남겨보기 (실사이트에서 GitHub 로그인)
