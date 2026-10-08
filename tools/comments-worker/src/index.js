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
const MAX_EMAIL = 120;
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

/* 공개 응답에는 이메일을 절대 넣지 않는다. 관리자만 회신용으로 본다. */
const PUBLIC_COLUMNS = 'id, page_id, parent_id, name, message, is_author, approved, created_at';
const ADMIN_COLUMNS = PUBLIC_COLUMNS + ', email, hold_reason';

async function listComments(env, pageId, asAdmin) {
  const columns = asAdmin ? ADMIN_COLUMNS : PUBLIC_COLUMNS;
  const where = asAdmin ? 'page_id = ?' : 'page_id = ? AND approved = 1';
  const { results } = await env.DB
    .prepare('SELECT ' + columns + ' FROM comments WHERE ' + where + ' ORDER BY created_at ASC')
    .bind(pageId).all();
  return results || [];
}

/*
 * 한국어 블로그다. 본문에 한글이 한 글자도 없거나 링크가 섞이면 스팸일 확률이 높다.
 * 거절하지 않고 '승인 대기'로 돌린다 — 영어로 쓰는 진짜 독자를 막지 않으려는 것이다.
 * 대기 중인 댓글은 공개 목록에 안 나오고 글쓴이에게만 보인다.
 */
const HANGUL = /[\uac00-\ud7a3\u1100-\u11ff\u3130-\u318f]/;
const LINKISH = /(https?:\/\/|www\.|\bt\.me\b|\[url[=\]]|<a\s)/i;

function holdReason(name, message, env) {
  if (env.AUTO_HOLD === '0') return null;
  if (LINKISH.test(message) || LINKISH.test(name)) return 'link';
  if (!HANGUL.test(message)) return 'no-hangul';
  return null;
}

/* 형식만 가볍게 본다. 선택 입력이라 틀렸다고 댓글을 막지는 않는다. */
function normalizeEmail(raw) {
  const value = clean(raw, MAX_EMAIL);
  if (!value) return { email: null };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { error: '이메일 형식을 확인해주세요. 비워두셔도 됩니다.' };
  }
  return { email: value };
}

async function handlePost(request, env, ctx) {
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

  const mail = normalizeEmail(body.email);
  if (mail.error) return json({ error: mail.error }, request, env, 400);

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
  const hold = author ? null : holdReason(name, message, env);
  const approved = author || (env.REQUIRE_APPROVAL !== '1' && !hold) ? 1 : 0;
  const id = crypto.randomUUID();

  await env.DB.prepare(
    `INSERT INTO comments (id, page_id, parent_id, name, email, message, is_author, approved, hold_reason, ip_hash, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, pageId, parentId, name, mail.email, message, author, approved, hold, ipHash, new Date().toISOString()).run();

  /* 응답을 붙잡지 않도록 알림은 백그라운드로 보낸다. */
  const task = notify(env, { name, email: mail.email, message, page_id: pageId, approved, hold });
  if (ctx && ctx.waitUntil) ctx.waitUntil(task);

  return json({ ok: true, id, approved }, request, env, 201);
}

/*
 * 새 댓글 알림.
 *
 * ntfy.sh 는 쓸 수 없다. 무료 서버가 "보내는 IP" 기준으로 일일 한도를 거는데
 * Cloudflare Worker 는 egress IP 를 남들과 공유해서 한도가 늘 소진돼 있다 (429 42908).
 *
 * 그래서 두 경로를 둔다. 시크릿을 넣은 쪽만 동작하고, 둘 다 없으면 조용히 넘어간다.
 *   NOTIFY_WEBHOOK            Discord / Slack 수신 웹훅 URL
 *   RESEND_API_KEY + NOTIFY_EMAIL  Resend 로 메일 발송
 *
 * 독자가 남긴 이메일 주소는 본문에 넣지 않는다. 남겼는지 여부만 알린다.
 * 알림이 실패해도 댓글 등록은 성공해야 하므로 예외를 삼킨다.
 */
function buildNotice(comment) {
  const held = comment.approved === 0;
  const head = held
    ? (comment.hold === 'link' ? 'yourBuoy 댓글 — 링크가 있어 승인 대기' : 'yourBuoy 댓글 — 한글이 없어 승인 대기')
    : 'yourBuoy 새 댓글';
  const body = [
    comment.name + '님' + (comment.email ? ' (회신 주소 남김)' : ''),
    '',
    comment.message.slice(0, 400),
    '',
    'https://yourbuoy.kr' + comment.page_id,
  ].join('\n');
  return { held, head, body };
}

async function notify(env, comment) {
  const { head, body } = buildNotice(comment);
  const text = head + '\n\n' + body;

  if (env.NOTIFY_WEBHOOK) {
    try {
      /* Discord 는 content, Slack 은 text 를 읽는다. 둘 다 보내면 어느 쪽이든 받는다. */
      const res = await fetch(env.NOTIFY_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, text: text }),
      });
      if (!res.ok) console.log('webhook 실패', res.status, (await res.text()).slice(0, 200));
    } catch (e) {
      console.log('webhook 예외', e && e.message);
    }
  }

  if (env.RESEND_API_KEY && env.NOTIFY_EMAIL) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + env.RESEND_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.NOTIFY_FROM || 'onboarding@resend.dev',
          to: [env.NOTIFY_EMAIL],
          subject: head,
          text: body,
        }),
      });
      if (!res.ok) console.log('resend 실패', res.status, (await res.text()).slice(0, 200));
    } catch (e) {
      console.log('resend 예외', e && e.message);
    }
  }
}

export default {
  async fetch(request, env, ctx) {
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
      return handlePost(request, env, ctx);
    }

    if (path.startsWith('/admin/')) {
      if (!isAdmin(request, env)) return json({ error: '권한이 없습니다.' }, request, env, 401);

      if (path === '/admin/comments' && request.method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT ' + ADMIN_COLUMNS + ' FROM comments ORDER BY created_at DESC LIMIT 200'
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
        await env.DB.prepare('UPDATE comments SET approved = 1, hold_reason = NULL WHERE id = ?').bind(approve[1]).run();
        return json({ ok: true }, request, env);
      }
    }

    return json({ error: 'Not found' }, request, env, 404);
  },
};
