// Cloudflare Pages Function —— GET /auth
// 作用：把 Decap CMS 的登录请求转发给 GitHub 授权页。
// 需要的环境变量（Cloudflare Pages 项目设置 → 变量和机密）：
//   GITHUB_CLIENT_ID       GitHub OAuth App 的 Client ID
//   GITHUB_CLIENT_SECRET   GitHub OAuth App 的 Client Secret

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const clientId = env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return new Response('缺少环境变量 GITHUB_CLIENT_ID', { status: 500 });
  }

  // CSRF 防护：生成随机 state，同时写入 HttpOnly Cookie，回调时比对
  const state = crypto.randomUUID();

  const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', `${url.origin}/callback`);
  authorizeUrl.searchParams.set('scope', 'repo');
  authorizeUrl.searchParams.set('state', state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizeUrl.toString(),
      'Set-Cookie': `decap_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
      'Cache-Control': 'no-store',
    },
  });
}
