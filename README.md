# Cube007 · 个人网站

> 编程 / 后端 / AI 学习笔记 + 开发小工具。纯静态,Astro 驱动,暗色流光科技感。

线上地址:[cube007.cn](https://cube007.cn)

## 功能

- **笔记博客** —— Markdown 写作,统一时间流 + 标签分类,暗色阅读排版
- **开发小工具**(纯前端,数据不上传):
  - JSON 格式化 / 压缩 / 校验
  - Base64 编解码(UTF-8 安全,支持中文与 emoji)
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

往 `src/content/notes/` 丢一个 `.md` 文件:

```markdown
---
title: '笔记标题'
date: 2026-08-01
tags: ['后端']
description: '一句话摘要'
---

正文内容……
```

提交后(配了自动部署的话)自动发布。

## 设计约定

- **逻辑与界面分离**:每个工具的计算逻辑是 `src/lib/tools/` 下的纯函数,UI 只管调用与渲染,逻辑可单测。
- **设计 token 单点定义**:颜色、流光动画、间距只在 `global.css` 定义,组件只引用 `var(--xxx)`,不内联写死。
- **零运行时后端**:所有计算在浏览器完成。
