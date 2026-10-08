/**
 * yourBuoy 익명 댓글 API (Cloudflare Workers + D1)
 *
 * 공개:
 *   GET    /comments?page=<pageId>        공개된 댓글 목록
 *   POST   /comments                      댓글 작성 (익명)
 * 관리자 (Authorization: Bearer <ADMIN_TOKEN>):
 *   GET    /admin/comments                미승인 포함 전체
 *   DELETE /admin/comments/<id>           삭제
 *   POST   /admin/comments/<id>/approve   승인
 */

const MAX_NAME = 40;
const MAX_MESSAGE = 2000;
const RATE_WINDOW_MIN = 10;
const RATE_MAX = 5;
const MIN_FILL_SECONDS = 2;

function corsHeaders(request, env) {
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const origin = request.headers.get('Origin') || '';
  const ok = allowed.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : allowed[0] || '',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body, request, env, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(request, env) },
  });
}

async function hashIp(ip, salt) {
  const data = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

function isAdmin(request, env) {
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  return Boolean(env.ADMIN_TOKEN) && token === env.ADMIN_TOKEN;
}

/** 댓글 본문은 저장할 때 평문으로 두고, 출력은 프런트에서 textContent로 넣는다. */
function clean(value, max) {
  return String(value == null ? '' : value).replace(/\u0000/g, '').trim().slice(0, max);
}

async function listComments(env, pageId, includeHidden) {
  const sql = includeHidden
    ? 'SELECT id, page_id, parent_id, name, message, is_author, approved, created_at FROM comments WHERE page_id = ? ORDER BY created_at ASC'
    : 'SELECT id, page_id, parent_id, name, message, is_author, approved, created_at FROM comments WHERE page_id = ? AND approved = 1 ORDER BY created_at ASC';
  const { results } = await env.DB.prepare(sql).bind(pageId).all();
  return results || [];
}

async function handlePost(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: '요청 형식이 올바르지 않습니다.' }, request, env, 400);
  }

  // 1. 허니팟: 사람에게는 보이지 않는 필드. 채워져 있으면 봇.
  if (clean(body.website, 200)) {
    return json({ ok: true, id: null }, request, env); // 봇에게는 성공처럼 보이게 둔다.
  }

  // 2. 폼을 너무 빨리 제출하면 봇으로 본다.
  const renderedAt = Number(body.rendered_at || 0);
  if (!renderedAt || (Date.now() - renderedAt) / 1000 < MIN_FILL_SECONDS) {
    return json({ error: '잠시 후 다시 시도해주세요.' }, request, env, 429);
  }

  const pageId = clean(body.page, 300);
  const name = clean(body.name, MAX_NAME);
  const message = clean(body.message, MAX_MESSAGE);
  const parentId = clean(body.parent_id, 64) || null;

  if (!pageId) return json({ error: '글 정보가 없습니다.' }, request, env, 400);
  if (!name) return json({ error: '이름을 입력해주세요.' }, request, env, 400);
  if (!message) return json({ error: '내용을 입력해주세요.' }, request, env, 400);

  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
  const ipHash = await hashIp(ip, env.IP_SALT || 'yourbuoy');

  // 3. 같은 사람이 짧은 시간에 여러 개 올리지 못하게 막는다.
  const since = new Date(Date.now() - RATE_WINDOW_MIN * 60 * 1000).toISOString();
  const recent = await env.DB.prepare(
    'SELECT COUNT(*) AS n FROM comments WHERE ip_hash = ? AND created_at > ?'
  ).bind(ipHash, since).first();
  if (recent && recent.n >= RATE_MAX) {
    return json({ error: `잠시 후 다시 시도해주세요. (${RATE_WINDOW_MIN}분에 ${RATE_MAX}개까지)` }, request, env, 429);
  }

  // 답글이면 부모가 같은 글에 실제로 있어야 한다.
  if (parentId) {
    const parent = await env.DB.prepare('SELECT id FROM comments WHERE id = ? AND page_id = ?')
      .bind(parentId, pageId).first();
    if (!parent) return json({ error: '답글 대상을 찾을 수 없습니다.' }, request, env, 400);
  }

  const author = isAdmin(request, env) ? 1 : 0;
  const approved = author || env.REQUIRE_APPROVAL !== '1' ? 1 : 0;
  const id = crypto.randomUUID();

  await env.DB.prepare(
    `INSERT INTO comments (id, page_id, parent_id, name, message, is_author, approved, ip_hash, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, pageId, parentId, name, message, author, approved, ipHash, new Date().toISOString()).run();

  return json({ ok: true, id, approved }, request, env, 201);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    if (path === '/comments' && request.method === 'GET') {
      const pageId = clean(url.searchParams.get('page'), 300);
      if (!pageId) return json({ error: 'page 파라미터가 필요합니다.' }, request, env, 400);
      const rows = await listComments(env, pageId, isAdmin(request, env));
      return json({ comments: rows }, request, env);
    }

    if (path === '/comments' && request.method === 'POST') {
      return handlePost(request, env);
    }

    if (path.startsWith('/admin/')) {
      if (!isAdmin(request, env)) return json({ error: '권한이 없습니다.' }, request, env, 401);

      if (path === '/admin/comments' && request.method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT id, page_id, parent_id, name, message, is_author, approved, created_at FROM comments ORDER BY created_at DESC LIMIT 200'
        ).all();
        return json({ comments: results || [] }, request, env);
      }

      const del = path.match(/^\/admin\/comments\/([\w-]+)$/);
      if (del && request.method === 'DELETE') {
        // 답글이 달린 댓글을 지우면 답글도 함께 사라진다.
        await env.DB.prepare('DELETE FROM comments WHERE id = ? OR parent_id = ?').bind(del[1], del[1]).run();
        return json({ ok: true }, request, env);
      }

      const approve = path.match(/^\/admin\/comments\/([\w-]+)\/approve$/);
      if (approve && request.method === 'POST') {
        await env.DB.prepare('UPDATE comments SET approved = 1 WHERE id = ?').bind(approve[1]).run();
        return json({ ok: true }, request, env);
      }
    }

    return json({ error: 'Not found' }, request, env, 404);
  },
};
