# OAuth 代理 · 部署说明

给 Sveltia CMS(`/admin/`)提供 GitHub 登录。

## 1. 创建 GitHub OAuth App

1. 打开 https://github.com/settings/developers → **OAuth Apps** → **New OAuth App**
2. 填写:
   - **Application name**: `Cube007 CMS`
   - **Homepage URL**: `https://cube007.cn`
   - **Authorization callback URL**: `https://oauth.cube007.cn/callback`
     (若你用别的域名反代,这里改成对应地址)
3. 创建后拿到 **Client ID** 和 **Client Secret**

## 2. 宝塔部署代理

1. 把本目录 `oauth-proxy/` 上传到服务器,例如 `/www/wwwroot/cube007-oauth/`
2. 宝塔 → **Node 项目** → 添加项目:
   - 启动文件: `server.mjs`
   - 运行目录: `/www/wwwroot/cube007-oauth`
   - 端口: `8787`
3. 环境变量(项目设置里加):

```bash
OAUTH_CLIENT_ID=你的ClientID
OAUTH_CLIENT_SECRET=你的ClientSecret
OAUTH_ALLOWED_USERS=xCube007
OAUTH_PORT=8787
OAUTH_HOST=127.0.0.1
OAUTH_ORIGIN=https://cube007.cn,https://www.cube007.cn
```

4. 启动项目,确认 `curl http://127.0.0.1:8787/health` 返回 `ok: true`

## 3. Nginx 反代

建议单独子域 `oauth.cube007.cn`(A 记录指向同一台服务器),站点配置:

```nginx
server {
    listen 80;
    server_name oauth.cube007.cn;
    # 证书用宝塔 SSL 申请后会改成 443

    location / {
        proxy_pass http://127.0.0.1:8787;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

申请 Let's Encrypt 强制 HTTPS。

## 4. 对齐 CMS 配置

确认站点仓库里 `public/admin/config.yml`:

```yaml
backend:
  name: github
  repo: xCube007/cube007.cn
  branch: main
  base_url: https://oauth.cube007.cn
  auth_endpoint: auth
```

改完 push,等静态站部署后再访问 `https://cube007.cn/admin/`。

## 5. 使用

1. 打开 `https://cube007.cn/admin/`
2. 点 Login with GitHub
3. 仅 `OAUTH_ALLOWED_USERS` 里的账号能进
4. 新建/编辑笔记 → Save → 会 commit 到 `main` → GitHub Actions 自动部署

## 安全注意

- Client Secret **只放服务器环境变量**,不要写进前端仓库
- 允许名单再卡一层,即使别人拿着 OAuth App 也登不进(仍须有仓库写权限才能真正改内容)
- 仓库是 public 时,别人仍可读代码;写权限只在你账号
