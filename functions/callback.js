// Cloudflare Pages Function —— GET /callback
// 作用：接收 GitHub 回跳的 code，换成 access token，再通过 postMessage 交回 Decap CMS。

function readCookie(request, name) {
  const raw = request.headers.get('Cookie') || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

// 把结果页面回传给打开它的后台窗口（Decap 的 OAuth 握手协议）
function handshakePage(status, payload) {
  const body = JSON.stringify(payload || {}).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>登录中…</title></head>
<body>
<p style="font-family:system-ui;padding:24px;color:#555">正在完成登录，稍候…</p>
<script>
  (function () {
    var message = 'authorization:github:${status}:${body}';
    function receiveMessage(e) {
      try {
        window.opener.postMessage(message, e.origin);
      } catch (err) {}
      window.removeEventListener('message', receiveMessage, false);
    }
    window.addEventListener('message', receiveMessage, false);
    try { window.opener.postMessage('authorizing:github', '*'); } catch (err) {}
  })();
</script>
</body>
</html>`;
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expectedState = readCookie(request, 'decap_oauth_state');

  const htmlHeaders = {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'Set-Cookie': 'decap_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
  };

  if (!code) {
    return new Response(
      handshakePage('error', { message: 'GitHub 没有返回授权码，可能你点了取消。' }),
      { status: 200, headers: htmlHeaders }
    );
  }

  if (!state || !expectedState || state !== expectedState) {
    return new Response(
      handshakePage('error', { message: 'state 校验失败，请重新登录一次。' }),
      { status: 200, headers: htmlHeaders }
    );
  }

  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return new Response(
      handshakePage('error', { message: '缺少 GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET 环境变量。' }),
      { status: 200, headers: htmlHeaders }
    );
  }

  let data = {};
  try {
    const resp = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    data = await resp.json();
  } catch (err) {
    return new Response(
      handshakePage('error', { message: '向 GitHub 换取 token 失败：' + String(err) }),
      { status: 200, headers: htmlHeaders }
    );
  }

  if (!data.access_token) {
    return new Response(
      handshakePage('error', {
        message: data.error_description || data.error || 'GitHub 未返回 access_token。',
      }),
      { status: 200, headers: htmlHeaders }
    );
  }

  return new Response(
    handshakePage('success', { token: data.access_token, provider: 'github' }),
    { status: 200, headers: htmlHeaders }
  );
}
