# OAuth 代理 · 宝塔完整配置手册

给 Sveltia CMS(`/admin/`)提供 GitHub 登录。  
目标形态:

```text
浏览器
  → https://cube007.cn/admin/          (静态站,已有)
  → 点「Login with GitHub」
  → https://oauth.cube007.cn/auth      (本代理,Nginx 反代)
  → GitHub 授权页
  → https://oauth.cube007.cn/callback  (本代理换 token)
  → 回到 /admin/ 进入写作后台
```

---

## 0. 开始前确认

| 项 | 你应已具备 |
|---|---|
| 服务器 | 宝塔 + Nginx,能 SSH 或用面板终端 |
| 主站 | `cube007.cn` / `www` 已能打开静态站 |
| 仓库 | `xCube007/cube007.cn` 已 push 含 `oauth-proxy/` 的代码 |
| 域名 | 能给 `oauth.cube007.cn` 加 DNS A 记录 |
| GitHub 账号 | `xCube007`(有仓库写权限) |

本机若还没 push 含 `oauth-proxy/` 的提交,先:

```bash
cd "D:/My/Code/cube007.cn"
git push origin main
```

---

## 1. DNS:加子域

在域名服务商(阿里云 / 腾讯云 / Cloudflare 等)添加:

| 类型 | 主机记录 | 记录值 |
|---|---|---|
| A | `oauth` | 你的服务器公网 IP(例 `43.138.10.176`) |

完整域名即 `oauth.cube007.cn`。  
等解析生效(几分钟到几十分钟)。可用:

```bash
ping oauth.cube007.cn
# 或
nslookup oauth.cube007.cn
```

看到解析到你的服务器 IP 即可继续。

---

## 2. GitHub OAuth App

1. 打开 https://github.com/settings/developers  
2. 左侧 **OAuth Apps** → **New OAuth App**  
3. 严格按下面填(Callback 错一个字符都会登录失败):

| 字段 | 值 |
|---|---|
| Application name | `Cube007 CMS` |
| Homepage URL | `https://cube007.cn` |
| Application description | 可空 |
| Authorization callback URL | `https://oauth.cube007.cn/callback` |

4. **Register application**  
5. 页面上复制 **Client ID**  
6. 点 **Generate a new client secret**,立刻复制 **Client Secret**(只显示一次)

先记在记事本,后面填进宝塔环境变量。  
**不要**把 Client Secret 写进网站代码仓库。

---

## 3. 把 oauth-proxy 放到服务器

### 方式 A:宝塔文件管理(简单)

1. 宝塔左侧 **文件**  
2. 进入 `/www/wwwroot/`  
3. 新建目录 `cube007-oauth`  
4. 把本地仓库里这三个文件上传进去:

```text
oauth-proxy/server.mjs
oauth-proxy/package.json
oauth-proxy/README.md   (可选)
```

最终服务器上应是:

```text
/www/wwwroot/cube007-oauth/
  server.mjs
  package.json
  README.md          (可选)
```

### 方式 B:SSH 从 Git 拉(推荐以后更新)

```bash
cd /www/wwwroot
git clone https://github.com/xCube007/cube007.cn.git cube007-repo-tmp
cp -r cube007-repo-tmp/oauth-proxy /www/wwwroot/cube007-oauth
rm -rf cube007-repo-tmp
# 或者你本来就有整仓,直接:
# cp -r /path/to/repo/oauth-proxy /www/wwwroot/cube007-oauth
```

本代理**没有 npm 依赖**,不需要在服务器执行 `npm install`。

---

## 4. 确认 Node 版本

宝塔终端或 SSH:

```bash
node -v
# 需要 >= 18,推荐 20 或 22
```

若没有 Node 或版本太旧:

1. 宝塔 → **软件商店** → 搜索 **Node 版本管理器** / **PM2管理器** → 安装  
2. 在 Node 版本管理里安装 **v20** 或 **v22**,并设为默认  

再执行 `node -v` 确认。

---

