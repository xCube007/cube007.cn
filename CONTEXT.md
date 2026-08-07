# CONTEXT — cube007.cn 个人网站

> 本文件是项目的唯一事实来源。访谈结论、架构决策、范围都在这里。
> 实现细节变了一律回这里改,不要散落在代码注释里。

## 一句话

Cube007 的个人网站:博客(编程/后端/AI 学习笔记)+ 开发小工具,纯静态,Astro 驱动,暗色流光科技感。

## 已定决策(来自访谈)

| 维度 | 决定 | 原因 |
|---|---|---|
| 技术栈 | Astro,纯静态 SSG,零后端 | Git 即 CMS,免费托管,写作体验最好,工具全是纯前端计算类不需要服务端 |
| 内容组织 | 统一时间流 + 标签 | 三个主题(编程/后端/AI)用标签区分,不设硬分区,写什么放什么 |
| 博客/工具关系 | 并列两个顶级区(`/notes` 与 `/tools`) | 各自独立,互不耦合 |
| 视觉 | 暗色主题,简约流光科技感,流光仅作点缀 | 个性鲜明但不抢内容注意力 |
| 首发工具 | JSON 格式化/压缩/校验、Base64 编解码、时间戳转换、UUID/密码生成 | 高频、低风险、能验证工具架构跑通 |
| 文本对比 | 左/右并排、行级+行内(按字符)、实时、输入框内高亮、同步滚动、行号、自动换行；严格逐字但统一换行；无新旧语义(两色区分左右)；工具栏仅清空两侧+交换；相同行不折叠；窄屏仍并排；用 `diff` 类小库 | 比的是并列材料(接口数据/AI 输出),不是旧→新；先打通最小可用 |
| 托管 | 宝塔 + Nginx + GitHub Actions 自动部署 | 已有 VPS,push main 后 CI 构建并 scp 到 `/www/wwwroot/cube007.cn` |
| 在线写作 | Sveltia CMS(`/admin/`) + GitHub OAuth 代理 | 管理员 GitHub 登录后在网页写 Markdown,commit 到仓库再由 Actions 部署;前台仍静态 |
| 后台外观 | 覆盖 Sveltia 的 CSS 变量套上站点配色,不改它的组件 | 变量是未文档化内部实现,只覆盖颜色/字体这层,坏了也只是退回默认配色 |
| 后台入口 | 页脚一个和正文同色的「写作」链接 | `/admin` 本来就 noindex + robots 禁抓,真正的防线是 OAuth 白名单,所以不做暗号;同色不抢眼,但键盘和读屏都能到 |

## 领域语言

- **笔记 (Note)**:一篇 Markdown 学习笔记。有标题、日期、标签、正文。是时间流的基本单元。
- **标签 (Tag)**:笔记的主题分类词。编程/后端/AI 是种子标签,但不限于此。一个笔记可有多个标签。
- **工具 (Tool)**:一个纯前端、自包含的交互小工具。有名称、描述、一个交互界面。无状态(或仅用 localStorage)。
- **文本对比 (Text Diff)**:一种工具。左右两栏粘贴并列文本(接口数据、AI 输出、代码等),按行对齐并在改动行内标出字符级差异;实时计算,差异直接画在输入框内。无新旧语义,只区分左侧/右侧。
- **时间流 (Feed)**:首页按日期倒序列出的笔记流。

## 架构

```
src/
  content/
    notes/          # *.md 笔记,frontmatter: title/date/tags/draft
    config.ts       # Astro content collection schema
  pages/
    index.astro         # 时间流首页
    notes/
      [id].astro        # 单篇笔记
    tools/
      index.astro       # 工具索引页
      json-formatter/   # 各工具一个目录,内含 index.astro + 组件
      base64/
      timestamp/
      uuid/
      text-diff/
  components/
    layout/         # 全站布局、Header、Footer
    notes/          # 笔记列表卡片、标签云
    tools/          # 工具卡片、共享 UI(输入框/复制按钮/结果区)
    ui/             # 流光装饰、按钮等通用件
  styles/
    tokens.css      # 设计 token(色板/字号/间距/流光动画),前台与写作后台共用
    prose.css       # 笔记正文排版,文章页与后台预览面板共用
    global.css      # 全局重置、基础排版、工具类
  lib/
    tools/
      registry.ts   # 工具清单唯一定义点,工具页与首页都从这里渲染
      ...           # 各工具的纯函数逻辑(JSON 校验、Base64 等),可单测
```

