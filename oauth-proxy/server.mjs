/**
 * 极简 GitHub OAuth 代理 —— 给 Sveltia / Decap CMS 用。
 *
 * 流程:
 * 1. CMS 打开 /auth → 302 到 GitHub 授权页
 * 2. GitHub 回调 /callback?code=... → 用 code 换 access_token
 * 3. 校验登录用户是否在允许名单 → postMessage 把 token 交给 CMS 弹窗
 *
 * 部署在宝塔:Node 项目,监听 127.0.0.1:8787,再用 Nginx 反代到
 * https://oauth.cube007.cn (或你配置的域名)。
 *
 * 环境变量(必填):
 *   OAUTH_CLIENT_ID       GitHub OAuth App Client ID
 *   OAUTH_CLIENT_SECRET   GitHub OAuth App Client Secret
 *   OAUTH_ALLOWED_USERS   允许的 GitHub 用户名,逗号分隔(例: xCube007)
 * 可选:
 *   OAUTH_PORT            默认 8787
 *   OAUTH_HOST            默认 127.0.0.1
 *   OAUTH_ORIGIN          站点 origin,默认 https://cube007.cn
 *                         (postMessage 目标;www 与裸域都写进列表)
 */

import http from 'node:http';
import { URL } from 'node:url';

const PORT = Number(process.env.OAUTH_PORT || 8787);
const HOST = process.env.OAUTH_HOST || '127.0.0.1';
const CLIENT_ID = process.env.OAUTH_CLIENT_ID || '';
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET || '';
const ALLOWED_USERS = (process.env.OAUTH_ALLOWED_USERS || 'xCube007')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const ORIGINS = (process.env.OAUTH_ORIGIN || 'https://cube007.cn,https://www.cube007.cn')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function json(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data),
  });
  res.end(data);
}

function html(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(body);
}

function text(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(body);
}

function requireEnv(res) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    text(
      res,
      500,
      'OAUTH_CLIENT_ID / OAUTH_CLIENT_SECRET 未配置。请在宝塔环境变量或 .env 里设置。'
    );
    return false;
  }
  return true;
}

/** CMS 期望的成功页:把 token 通过 postMessage 回传给 opener */
function successPage(token) {
  // content 字段是 Decap/Sveltia 约定
  const payload = JSON.stringify(`authorization:github:success:${JSON.stringify({ token })}`);
  const origins = JSON.stringify(ORIGINS);
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8" /><title>登录成功</title></head>
<body>
<script>
  (function () {
    var payload = ${payload};
    var origins = ${origins};
    function send() {
      if (!window.opener) return;
      origins.forEach(function (origin) {
        try { window.opener.postMessage(payload, origin); } catch (e) {}
      });
      // 兼容部分实现用 '*'
      try { window.opener.postMessage(payload, '*'); } catch (e) {}
    }
    send();
    setTimeout(function () { window.close(); }, 800);
  })();
</script>
<p style="font-family:system-ui;text-align:center;margin-top:20vh">登录成功,可以关闭此窗口。</p>
</body></html>`;
}

function errorPage(msg) {
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8" /><title>登录失败</title></head>
<body>
<p style="font-family:system-ui;text-align:center;margin-top:20vh;color:#b91c1c">登录失败: ${msg}</p>
</body></html>`;
}

async function exchangeCode(code) {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
    }),
  });
  if (!res.ok) {
    throw new Error(`GitHub token 交换失败: HTTP ${res.status}`);
  }
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error_description || data.error);
  }
  return data.access_token;
}

async function fetchUser(token) {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'cube007-oauth-proxy',
    },
  });
  if (!res.ok) {
    throw new Error(`读取 GitHub 用户失败: HTTP ${res.status}`);
  }
  return res.json();
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  // 健康检查
  if (url.pathname === '/' || url.pathname === '/health') {
    return json(res, 200, {
      ok: true,
      service: 'cube007-oauth-proxy',
      allowedUsers: ALLOWED_USERS,
    });
  }

  // 1) 开始授权
  if (url.pathname === '/auth') {
    if (!requireEnv(res)) return;
    const provider = url.searchParams.get('provider') || 'github';
    if (provider !== 'github') {
      return text(res, 400, '仅支持 provider=github');
    }
    const scope = url.searchParams.get('scope') || 'repo,user';
    const auth = new URL('https://github.com/login/oauth/authorize');
    auth.searchParams.set('client_id', CLIENT_ID);
    auth.searchParams.set('scope', scope);
    // 可选:state 防 CSRF;单人站简化省略,生产可补
    res.writeHead(302, { Location: auth.toString() });
    return res.end();
  }

  // 2) GitHub 回调
  if (url.pathname === '/callback') {
    if (!requireEnv(res)) return;
    const code = url.searchParams.get('code');
    const err = url.searchParams.get('error');
    if (err) {
      return html(res, 400, errorPage(err));
    }
    if (!code) {
      return html(res, 400, errorPage('缺少 code'));
    }
    try {
      const token = await exchangeCode(code);
      const user = await fetchUser(token);
      const login = String(user.login || '').toLowerCase();
      if (!ALLOWED_USERS.includes(login)) {
        console.warn(`[oauth] 拒绝非管理员登录: ${user.login}`);
        return html(
          res,
          403,
          errorPage(`用户 ${user.login} 不在允许名单。仅站长可进入写作后台。`)
        );
      }
      console.log(`[oauth] 管理员登录成功: ${user.login}`);
      return html(res, 200, successPage(token));
    } catch (e) {
      console.error('[oauth] callback error', e);
      return html(res, 500, errorPage(e instanceof Error ? e.message : String(e)));
    }
  }

  text(res, 404, 'Not Found');
});

server.listen(PORT, HOST, () => {
  console.log(`[oauth] listening on http://${HOST}:${PORT}`);
  console.log(`[oauth] allowed users: ${ALLOWED_USERS.join(', ')}`);
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.warn('[oauth] 警告: OAUTH_CLIENT_ID / OAUTH_CLIENT_SECRET 尚未设置');
  }
});