## 5. 用宝塔跑 Node 进程

宝塔不同版本入口名字略有差异,按你面板有的来。

### 5.1 有「Node 项目」模块时

1. 宝塔 → **网站** → 顶部 **Node 项目**(或 软件商店里的 Node 项目管理器)  
2. **添加 Node 项目**,建议这样填:

| 项 | 建议值 |
|---|---|
| 项目名称 | `cube007-oauth` |
| 项目路径 | `/www/wwwroot/cube007-oauth` |
| 启动文件 / 入口 | `server.mjs` |
| 运行端口 | `8787` |
| Node 版本 | 20 或 22 |
| 包管理器 | 无依赖可忽略;有的话选 npm 即可 |
| 启动方式 | `node server.mjs` 或脚本 `start` |
| 开机启动 | 打开 |

3. **环境变量**(非常关键,缺了登录必挂)  
   在项目设置 / 环境变量里逐条添加:

| 变量名 | 值 | 说明 |
|---|---|---|
| `OAUTH_CLIENT_ID` | 你的 Client ID | GitHub OAuth App |
| `OAUTH_CLIENT_SECRET` | 你的 Client Secret | 绝密 |
| `OAUTH_ALLOWED_USERS` | `xCube007` | 仅你的 GitHub 用户名,多个用逗号 |
| `OAUTH_PORT` | `8787` | 与项目端口一致 |
| `OAUTH_HOST` | `127.0.0.1` | 只监听本机,外网走 Nginx |
| `OAUTH_ORIGIN` | `https://cube007.cn,https://www.cube007.cn` | CMS 所在站点,postMessage 用 |

4. 保存 → **启动** / **重启**  
5. 看运行状态是否为「运行中」,点日志应出现类似:

```text
[oauth] listening on http://127.0.0.1:8787
[oauth] allowed users: xcube007
```

### 5.2 没有「Node 项目」、改用 PM2

1. 软件商店安装 **PM2 管理器**  
2. 先写环境文件(宝塔文件管理新建 `/www/wwwroot/cube007-oauth/.env` **不要**提交到 Git):

```bash
OAUTH_CLIENT_ID=你的ClientID
OAUTH_CLIENT_SECRET=你的ClientSecret
OAUTH_ALLOWED_USERS=xCube007
OAUTH_PORT=8787
OAUTH_HOST=127.0.0.1
OAUTH_ORIGIN=https://cube007.cn,https://www.cube007.cn
```

3. 因官方 `server.mjs` 不自动读 `.env`,用下面任一方式注入环境变量。

**方式 1:启动脚本**(推荐)

新建 `/www/wwwroot/cube007-oauth/start.sh`:

```bash
#!/bin/bash
cd /www/wwwroot/cube007-oauth
export OAUTH_CLIENT_ID="你的ClientID"
export OAUTH_CLIENT_SECRET="你的ClientSecret"
export OAUTH_ALLOWED_USERS="xCube007"
export OAUTH_PORT="8787"
export OAUTH_HOST="127.0.0.1"
export OAUTH_ORIGIN="https://cube007.cn,https://www.cube007.cn"
exec /www/server/nodejs/v20.x.x/bin/node server.mjs
# 上面 node 路径用 `which node` 查到的真实路径替换
```

```bash
chmod +x /www/wwwroot/cube007-oauth/start.sh
```

PM2 添加项目:启动文件选 `start.sh`,或:

```bash
pm2 start /www/wwwroot/cube007-oauth/start.sh --name cube007-oauth
pm2 save
```

**方式 2:一行命令**

```bash
cd /www/wwwroot/cube007-oauth
OAUTH_CLIENT_ID=xxx OAUTH_CLIENT_SECRET=yyy OAUTH_ALLOWED_USERS=xCube007 \
OAUTH_PORT=8787 OAUTH_HOST=127.0.0.1 \
OAUTH_ORIGIN=https://cube007.cn,https://www.cube007.cn \
pm2 start server.mjs --name cube007-oauth
pm2 save
pm2 startup
```

