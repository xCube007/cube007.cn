---
title: 'JetBrains ThinkRail 调研：把 Agent 开发装进 IDE，而不只是加个聊天框'
date: 2026-10-27
tags: ['AI', 'Agent', '开发工具']
description: 'ThinkRail 是 JetBrains 开源的 Agent IDE：以 pi 为引擎，用 worktree 隔离任务，以 Specs 保存项目知识。本文梳理它的工作流、架构与现阶段的适用边界。'
draft: false
---

2026 年 8 月，JetBrains 公开介绍了一个新的 Agent IDE：**ThinkRail**。它不是在现有 IDE 里再放一个 AI 聊天侧栏，而是把「并行任务、代码审查、项目知识」放到了产品中心。

这篇是基于官方仓库与产品文档的桌面调研，不是深度实测。资料截至 **2026-10-27**；项目仍在快速迭代，具体能力以最新文档为准。

## ThinkRail 是什么

按官方定义，ThinkRail 是一个围绕 [`pi`](https://www.npmjs.com/package/@earendil-works/pi-coding-agent) 编码 Agent 构建的 IDE，采用 Apache License 2.0 开源。它既有原生桌面应用，也有在浏览器里打开同一套界面的 `thinkrail` CLI，支持 macOS、Windows 和 Linux。

它目前想解决三个很具体的问题：

1. 多个 Agent 共用工作目录时互相干扰，也可能碰到开发者自己的未提交修改。
2. 终端适合对话，却不适合连续查看 diff、定位文件并逐行反馈。
3. 聊天一结束，讨论过的约束和决策就容易丢失，下个会话只能重新交代。

所以，ThinkRail 的重点不是再造一个模型或 Agent 引擎，而是把 Agent 周围的工作流补齐。

## 最值得关注的三个设计

### 1. 默认用 worktree 隔离任务

打开一个 Git 仓库后，可以为每项任务创建独立 workspace。每个 workspace 对应一个 `git worktree`，有独立分支和工作目录；多个 Agent 因而能并行工作，而不必一起修改当前 checkout。完成后保留好的分支、合并改动，再清理其余 workspace。

在这个基础上，ThinkRail 提供 Monaco 编辑器、文件树、变更视图、终端和 diff 评论。评论可以作为结构化上下文送回对话，形成「生成 → 审查 → 反馈 → 修改」的闭环；也能调用本机 `gh` 发布分支、创建 PR、查看 GitHub CI 状态。

但要注意：**worktree 是工作区隔离，不是安全沙箱**。它能减少文件冲突，不能天然阻止 Agent 执行危险命令、访问目录外的数据或操作凭据。项目信任、MCP 工具和命令权限仍需单独控制。

### 2. 用 Specs 保存跨会话的项目知识

ThinkRail 把相互关联的 `SPEC.md` 放在代码旁边，Agent 通过专用工具读取、搜索和维护这些规格，界面则把它们渲染成规格树。官方把这一设计称为 **Specs as ground truth**。

与普通聊天记录相比，它试图把「为什么这样做」变成可持续维护的项目资产。例如，一次会话确定了鉴权边界或目录约定，后续任务应该读到同一份决策，而不是重新猜测。

代价也在这里：规格不是写完一次就永久正确。代码演进时，如果规格没有同步维护，它同样会过时，甚至误导 Agent。Specs 能否产生价值，取决于团队是否愿意把「更新决策」纳入开发流程。

### 3. 保持 pi 是唯一的 Agent 引擎

架构上，ThinkRail 是一个薄宿主：在进程内运行 `pi`，再通过有类型、带版本的协议连接 Web UI。官方文档明确把「第二个 Agent runtime」列为非目标。

大致分工是：

- `pi`：模型、系统提示、Skills、扩展、上下文压缩、成本与会话状态。
- ThinkRail：workspace、编辑器、终端、审查界面，以及与 UI 的通信。

这意味着它更像是 **pi 的完整工作台**，而不是 JetBrains 全部 Agent 能力的总入口。现有 `pi` 配置和可移植 Agent Skills 可以继续使用；但依赖 Claude Code 等特定引擎能力的人，不能默认它们能在 ThinkRail 里原样运行。官方产品文档当前也明确：不引入 `claude-agent-sdk`。

## 它不是 JetBrains Air，也不等于 IntelliJ 的 AI 插件

JetBrains 同时有 [JetBrains Air](https://blog.jetbrains.com/zh-hans/blog/2026/09/23/introducing-jetbrains-air/) 等 Agent 产品线，名称很容易混在一起。就 ThinkRail 当前官方资料来看，它应被单独理解为：**开源、以 pi 为引擎、以独立 workspace 和 Specs 为核心工作流的 Agent IDE**。

它也不只是「带 AI 的传统 IDE」。传统 IDE 以文件和项目为主要组织单位；ThinkRail 更强调以任务 workspace 组织 Agent 工作，再把对话、变更、规格和交付串起来。需要大型重构、调试器或成熟语言支持时，仍可以把 worktree 打开到已安装的 IDE，而不是强迫自己只用一个窗口。

## 上手门槛与现阶段边界

ThinkRail 提供桌面安装包和 CLI。CLI 依赖 Git，并需要模型供应商：可以登录 JetBrains AI，也可以通过 `pi` 配置其他供应商凭据；ThinkRail 本身没有独立账号体系。界面已内置简体中文，但 Agent 回复和工具输出不会被界面翻译功能自动翻译。

截至本文调研时，GitHub Releases 的最新稳定版是 **v0.2.0（2026-10-18 发布）**，另有更新的 nightly 预发布版；仓库也标注为 JetBrains incubator 项目。因此，我不会把它描述成已经完全成熟的 IntelliJ 替代品。早期版本、快速变化的界面和工作流，都意味着试用前应保留可回退路径。

另外，官方 README 说明会收集与随机安装 ID 关联的基本使用事件，并始终发送不包含项目内容的错误报告；额外的产品使用数据由隐私开关控制。用于企业项目之前，应该按实际版本检查隐私设置、组织的数据合规要求，以及所选模型供应商的数据路径。不要仅凭「开源」就推断所有处理都在本地完成。

## 我的判断

ThinkRail 最有价值的地方，不是「Agent 也能写代码」，而是它承认真正难的是 **让多项 Agent 工作可隔离、可审查、可延续**。worktree 解决并行边界，diff review 解决人类验收，Specs 尝试解决上下文寿命，这三件事比单纯换一张聊天界面更接近工程现场。

它比较适合已经在真实 Git 项目中使用 `pi`、希望并行跑任务并保留图形化审查流程的开发者。若你主要需要成熟语言 IDE 的完整能力、深度依赖另一套 Agent 引擎，或者暂时无法接受早期产品的变化，就先观望或只在试验仓库使用。

下一步最值得实测的不是让 Agent 写一段演示代码，而是拿一个真实小任务走完：**创建 workspace → 建立规格 → 修改与测试 → 逐行审查 → 提交 PR**。这条链路是否顺手，才决定 ThinkRail 是一个新奇的界面，还是一套能留下来的开发方式。

## 参考资料

- [Introducing ThinkRail](https://thinkrail.ai/blog/introducing-thinkrail/)（2026-08-19）：官方首次介绍。
- [JetBrains/thinkrail 官方仓库与 README](https://github.com/JetBrains/thinkrail)：功能、安装、隐私与技术架构。
- [ThinkRail 产品目标与范围](https://github.com/JetBrains/thinkrail/blob/main/goal-and-requirements.md)：目标用户、设计原则及非目标。
- [ThinkRail Releases](https://github.com/JetBrains/thinkrail/releases)：安装包与版本记录。
