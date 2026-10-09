# yourBuoy 익명 댓글 (Cloudflare Workers + D1)

Cusdis 호스팅 서비스가 종료(레포도 archived)되어 직접 만든 댓글 백엔드다.
로그인·이메일 없이 이름만 적으면 댓글을 남길 수 있다.

- API: https://comments.yourbuoy.kr
- DB: D1 `yourbuoy-comments`
- 프런트: `_includes/comments-providers/custom.html`
- 설정 연결: `_config.yml` → `comments.provider: custom`, `comments.custom.api_url`

## 관리자 토큰

`.admin-token` 파일에 있다. **gitignore 되어 있으니 커밋하지 말 것.**
이 파일을 잃어버리면 새로 발급해 다시 넣으면 된다.

```sh
NEW=$(openssl rand -hex 24) && printf '%s' "$NEW" > .admin-token \
  && printf '%s' "$NEW" | npx wrangler secret put ADMIN_TOKEN
```

## 댓글 관리

블로그 글 주소 뒤에 `?admin=1` 을 붙여서 열면 **댓글 영역 안에** 토큰 입력칸이 나온다.
넣으면 서버에 맞는지 먼저 확인하고 저장하므로, 잘못 붙여넣으면 그 자리에서 알려준다.
이후 "관리자 모드" 배지가 뜨고 각 댓글에 **삭제**(승인 대기면 **승인**) 버튼이 생긴다.

브라우저 기본 팝업(`prompt` / `confirm`)은 쓰지 않는다. 모바일에서 안 뜨는 경우가 있어
토큰을 넣을 길이 아예 막혔던 적이 있다. 삭제 확인도 버튼으로 되묻는다.

## 독자 본인 삭제

댓글을 쓰면 서버가 그 댓글 전용 비밀값을 **응답에 한 번만** 실어 보내고, 브라우저가 보관한다.
그 비밀값을 가진 브라우저에만 "내가 쓴 댓글" 표시와 삭제 버튼이 보인다
(`DELETE /comments/<id>` + `X-Delete-Token` 헤더).

비밀값은 어떤 조회 응답에도 포함되지 않는다. 관리자 조회에도 넣지 않는다.
브라우저 저장소를 비우거나 다른 기기로 옮기면 본인도 지울 수 없게 되고, 그때는 글쓴이가 지워주면 된다.

터미널에서 바로 볼 수도 있다.

```sh
npx wrangler d1 execute yourbuoy-comments --remote \
  --command "SELECT created_at, page_id, name, message FROM comments ORDER BY created_at DESC LIMIT 20"
```

## 승인제로 바꾸기

기본은 즉시 공개다. 스팸이 늘면 `wrangler.jsonc` 의 `REQUIRE_APPROVAL` 을 `"1"` 로 바꾸고
`npx wrangler deploy`. 이후 새 댓글은 승인 전까지 글쓴이에게만 보인다.

## 이메일

선택 입력이다. 회신을 원하는 독자만 남긴다.
**공개 응답(`GET /comments`)에는 절대 포함되지 않는다.** 관리자 토큰으로 조회할 때만 보인다.
코드에서는 `PUBLIC_COLUMNS` / `ADMIN_COLUMNS` 로 갈라둔 것이 그 경계다.

## 스팸 방어

브라우저를 흉내내는 봇을 막는 층과, 내용으로 거르는 층이 따로 있다.

입구에서 막는 것:

1. 허니팟 (`website` 필드) — 봇이 채우면 저장하지 않고 성공한 척 응답한다
2. 제출 속도 — 폼이 그려진 뒤 2초 안에 보내면 거부
3. 레이트리밋 — 같은 IP 해시 기준 10분에 5개까지
4. 길이 제한 — 이름 40자, 본문 2000자

**한계:** 위 1·2번은 브라우저를 쓰는 봇만 막는다. `curl` 로 API를 직접 때리면
honeypot 을 비우고 `rendered_at` 만 맞춰 보내면 통과한다. CORS 는 브라우저가 지키는 규칙이라
서버에서 보내는 요청은 막지 못한다. 3번 레이트리밋이 유일한 실질 방어선이고,
IP 를 돌리면 그것도 뚫린다. 완전히 막으려면 Cloudflare Turnstile 이 필요하다.

내용으로 거르는 것 (`AUTO_HOLD`, 기본 켜짐):

5. 본문에 **한글이 한 글자도 없으면** 승인 대기로 돌린다 (`hold_reason = 'no-hangul'`)
6. 본문이나 이름에 **링크가 섞이면** 승인 대기로 돌린다 (`hold_reason = 'link'`)

거절이 아니라 보류다. 대기 중인 댓글은 공개 목록에 안 나오고 글쓴이에게만 보인다.
영어로 쓰는 진짜 독자를 막지 않으려는 선택이다. 끄려면 `wrangler.jsonc` 에 `"AUTO_HOLD": "0"`.

그 외:

7. 본문은 평문으로 저장하고 `textContent` 로만 출력한다 (HTML 실행 안 됨)

IP 원문은 저장하지 않는다. `IP_SALT` 를 섞은 해시만 남긴다.

## 알림

코드는 들어가 있고 **아직 켜지지 않았다.** 시크릿을 넣는 순간 동작한다.

웹훅(Discord·Slack)으로 받으려면:

```sh
printf '%s' '<웹훅 URL>' | npx wrangler secret put NOTIFY_WEBHOOK
```

메일로 받으려면 (Resend):

```sh
printf '%s' '<API 키>' | npx wrangler secret put RESEND_API_KEY
printf '%s' '<받을 주소>' | npx wrangler secret put NOTIFY_EMAIL
```

둘 다 넣으면 둘 다 간다. 알림이 실패해도 댓글 등록은 영향받지 않는다.
독자가 남긴 이메일 주소는 알림 본문에 넣지 않는다 — 남겼는지 여부만 알린다.

### 쓰면 안 되는 두 가지

- **ntfy.sh 무료 서버**: 보내는 IP 기준으로 일일 한도를 거는데 Cloudflare Worker 는
  egress IP 를 공유해서 늘 한도 초과다 (`429 / code 42908`). 로컬 curl 로는 되고
  Worker 에서는 안 되므로 테스트할 때 속기 쉽다. 유료 플랜은 월 $6부터.
- **Cloudflare Email Routing**: 켜면 MX 레코드가 덮어써진다.
  `yourbuoy.kr` 은 Google Workspace 로 메일을 받고 있어서 기존 메일이 끊긴다.

알림 없이 확인하려면 `?admin=1` 로 글을 열거나 아래 명령을 쓴다.

## 배포

```sh
cd tools/comments-worker
npx wrangler deploy
```

## 스키마 변경

`schema.sql` 수정 후

```sh
npx wrangler d1 execute yourbuoy-comments --remote --file=./schema.sql
```