### 5.3 本机自检(必做)

SSH 或宝塔终端:

```bash
curl -s http://127.0.0.1:8787/health
```

期望类似:

```json
{"ok":true,"service":"cube007-oauth-proxy","allowedUsers":["xcube007"]}
```

若 `Connection refused`:

- 进程没起来 → 看 Node/PM2 日志  
- 端口不对 → 环境变量 `OAUTH_PORT` 与监听是否一致  

若返回里提示未配置 Client:

- 环境变量没注入成功 → 重启项目后再 `curl`

**先不要**用公网 IP:8787 测,我们故意只绑 `127.0.0.1`。

---

## 6. 宝塔添加站点 + Nginx 反代

### 6.1 添加站点

1. 宝塔 → **网站** → **添加站点**  
2. 域名: `oauth.cube007.cn`  
3. 根目录:随意,例如 `/www/wwwroot/oauth.cube007.cn`(反代后几乎用不到)  
4. PHP: **纯静态**  
5. 数据库:不创建  
6. 提交  

### 6.2 改成反向代理

**图形界面:**

1. 点站点 `oauth.cube007.cn` → **设置**  
2. **反向代理** → **添加反向代理**  

| 项 | 值 |
|---|---|
| 代理名称 | `oauth` |
| 目标 URL | `http://127.0.0.1:8787` |
| 发送域名 | `$host` 或 `oauth.cube007.cn` |
| 缓存 | 关 |

保存。

**或直接改配置文件**(更可控):

站点设置 → **配置文件**,整段可参考:

```nginx
server {
    listen 80;
    server_name oauth.cube007.cn;

    # 日志可选
    access_log /www/wwwlogs/oauth.cube007.cn.log;
    error_log  /www/wwwlogs/oauth.cube007.cn.error.log;

    location / {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_read_timeout 60s;
    }
}
```

保存后 Nginx 会重载。若报错,看提示行号。

### 6.3 申请 HTTPS(必须)

GitHub OAuth Callback 是 `https://...`,HTTP 会出问题。

1. 站点设置 → **SSL**  
2. Let's Encrypt → 勾选 `oauth.cube007.cn` → 申请  
3. 打开 **强制 HTTPS**  
4. 申请成功后配置文件会变成 `listen 443 ssl` 等,反代 `location /` **保留不动**

### 6.4 防火墙 / 安全组

- 宝塔 **安全**:放行 **80、443**(一般主站已放行)  
- **不要**对公网放行 8787  
- 云厂商安全组同样只开 80/443  

---

## 7. 外网验证代理

本机浏览器或服务器上:

```bash
curl -s https://oauth.cube007.cn/health
```

应与内网 health 相同 JSON。

再测授权跳转(应 302 到 github.com):

```bash
curl -sI "https://oauth.cube007.cn/auth?provider=github" | head -20
```

应看到 `Location: https://github.com/login/oauth/authorize?...`

---

## 8. 对齐主站 CMS 配置

仓库文件 `public/admin/config.yml` 应包含:

```yaml
backend:
  name: github
  repo: xCube007/cube007.cn
  branch: main
  base_url: https://oauth.cube007.cn
  auth_endpoint: auth
```

若你改用了别的子域,这里 `base_url` 必须一致,改完:

```bash
git add public/admin/config.yml
git commit -m "Point CMS OAuth base_url to production proxy"
git push origin main
```

等 Actions 部署完成后,静态站 `/admin/` 才会用新地址。

确认线上:

```bash
curl -s https://cube007.cn/admin/config.yml | head -20
```

---

## 9. 第一次登录联调

1. 浏览器打开: https://cube007.cn/admin/  
2. 应加载出 Sveltia/登录界面(不是纯 404)  
3. 点 **Login with GitHub**  
4. 弹出 GitHub 授权 → 用 **xCube007** 账号允许  
5. 弹窗关闭,后台进入笔记列表  
6. 试新建一篇,`draft` 先勾上 → Save  
7. 到 GitHub 仓库看是否出现新 commit  
8. Actions 绿了之后:  
   - 草稿不应出现在 https://cube007.cn/  
   - 把草稿 `draft` 关掉再 Save → 再部署后首页可见  

