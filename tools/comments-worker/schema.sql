-- yourBuoy 익명 댓글 저장소 (Cloudflare D1)
CREATE TABLE IF NOT EXISTS comments (
  id         TEXT PRIMARY KEY,
  page_id    TEXT NOT NULL,          -- 글 URL (예: /life/phu-quoc-.../)
  parent_id  TEXT,                   -- 답글이면 부모 댓글 id
  name       TEXT NOT NULL,
  email      TEXT,                   -- 선택. 회신용이며 공개 응답에 절대 포함하지 않는다.
  message    TEXT NOT NULL,
  is_author  INTEGER NOT NULL DEFAULT 0,
  approved   INTEGER NOT NULL DEFAULT 1,
  hold_reason TEXT,                  -- 'link' | 'no-hangul'. 왜 승인 대기로 돌렸는지.
  ip_hash    TEXT,                   -- 원문 IP는 저장하지 않는다. 레이트리밋용 해시.
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_page ON comments (page_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_rate ON comments (ip_hash, created_at);
