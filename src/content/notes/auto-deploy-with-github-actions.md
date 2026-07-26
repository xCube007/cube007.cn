---
title: '把静态站自动部署到自己的服务器:GitHub Actions 实战'
date: 2026-07-27
tags: ['编程', 'DevOps']
description: '记录用 GitHub Actions 把 Astro 静态站自动部署到宝塔服务器的过程,以及踩过的三个坑。'
---

站点代码托管在 GitHub 了,接下来想让"写完 push 就自动上线"这件事跑起来。这篇记录整个配通过程,重点是踩过的三个坑 —— 都是那种本地完全没问题、上了 CI 才暴露的。

## 目标

push 到 `main` 分支 → GitHub Actions 自动:跑测试 → build → 把 `dist/` 同步到宝塔服务器。以后写新笔记只要 commit + push,剩下全自动。

## workflow 的骨架

```yaml
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm install
      - run: npm test
      - run: npm run build
      # 然后 scp 上传 + ssh 解压到服务器
```

核心思路:CI 环境里 build 出 `dist/`,打包成 tar,scp 到服务器临时目录,再 ssh 进去解压到站点目录。用 `appleboy/scp-action` 和 `appleboy/ssh-action` 两个现成 action,密码认证也能跑。

服务器地址、密码这些敏感信息存在 GitHub 仓库的 **Secrets** 里(加密,代码和日志里都看不到明文),workflow 通过 `${{ secrets.SSH_PASSWORD }}` 引用。

## 坑一:`npm ci` 报 lockfile 不同步

```text
npm error `npm ci` can only install packages when your package.json
and package-lock.json ... are in sync
npm error Missing: @emnapi/core from lock file
```

`npm ci` 要求 lockfile 和 package.json 严格一致。但 Astro 7 通过图像处理库 sharp 拉进了 `@emnapi` —— 这类带**原生二进制**的包是**平台特定**的,Windows、Linux 各有各的子包。我在 Windows 本地生成的 lockfile 只锁了 Windows 版本,Linux CI 上 `npm ci` 找不到 Linux 版本就报 "Missing"。

`npm ci` 对这种跨平台差异零容忍。解法很干脆:**CI 里改用 `npm install`**。它会按当前平台自动补齐依赖,虽然牺牲了一点"依赖树 bit-for-bit 一致"的可复现性,但对部署场景无所谓 —— 我要的是"能装上、能 build"。

> 教训:带原生依赖的项目,跨平台 lockfile 天生脆弱,别在 CI 强求 `npm ci`。

## 坑二:Node 版本太低

```text
npm warn EBADENGINE required: { node: '>=22.12.0' }, current: { node: 'v20.20.2' }
```

Astro 7 要求 Node 22+,workflow 里我一开始写死了 Node 20。虽然只是警告没直接失败,但既然要求 22+ 就该用 22,顺便在 `package.json` 加了 `engines` 字段声明最低版本,以后任何环境版本不够会提前提示。

## 坑三:时区漂移(唯一的真 bug)

```text
AssertionError: expected 1700028800 to be 1700000000
```

测试本地全过,CI 上挂一个。差值 `1700028800 - 1700000000 = 28800` 秒,正好 8 小时 —— 时区。

失败的是 `dateToTimestamp('2023-11-15 06:13:20')`。原来用 `new Date('YYYY-MM-DD HH:mm:ss')` 解析,这种**带空格**的格式,Node 在不同时区下解释不同:

- 本地(东八区):当成东八区时间 → `1700000000` ✓
- CI(Ubuntu,默认 UTC):当成 UTC → `1700028800` ✗

这其实不是测试的问题,是**函数本身的 bug** —— 用户在东八区输入"06:13:20",不该随服务器时区漂移。修法:显式按东八区解析(把输入当 UTC,再减 8 小时偏移算回真实 UTC 毫秒),和反方向的 `timestampToDate` 逻辑对称。

> 教训:任何解析"本地日期字符串"的代码,都不能依赖 `new Date(str)` 的隐式时区。显式声明你按哪个时区解释,跨环境才稳。

## 配通之后

现在写新笔记就是:

```bash
# 往 src/content/notes/ 加一个 .md
git add .
git commit -m "新笔记"
git push
```

push 后一两分钟,GitHub Actions 跑完,服务器上的站点就更新了。本地不装任何东西,任何机器上 push 都一样。

这篇笔记本身就是在验证这条闭环 —— 如果你能在站点上读到它,说明自动化跑通了。
