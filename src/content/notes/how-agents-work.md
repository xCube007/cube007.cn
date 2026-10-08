---
title: 'Agent 拆解：一个循环加一堆工具'
date: 2026-08-22
tags: ['AI', 'Agent']
description: '不用框架，用几十行代码写一个能读文件、跑命令的 Agent，看清工具调用循环的每一步，以及真正难的工程问题在哪。'
---

"Agent"这个词被用得很泛，但剥掉包装，它的核心定义可以很朴素：**一个大模型在循环里调用工具，直到它认为任务完成。** 这篇不用任何框架，自己搭一个最小的 Agent，看清楚它到底是怎么跑起来的。

## 模型本身不会"执行"任何东西

先澄清一个常见误解：模型不会真的去读你的文件、跑你的命令。它只会输出文本。

所谓"工具调用（tool calling / function calling）"是这样一个约定：

1. 你在请求里告诉模型有哪些工具，每个工具的名字、用途、参数格式（JSON Schema）
2. 模型觉得需要用工具时，不输出普通回答，而是输出一段结构化的"调用请求"：`{"name": "read_file", "arguments": {"path": "README.md"}}`
3. **你的程序**解析这段请求，真的去执行，把结果作为一条新消息塞回对话
4. 模型看到结果，决定下一步：再调工具，或者给出最终回答

模型负责决策，宿主程序负责执行。这个分工是理解一切 Agent 的钥匙。

## 定义工具

工具就是一段描述加一个函数。描述是写给模型看的，要像写给新同事的说明一样清楚：

```python
import subprocess

TOOLS = [
    {
        "name": "read_file",
        "description": "读取一个文本文件的内容。路径相对于项目根目录。",
        "parameters": {
            "type": "object",
            "properties": {"path": {"type": "string"}},
            "required": ["path"],
        },
    },
    {
        "name": "run",
        "description": "在项目根目录执行一条 shell 命令，返回 stdout 和 stderr。",
        "parameters": {
            "type": "object",
            "properties": {"cmd": {"type": "string"}},
            "required": ["cmd"],
        },
    },
]

def read_file(path):
    return open(path, encoding="utf-8").read()

def run(cmd):
    p = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=60)
    return p.stdout + p.stderr

HANDLERS = {"read_file": read_file, "run": run}
```

## 核心循环

下面的 `llm.chat` 代表任意一家支持工具调用的 API，各家字段名略有差异，结构是一样的：

```python
def agent(task, max_steps=20):
    messages = [
        {"role": "system", "content": "你是一个编程助手。先调查，再动手，完成后简要汇报。"},
        {"role": "user", "content": task},
    ]
    for _ in range(max_steps):
        reply = llm.chat(messages, tools=TOOLS)
        messages.append(reply)

        if not reply.tool_calls:          # 没有要调用的工具 = 任务结束
            return reply.content

        for call in reply.tool_calls:
            try:
                result = HANDLERS[call.name](**call.arguments)
            except Exception as e:
                result = f"工具执行失败：{e}"   # 错误也是观察结果，交给模型处理
            messages.append({
                "role": "tool",
                "tool_call_id": call.id,
                "content": result[:10_000],    # 截断，防止撑爆上下文
            })
    return "达到最大步数，任务未完成"
```

就这些。给它一个任务"跑一下测试，看看哪里挂了"，它会自己决定先 `run("npm test")`，看到报错后 `read_file` 对应文件，再总结原因。每一步做什么，没有一行是写死的。

这个"思考 → 行动 → 观察"的循环有个名字叫 **ReAct**（Reasoning + Acting），几乎所有编程 Agent 骨子里都是它。

## 真正难的地方不在循环

循环本身十几行，难的是让它在真实任务里**靠谱**。自己写过一遍之后，这几个问题最实在：

**上下文会爆。** 每次工具调用的结果都会留在 `messages` 里。读几个大文件、跑几次输出很长的命令，上下文就满了，而且越长模型越容易"走神"。常见做法是截断工具输出、让工具支持按行范围读取、对旧的历史做摘要。

**工具设计比 prompt 更重要。** 与其在系统提示词里写"注意不要读太大的文件"，不如让 `read_file` 直接支持 `offset` 和 `limit` 参数。工具的名字、描述、参数和返回的错误信息，都是模型的"界面"。一条清楚的报错（"文件不存在，你是不是想找 src/index.ts？"）能省掉好几轮瞎试。

**错误要喂回去，而不是抛出去。** 上面的代码里，工具出错不会让程序崩溃，而是把错误信息当作观察结果交给模型。模型看到"命令不存在"，往往会自己换个办法。

**必须有刹车。** `max_steps` 防止它原地打转；危险操作（删文件、`git push`、发请求）要让人确认；`run` 这种工具最好跑在沙箱或容器里。模型会犯错，而 Agent 会把一次犯错放大成一串真实的操作。

**它不知道自己做没做对。** Agent 最常见的失败不是报错，而是"自信地宣布完成，其实没完成"。给它验证手段 —— 能跑的测试、能看的截图、能查的日志 —— 比任何"请仔细检查"的提示词都有效。

## 框架帮你做了什么

LangGraph、各家 Agent SDK 这些框架，做的基本就是把上面这些工程问题封装起来：上下文管理、工具注册、并行调用、人工确认、状态持久化、链路追踪。

我的建议是**先手写一遍最小循环**。写完再用框架，就知道它每个配置项在解决什么问题，出了问题也知道往哪里查。

> 一句话：Agent = 模型做决策 + 程序做执行 + 一个循环。循环很简单，难的是工具设计、上下文管理和让它知道自己是否完成。
