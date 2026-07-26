---
title: 'Git 里的 rebase 与 merge,到底用哪个'
date: 2026-07-26
tags: ['编程', 'Git']
description: '合并分支时 rebase 和 merge 的本质区别,以及我什么时候用哪个。'
---

每个用 Git 的人迟早都会撞到这个问题。两个命令都能"把另一条分支的内容并进来",但它们留下的历史形状完全不同。

## merge:保留全部历史

```bash
git checkout main
git merge feature
```

merge 会创建一个新的**合并提交**(merge commit),它有两个父提交。历史是一条真实的、有分叉的时间线 —— 你能看出"这几条分支同时存在过,然后在这里汇合了"。

**优点**:历史是客观记录,谁在什么时候从哪分叉、怎么并的,一清二楚。
**缺点**:如果一个项目长期很多分支来回合并,历史会变成一团乱麻。

## rebase:把提交"搬"到另一条线顶端

```bash
git checkout feature
git rebase main
```

rebase 会把 feature 上的每一个提交,逐个"摘下来",重新应用到 main 的最新位置之后。结果是一条**直线**历史,就像 feature 从来都是从最新的 main 分出来的一样。

**优点**:历史干净、线性、好读。
**缺点**:它**重写了历史**。被 rebase 的提交的 commit hash 全变了。

## 我的选择

- **个人分支、还没 push 的提交**:用 rebase,保持线性好读。
- **已经 push 给别人、或公共分支**:用 merge,绝不重写共享历史。

> 一句话记住:rebase 改写你自己的历史,merge 记录所有人的历史。公共的东西别改。

## 那个容易踩的坑

rebase 已经推送过的分支,再 push 会被拒绝,因为 hash 对不上。这时如果用 `git push --force` 强推,就会覆盖远程 —— 任何基于旧版本的人下次拉取都会炸。公共分支永远用 `--force-with-lease`,它会在远程被别人动过时拒绝推送,比 `--force` 安全得多。
