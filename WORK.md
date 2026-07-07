# yourBuoy 작업 기록 (WORK.md)

작성: 2026-07-08 · 용도: 블로그 세팅부터 발행까지 무엇이 되어 있고 무엇이 남았는지의 이정표.
다음 세션은 이 문서에서 시작한다.

## 1. 완료된 것

### 0단계. 방향 결정
- 정체성: 일과 마음에서 얻은 것을 나를 위해 정리하고, 언젠가 아이들이 읽도록 남기는 개인 블로그. nitrox(회사)와 역할 분리.
- 플랫폼: Jekyll(TeXt 테마) + GitHub Pages 유지. 도메인 yourbuoy.kr, Cloudflare 경유.
- 사이트명: yourBuoy. 카테고리 5개: 직장생활표류기 Work(/work), 멘탈샵 Mental(/mind), 카바나 Life(/life), AI(/ai), Dwarven Forge Resource(/forge).
- 원칙: 링크만 받아 AI가 자동 생성하는 글은 올리지 않는다. 본인 일화 없는 글은 발행 보류.

### 1단계. 구조·내비게이션
- GNB: 로고+카테고리 좌측 / About·검색·구독 우측 (Webflow 문법). 좌측 메뉴 일반 굵기, 간격 30px.
- 검색 모달 = 탐색 허브: 검색 입력 + 태그 클라우드(글 수 표시) + 전체 아카이브 링크. 타이핑 시 태그 숨김.
- 아카이브(/archive/): 태그 클라우드 + 연도별 리스트. GNB에서는 제외, 검색 모달과 푸터에서 진입.
- 푸터: Archive · About · RSS · 구독하기.

### 2단계. 본문(아티클) 디자인 (Webflow 벤치마크)
- 히어로: 브레드크럼(Blog › 카테고리) + 좌측 제목·부제 / 우측 썸네일. 하단에서 올라오는 프리즘 그라데이션.
- 타이포: Pretendard, 본문 16px/1.6, H2 30px, H3 22px, 한글 keep-all.
- 목차: 우측 카드형(Table of contents), 본문 상단 정렬, sticky.
- 글 하단 순서: 본문 → 구독 카드 → 태그(Webflow 칩) → Last updated·Category → 작성자 카드(Written by) → 댓글 → 이전글.
- FAQ: front matter `faq:`에 쓰면 본문 렌더와 FAQPage 스키마가 같은 데이터에서 생성(불일치 원천 차단).

### 3단계. AEO/GEO
- 글마다 JSON-LD @graph 1개: BlogPosting + Person(jobTitle, sameAs) + BreadcrumbList (+FAQPage).
- 구 NewsArticle·Person 스키마 제거(이미지 경로 버그 포함).
- llms.txt, robots.txt(오타 파일 robot.txt 교체), meta keywords(tags+internal_tags).
- internal_tags 지원: 화면 비노출, meta·스키마 전용.
- 기존 글 8개 URL 전부 보존(/work/slug/), 멘탈 글 2편은 mind로 이동하되 permalink 고정.

### 4단계. 구독
- 구조: GNB 버튼 + 본문 끝 카드 + 푸터 링크 3접점. 현재 RSS로 연결.
- `_config.yml`의 `subscribe_url`, `subscribe_form_action` 채우면 이메일 폼으로 자동 전환.

### 5단계. 콘텐츠 파이프라인
- yourbuoy-content 스킬 v2: 기획 인터뷰 → 작성(블록 10개, Webflow 실측 근거) → 발행 게이트 11항목 → (측정 자리).
- nicky-style-check로 발행 전 문체 검수.
- 첫 글 발행: "블로그를 5년 만에 다시 시작한 이유" (카바나).

### 6단계. 운영 인프라
- 로컬 미리보기(jekyll serve) 확립. config 변경 시에만 서버 재시작.
- CSS 캐시버스팅 자동화(빌드 시각 버전). Chirpy 서비스워커 킬스위치 배포.
- git 백업 브랜치: backup-text-theme(옛 사이트), chirpy-version(Chirpy 실험).

## 2. 글 발행 프로세스 (현재 기준)

1. 기획: 스킬 인터뷰로 글감 도출 → 카테고리 판별 → _drafts/에 기록
2. 작성: 내 구술·메모 → Claude가 구조화(내 문장 유지) → nicky-style-check
3. front matter: title / subtitle(155자) / date(+09:00, 미래 금지) / categories 1개 / tags(첫 태그=기둥) / internal_tags / hero_image(1.9:1) / (정보성) faq
4. 발행 게이트 11항목 통과 → _posts/YYYY-MM-DD-slug.md → 커밋
5. GitHub Desktop에서 Push origin → 1~2분 후 실사이트 확인
6. 수정 재발행 시 last_modified_at 갱신, URL 불변

## 3. 남은 것 (다음 이정표)

### 홈 구성안 (확정된 아이디어, 다음 세션 1순위)
- 구조: ① 중앙 yourBuoy 워드마크 + 태그라인 히어로 ② featured 큰 카드 1개(front matter `featured: true`로 지정, 없으면 최신글) ③ 작은 카드 3개 한 줄(최근 글) ④ 구독 밴드.
- 카드 개수: 지금은 글 9개라 1+3이 적당. 글이 15개를 넘으면 1+6(2줄)로 확장.
- 자료실(Forge) 컬렉션 섹션(Square 다크 스타일)은 자료가 3개 이상 쌓인 뒤에 추가한다. 지금 넣으면 빈 선반이 된다.
- 참고 레퍼런스: AppsFlyer(큰 카드), Amplitude Insights(카드 그리드), Square(featured+컬렉션+토픽 필터).

### 본문·사이트 TODO
- 사이드바 태그 칩 + Share this article 버튼 (AppsFlyer 벤치마크)
- 반응형 전체 점검 (모바일 GNB·히어로·목차·카드)
- 연관글 섹션(Related articles), 댓글 정비(Disqus 유지/교체), 검색 모달 라이트 테마
- 썸네일 1.9:1 템플릿 규격화

### 측정 (세션C)
- GA4/GTM: AI referrer(chatgpt.com, perplexity.ai, gemini.google.com) 구분 태깅
- 타깃 프롬프트 세트 정의 → 가시성/인용/임팩트 3층 지표
- 결과보고 에이전트 + 주간 기획 리마인더(예약 실행)

### Nicky가 직접
- Cloudflare 대시보드에서 AI 크롤러(GPTBot, ClaudeBot, PerplexityBot) 차단 꺼져 있는지 확인
- 스티비 가입 → 구독폼 URL을 _config.yml에 반영
- LinkedIn URL(_config.yml `linkedin:`)과 프로필 사진(`avatar:`) 채우기
- 초안 4개 소화: 임신일기 2편(카바나), 회의록·태도 조각글(Work)