**关键约束**
- **逻辑与界面分离**:每个工具的计算逻辑放进 `src/lib/tools/` 的纯函数,`.astro` 只管调函数和渲染。这样逻辑能单测,UI 改了逻辑不挂。
- **零运行时后端**:所有计算在浏览器完成。绝不出现 API key、绝不出现服务端调用。
- **笔记即文件**:笔记只来自 `src/content/notes/*.md`,没有数据库。
- **设计 token 单点定义**:颜色/流光动画/间距只在 `tokens.css` 定义,组件只引用 token,不内联写死值。写作后台是第二个消费方,构建前由脚本从同一份生成,不另抄一套。
- **正文排版单点定义**:笔记正文样式只在 `prose.css` 定义,文章页与后台预览面板共用。
- **工具清单单点定义**:工具的 slug/名称/描述只在 `src/lib/tools/registry.ts` 登记,工具页和首页都从它渲染,页面里不再手写工具列表。`registry.test.ts` 会扫 `src/pages/tools/` 的目录做交叉校验,漏登记直接测试失败。
- **动效不空跑**:只在元素可见时才跑动画(比如流光描边挂在 `:hover` 上,不是常驻 `infinite`)。全站尊重 `prefers-reduced-motion`。

## 设计方向(暗色流光)

- 背景深色(近黑),两层:固定的极淡网格底纹(向下淡出)+ 顶部径向光晕,共同制造纵深。
- 主文字高对比浅色;次级信息用灰阶。
- 单一流光强调色,用于标题描边、卡片边框 hover、按钮 —— 不铺满。
- 流光效果:渐变描边 + 微动 keyframes,克制。
- 卡片 hover 时有跟随鼠标的光标高光,坐标由 `BaseLayout` 里一段脚本写进 `--mx/--my`,元素只需标 `data-spotlight`。触屏和降低动效偏好下不启用。
- 代码块语法高亮适配暗色。

## 非目标

- 不做访客登录/评论/数据库 CMS(写作走 Git,不是传统后台库)。
- 不做工具的服务端计算或密钥托管。
- 不做移动端深度定制(响应式即可)。

## 里程碑

- **M1 — 骨架可见**:Astro 起得来,暗色布局 + 流光点缀 + 时间流首页 + 一篇示例笔记 + 工具索引页(空)。本地能跑。
- **M2 — 一个工具打通**:JSON 格式化器完整可用(逻辑单测 + UI + 复制按钮),验证"逻辑/界面分离"模式跑通。
- **M3 — 工具铺满**:Base64、时间戳、UUID 三个工具,复用 M2 建立的模式。
- **M4 — 内容与打磨**:补几篇真实笔记、标签页、细节打磨。

## 部署

- 仓库: https://github.com/xCube007/cube007.cn (public)
- CI: `.github/workflows/deploy.yml`
  - push `main` → install → test → build → scp `dist.tar.gz` → ssh 解压到 `/www/wwwroot/cube007.cn`
- 需要的 GitHub Secrets: `SSH_HOST` / `SSH_USER` / `SSH_PORT` / `SSH_PASSWORD`
- 服务器 Nginx 注意:
  - `try_files $uri $uri/ $uri.html /index.html;`
  - `error_page 404 /404.html;`
- 域名 `cube007.cn` 指向服务器公网 IP,SSL 用宝塔 Let's Encrypt

## 在线写作后台

- 入口: `/admin/`(Sveltia CMS,静态托管),前台从页脚「写作」链接进入
- 配置: `public/admin/config.yml` → GitHub repo `xCube007/cube007.cn`
- OAuth 代理: `oauth-proxy/`(独立 Node 进程,不进静态 dist)—— 已上线,
  `https://oauth.cube007.cn/health` 可自查
  - 子域 `oauth.cube007.cn` 反代到 `127.0.0.1:8787`
  - 环境变量: `OAUTH_CLIENT_ID` / `OAUTH_CLIENT_SECRET` / `OAUTH_ALLOWED_USERS=xCube007`
- 发布路径: CMS Save → GitHub commit → Actions 构建部署
- 草稿: frontmatter `draft: true` 时生产构建排除
- 外观: 后台套站点配色,细节见 [ADR 0001](docs/adr/0001-sveltia-theming.md)
  - `public/admin/index.html` 覆盖 Sveltia 的 `--sui-*` 变量,CDN 版本锁死
  - `public/admin/{tokens,preview}.css` 由 `npm run sync:admin-theme` 生成,不进版本库

## 待定问题

- 是否从密码 SSH 切到密钥认证(更稳妥)。