---

## 10. 常见故障排查

### A. `/admin/` 打开白屏或一直「正在加载」

- 看浏览器 F12 → Network,是否加载了  
  `https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js`  
  若被墙/超时:换网络,或把该 JS 下载到 `public/admin/` 改成本地引用  
- `config.yml` 是否 200:`https://cube007.cn/admin/config.yml`

### B. 点登录没反应 / 弹窗一闪关闭

- `base_url` 是否 `https://oauth.cube007.cn`(无末尾斜杠问题一般没事,路径要对)  
- 代理 health 是否外网可访问  
- 浏览器是否拦截弹窗 → 允许该站点弹窗  

### C. GitHub 报 redirect_uri 不匹配

- OAuth App 的 Callback 必须是:  
  `https://oauth.cube007.cn/callback`  
  与地址栏完全一致(http/https、有无 www、路径)

### D. 提示不在允许名单

- 登录的 GitHub 用户名必须在 `OAUTH_ALLOWED_USERS`  
- 大小写不敏感,但别写错字母  
- 改环境变量后**必须重启** Node/PM2  

### E. 能登录但 Save 失败 / 无权限

- 该 GitHub 账号对 `xCube007/cube007.cn` 要有 **写权限**  
- OAuth 授权 scope 需含 repo(代理默认 `repo,user`)  
- 首次授权若 scope 不够:GitHub → Settings → Applications → 撤销后再登  

### F. curl 内网 health 正常,外网 502

- Nginx `proxy_pass` 端口是否 8787  
- Node 是否只监听 `127.0.0.1`(正确)且进程在跑  
- 看站点 error 日志:`/www/wwwlogs/oauth.cube007.cn.error.log`

### G. 证书申请失败

- DNS 是否已指向本机  
- 80 端口是否对外开放  
- 同域名是否已有冲突站点  

### H. 改完环境变量不生效

```bash
# PM2
pm2 restart cube007-oauth --update-env
pm2 logs cube007-oauth --lines 50

# 宝塔 Node 项目
# 面板里点重启,再看日志
```

---

## 11. 日常维护

| 动作 | 怎么做 |
|---|---|
| 看代理是否活着 | `curl -s http://127.0.0.1:8787/health` |
| 看日志 | 宝塔 Node/PM2 日志,或 `pm2 logs cube007-oauth` |
| 更新代理代码 | 覆盖 `server.mjs` 后重启进程 |
| 换 Client Secret | 改环境变量 → 重启;GitHub 可 rotate secret |
| 停用后台登录 | 停掉 Node 项目或删 Nginx 反代 |

代理与主站静态文件**分离**:

- 主站:GitHub Actions → `/www/wwwroot/cube007.cn`  
- 代理:长期跑在 `/www/wwwroot/cube007-oauth`,不随 dist 覆盖  

---

## 12. 清单(做完逐项打勾)

- [ ] DNS: `oauth.cube007.cn` → 服务器 IP  
- [ ] GitHub OAuth App 已建,Callback = `https://oauth.cube007.cn/callback`  
- [ ] `/www/wwwroot/cube007-oauth/server.mjs` 已就位  
- [ ] Node >= 18,进程运行中  
- [ ] 环境变量 6 项已配且重启生效  
- [ ] `curl http://127.0.0.1:8787/health` → ok  
- [ ] 宝塔站点 + 反代 + HTTPS + 强制 HTTPS  
- [ ] `curl https://oauth.cube007.cn/health` → ok  
- [ ] 线上 `config.yml` 的 `base_url` 正确  
- [ ] `/admin/` 可用 xCube007 登录并 Save 出 commit  

全部勾完即可日常在网页写文章。  
卡在哪一步,把**界面截图**或**命令输出 / 日志**发出来即可继续排。
