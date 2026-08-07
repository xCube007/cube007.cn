# ADR 0001 — 写作后台靠覆盖未文档化的 CSS 变量来配色,并锁死 Sveltia 版本

- 日期: 2026-08-07
- 状态: 已采纳

## 背景

`/admin/` 是 Sveltia CMS,从 CDN 加载,仓库里只有一份 `config.yml` 和一个
十几行的 HTML 壳子。它默认长这样:

- 登录页顶着 "Sveltia CMS" 的名字(没设 `app_title`)
- 底色 `hsl(210 10% 10%)`,站点是 `#07080c`
- 按钮 `hsl(210 100% 40%)` 的通用蓝,站点是 `#6d8bff → #b06dff → #5ff0e0` 的流光
- 字体 Source Sans 3,站点是 Inter

想让它看起来是自己的东西,只有这么几条路:

1. `app_title` / `logo` / `registerPreviewStyle` —— 官方文档明确支持
2. 覆盖 `--sui-*` CSS 变量 —— 能用,但**没有任何文档**
3. 改 Sveltia 组件的 class —— class 名带编译期 hash
4. 不用 Sveltia,自己写后台

第 2 条的风险是具体的。维护者在
[sveltia-cms#29](https://github.com/sveltia/sveltia-cms/issues/29) 里说过这些变量
"may probably change without notice",而且**已经整体改过一次名**
(`--tertiary-background-color` → `--sui-tertiary-background-color`)。主题化在官方
路线图的 "TBD" 一档,追踪 issue 从 2023 年开到现在没动静,零点赞;官方还计划
在某个时点把 UI 框架从 Svelte 换掉。Sveltia 本身也还没到 1.0,一周发好几个版本,
文档写明 minor 版本里就可能有破坏性改动。

## 决定

**第 1 条做满,再加一层薄薄的第 2 条,同时把 CDN 版本锁死。**

- `config.yml` 补上 `app_title` 和 `logo.src`
- `index.html` 里只覆盖颜色、字体、圆角这类纯外观变量,不碰任何组件 class
- CDN 从 `@sveltia/cms` 改成 `@sveltia/cms@0.181.1`,并带上 `integrity` 子资源完整性
  校验 —— 锁了版本才有固定哈希可锁,两者是一对
- 预览面板走官方的 `registerPreviewStyle`,喂站点自己的 `prose.css`
- 判断"登录页 / 后台内页"用 ARIA role,不用 class 名

配套地,把设计 token 和正文排版从 `global.css`、`[id].astro` 里抽成
`src/styles/tokens.css` 和 `src/styles/prose.css`,构建前由
`scripts/sync-admin-theme.mjs` 生成到 `public/admin/`。前台走 Astro 打包(文件名
带 hash),后台是原样复制的静态目录,两边够不着同一个文件,只能这样共享。

## 理由

**为什么不止步于官方支持的部分。** 那样解决不了主要抱怨 —— 后台整体还是通用
蓝灰,和站点不是一路人。

**为什么不做得更深。** 组件级定制要依赖带 hash 的 class 名,而官方已经预告要换
UI 框架,那等于给自己安排了长期的返工。

**为什么不自己写后台。** 现在这套 OAuth 代理 + GitHub 提交是通的,为了配色重写
一个编辑器、图片上传、冲突处理,不划算。

**为什么锁版本。** 主题依赖的变量名随时可能变。不锁的话,某天推送一篇笔记,顺手
发现后台配色变回默认了,却不知道是哪次升级干的。锁死之后,升级变成一个主动的、
能验证的动作。代价是要自己盯更新 —— 这里接受,因为是单人站,写权限还卡在 GitHub
仓库权限和 OAuth 白名单两道门后面,暴露面很小。

**为什么顺手加 SRI。** 这段脚本跑起来握着管理员的 GitHub 写权限,CDN 被投毒等于
仓库被投毒。不锁版本时没法上 SRI(哈希每次都变),锁了就顺理成章。

**失败模式是温和的。** 万一变量名变了,后台会退回 Sveltia 默认配色 —— 难看,但
功能完好,不会写不了文章。这是选第 2 条而不是第 3 条的关键原因。

## 后果

- 升级 Sveltia 变成手动动作:改 `index.html` 里的版本号**和 `integrity` 哈希**,
  然后人工看一眼配色。只改版本号不改哈希的话,浏览器会直接拒绝执行脚本,后台变
  成"加载失败"。升级前扫一眼
  [releases](https://github.com/sveltia/sveltia-cms/releases)。
- 长期挂在一个可能过时的版本上,得定期主动升。
- 后台设置里切到 Light 主题时不套站点配色,保持 Sveltia 原生浅色 —— 半套暗色
  token 会比不套更难看。
- 正文排版从 `[id].astro` 的 scoped `<style>` 搬进全局 `prose.css`,失去了 Astro
  的作用域隔离。`.note__body` 这个前缀够独特,判断可接受。
- `prose.css` 里的选择器必须是 `.note__body` 开头(后代/子代/兄弟都行)。写成
  `article .note__body p` 这种改写不了的形式,构建会直接报错 —— 因为那条规则在预览
  面板里根本匹配不到东西,静默失效比构建失败难查得多。
- `public/admin/{tokens,preview}.css` 是生成物,已 gitignore。忘了跑脚本时
  `predev` / `prebuild` 会兜住;直接开 `public/admin/index.html` 则会缺样式。

## 之后如果要改

Sveltia 真做出主题 API(路线图 "TBD" 那一档)的话,把 `index.html` 里那段
`--sui-*` 覆盖换成官方 API,然后就可以不锁版本了。
