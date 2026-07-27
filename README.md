# Cube007 · 个人网站

> 编程 / 后端 / AI 学习笔记 + 开发小工具。纯静态,Astro 驱动,暗色流光科技感。

线上地址:[cube007.cn](https://cube007.cn)

## 功能

- **笔记博客** —— Markdown 写作,统一时间流 + 标签分类,暗色阅读排版
- **搜索** —— 纯前端按标题/摘要/标签过滤
- **RSS** —— `/rss.xml`
- **开发小工具**(纯前端,数据不上传):
  - JSON 格式化 / 压缩 / 校验
  - Base64 编解码(UTF-8 安全,支持中文与 emoji)
  - URL 编解码
  - 正则测试
  - Unix 时间戳 ↔ 日期互转(自动区分秒/毫秒)
  - UUID v4 与随机密码生成

## 技术栈

- [Astro](https://astro.build) 7(静态生成,默认零 JS)
- 纯 TypeScript 工具逻辑 + Vitest 单元测试
- 原生 CSS 设计 token(无 UI 框架)

## 本地开发

```bash
npm install
npm run dev        # 本地预览 http://localhost:4321
```

## 构建

```bash
npm run build      # 产物在 dist/
npm run test       # 跑单元测试
```

`dist/` 是纯静态文件,可托管在任意静态服务器(Nginx / Caddy / Vercel / Cloudflare Pages)。

## 自动部署

push 到 `main` 后,GitHub Actions 会:

1. 安装依赖并跑测试
2. `npm run build` 生成 `dist/`
3. 通过 SSH 把产物同步到宝塔服务器 `/www/wwwroot/cube007.cn`

需要在仓库 **Settings → Secrets and variables → Actions** 配置:

| Secret | 含义 | 示例 |
|---|---|---|
| `SSH_HOST` | 服务器公网 IP | `43.138.10.176` |
| `SSH_USER` | SSH 用户 | `root` |
| `SSH_PORT` | SSH 端口 | `22` |
| `SSH_PASSWORD` | 登录密码 | (仅存 Secrets,不要写进代码) |

宝塔 Nginx 建议配置:

```nginx
root /www/wwwroot/cube007.cn;
index index.html;
error_page 404 /404.html;

location / {
    try_files $uri $uri/ $uri.html /index.html;
}
```

## 项目结构

```
src/
  content/notes/     # 笔记 Markdown,frontmatter: title/date/tags/draft
  lib/tools/         # 工具的纯函数逻辑 + 单测(逻辑与界面分离)
  pages/             # 路由:笔记 / 标签 / 工具
  components/        # 布局、笔记卡片、共享工具 UI
  styles/global.css  # 设计 token 唯一定义点(颜色/流光/间距)
```

## 写一篇新笔记

### 最快方式

```bash
npm run new:note -- "我的笔记标题"
# 可选自定义 slug:
npm run new:note -- "我的笔记标题" my-custom-slug
```

会从 `templates/note.md` 生成 `src/content/notes/<slug>.md`,默认 `draft: true`。

### 草稿流程

| 环境 | 草稿是否可见 |
|---|---|
| `npm run dev` | ✅ 可见,卡片带「草稿」标记 |
| `npm run build` / 线上 | ❌ 不发布 |

写完后把 frontmatter 里的 `draft: true` 改成 `false`(或删掉该字段),再 commit + push 即上线。

### 手写模板

也可以直接在 `src/content/notes/` 新建 `.md`:

```markdown
---
title: '笔记标题'
date: 2026-08-01
tags: ['后端']
description: '一句话摘要'
draft: true
---

正文内容……
```

笔记页底部会按**共享标签**推荐相关笔记。

## 在线写作后台(管理员)

入口:[https://cube007.cn/admin/](https://cube007.cn/admin/)

技术选型:**Sveltia CMS + GitHub 后端 + 自建 OAuth 代理**。

- 登录:GitHub OAuth,仅允许名单用户(默认 `xCube007`)
- 保存文章 = commit 到 `main` 的 `src/content/notes/`
- 随后 GitHub Actions 自动 build + 部署,草稿(`draft: true`)仍不会出现在生产站

### 一次性配置(约 15 分钟)

1. **GitHub OAuth App**  
   https://github.com/settings/developers → New OAuth App  
   - Homepage: `https://cube007.cn`  
   - Callback: `https://oauth.cube007.cn/callback`

2. **部署 OAuth 代理**  
   详见 [`oauth-proxy/README.md`](oauth-proxy/README.md)。  
   把 `oauth-proxy/` 丢到宝塔 Node 项目,配环境变量,Nginx 反代 `oauth.cube007.cn` → `127.0.0.1:8787`。

3. **确认 CMS 配置**  
   [`public/admin/config.yml`](public/admin/config.yml) 里 `backend.base_url` 指向你的代理域名。

### 日常写作

1. 打开 `/admin/` → Login with GitHub  
2. 新建笔记 / 编辑已有笔记  
3. 草稿开关:开着 = 仓库里有文件但线上不展示;关掉后下次部署即发布  
4. Save → 等 1–2 分钟 Actions 跑完 → 线上更新  

本地命令行写作(`npm run new:note`)仍然可用,两套流程并存。

## 设计约定

- **逻辑与界面分离**:每个工具的计算逻辑是 `src/lib/tools/` 下的纯函数,UI 只管调用与渲染,逻辑可单测。
- **设计 token 单点定义**:颜色、流光动画、间距只在 `global.css` 定义,组件只引用 `var(--xxx)`,不内联写死。
- **前台零运行时后端**:访客侧全是静态文件;仅管理员写作走 GitHub API + 独立 OAuth 代理。
