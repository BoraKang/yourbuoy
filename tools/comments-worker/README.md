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

블로그 글 주소 뒤에 `?admin=1` 을 붙여서 열면 토큰을 묻는다.
한 번 넣으면 그 브라우저에 저장되고, 이후 각 댓글에 **삭제**(승인 대기면 **승인**) 버튼이 생긴다.

터미널에서 바로 볼 수도 있다.

```sh
npx wrangler d1 execute yourbuoy-comments --remote \
  --command "SELECT created_at, page_id, name, message FROM comments ORDER BY created_at DESC LIMIT 20"
```

## 승인제로 바꾸기

기본은 즉시 공개다. 스팸이 늘면 `wrangler.jsonc` 의 `REQUIRE_APPROVAL` 을 `"1"` 로 바꾸고
`npx wrangler deploy`. 이후 새 댓글은 승인 전까지 글쓴이에게만 보인다.

## 스팸 방어

1. 허니팟 (`website` 필드) — 봇이 채우면 저장하지 않고 성공한 척 응답한다
2. 제출 속도 — 폼이 그려진 뒤 2초 안에 보내면 거부
3. 레이트리밋 — 같은 IP 해시 기준 10분에 5개까지
4. 길이 제한 — 이름 40자, 본문 2000자
5. 본문은 평문으로 저장하고 `textContent` 로만 출력한다 (HTML 실행 안 됨)

IP 원문은 저장하지 않는다. `IP_SALT` 를 섞은 해시만 남긴다.

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
