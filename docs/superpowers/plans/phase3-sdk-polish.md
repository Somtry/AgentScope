# Phase 3：SDK + 打磨 详细计划

> **目标：** 提供 Python SDK 让用户 5 分钟接入，完善整体体验。
> **预计时间：** 2-3 小时
> **前置条件：** Phase 2 完成
> **完成后状态：** `pip install agent-scope` 后跑 demo 能看到 trace，OpenAI 包装能自动记录 API 调用

---

## 文件结构（本阶段产出）

```
sdk/
├── pyproject.toml
├── agent_scope/
│   ├── __init__.py
│   ├── client.py          # TracerClient
│   ├── decorators.py      # @trace 装饰器
│   └── openai_wrapper.py  # OpenAI SDK 包装

examples/
├── demo_tracer.py         # 装饰器接入 demo
├── demo_openai.py         # OpenAI 包装 demo
└── sample_cases.json      # 评测用例（Phase 2 已有）

frontend/src/              # 体验打磨（修改已有文件）
├── hooks/useKeyboard.ts   # 键盘快捷键
└── components/            # 各组件微调
```

---

## Task 1：SDK 包结构

### Step 1.1：创建 SDK pyproject.toml

`sdk/pyproject.toml`：

```toml
[project]
name = "agent-scope"
version = "0.1.0"
description = "AgentScope Python SDK - 本地优先的 Agent DevTools"
requires-python = ">=3.11"
dependencies = [
    "httpx>=0.27.0",
]

[project.optional-dependencies]
openai = ["openai>=1.0.0"]
```

### Step 1.2：创建包入口

`sdk/agent_scope/__init__.py`：

```python
from .client import TracerClient
from .decorators import trace

__all__ = ["TracerClient", "trace"]
__version__ = "0.1.0"
```

---

## Task 2：TracerClient

### Step 2.1：实现 HTTP 客户端

`sdk/agent_scope/client.py`：

```python
import uuid
import time
import json
from datetime import datetime
from typing import Any
import httpx

class TracerClient:
    """AgentScope 追踪客户端"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url.rstrip("/")
        self._http = httpx.Client(timeout=10.0)

    def _url(self, path: str) -> str:
        return f"{self.base_url}/api/v1{path}"

    def start_trace(self, agent_id: str, session_id: str | None = None, metadata: dict | None = None) -> "ActiveTrace":
        """创建并返回一个活跃的 trace"""
        resp = self._http.post(self._url("/traces"), json={
            "agent_id": agent_id,
            "session_id": session_id,
            "metadata": metadata,
        })
        resp.raise_for_status()
        data = resp.json()
        return ActiveTrace(self, data["id"])

class ActiveTrace:
    """活跃的 trace，支持添加步骤和完成"""

    def __init__(self, client: TracerClient, trace_id: str):
        self.client = client
        self.id = trace_id
        self._buffer: list[dict] = []
        self._flush_threshold = 10  # 攒 10 条自动刷

    def add_step(self, type: str, content: str | None = None, **kwargs) -> None:
        """添加一个步骤到缓冲区"""
        step = {"type": type, "content": content}
        step.update(kwargs)
        self._buffer.append(step)

        if len(self._buffer) >= self._flush_threshold:
            self.flush()

    def flush(self) -> None:
        """批量提交缓冲区中的步骤"""
        if not self._buffer:
            return
        resp = self.client._http.post(
            self.client._url(f"/traces/{self.id}/steps"),
            json={"steps": self._buffer},
        )
        resp.raise_for_status()
        self._buffer.clear()

    def complete(self) -> None:
        """完成 trace（先刷缓冲区）"""
        self.flush()
        resp = self.client._http.post(
            self.client._url(f"/traces/{self.id}/complete"),
        )
        resp.raise_for_status()
```

---

## Task 3：@trace 装饰器

### Step 3.1：实现装饰器

`sdk/agent_scope/decorators.py`：

```python
import functools
import time
import traceback
from typing import Callable, Any

def trace(agent_id: str | None = None, client=None):
    """装饰器：自动追踪函数执行过程

    用法：
        @trace(agent_id="my_agent")
        def run(input_text):
            return "output"

        # 或异步版本
        @trace(agent_id="my_agent")
        async def run(input_text):
            return "output"
    """
    def decorator(func: Callable) -> Callable:
        _agent_id = agent_id or func.__name__

        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            from . import TracerClient
            _client = client or TracerClient()

            active = _client.start_trace(_agent_id)
            active.add_step("input", content=str(args[0]) if args else str(kwargs))

            start = time.time()
            try:
                result = func(*args, **kwargs)
                elapsed = int((time.time() - start) * 1000)
                active.add_step("output", content=str(result), duration_ms=elapsed)
                active.complete()
                return result
            except Exception as e:
                elapsed = int((time.time() - start) * 1000)
                active.add_step("error", content=f"{type(e).__name__}: {e}", duration_ms=elapsed)
                active.complete()
                raise

        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            from . import TracerClient
            _client = client or TracerClient()

            active = _client.start_trace(_agent_id)
            active.add_step("input", content=str(args[0]) if args else str(kwargs))

            start = time.time()
            try:
                result = await func(*args, **kwargs)
                elapsed = int((time.time() - start) * 1000)
                active.add_step("output", content=str(result), duration_ms=elapsed)
                active.complete()
                return result
            except Exception as e:
                elapsed = int((time.time() - start) * 1000)
                active.add_step("error", content=f"{type(e).__name__}: {e}", duration_ms=elapsed)
                active.complete()
                raise

        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator
```

---

## Task 4：OpenAI SDK 包装

### Step 4.1：实现 TracedOpenAI

`sdk/agent_scope/openai_wrapper.py`：

```python
import time
from typing import Any
from .client import TracerClient

class TracedCompletions:
    """包装 chat.completions，自动记录每次调用"""

    def __init__(self, original_completions, active_trace):
        self._original = original_completions
        self._trace = active_trace

    def create(self, **kwargs):
        messages = kwargs.get("messages", [])
        model = kwargs.get("model", "unknown")

        # 记录输入
        input_text = str(messages[-1].get("content", "")) if messages else ""
        self._trace.add_step("input", content=input_text, model=model)

        start = time.time()
        try:
            response = self._original.create(**kwargs)
            elapsed = int((time.time() - start) * 1000)

            # 记录输出
            output = response.choices[0].message.content if response.choices else ""
            tokens = response.usage.total_tokens if response.usage else None

            self._trace.add_step(
                "output",
                content=output,
                duration_ms=elapsed,
                token_count=tokens,
                model=model,
            )
            return response
        except Exception as e:
            elapsed = int((time.time() - start) * 1000)
            self._trace.add_step("error", content=str(e), duration_ms=elapsed)
            raise

class TracedChat:
    def __init__(self, original_chat, active_trace):
        self.completions = TracedCompletions(original_chat.completions, active_trace)

class TracedOpenAI:
    """OpenAI SDK 包装，换一行 import 即可自动追踪

    用法：
        from agent_scope.openai import TracedOpenAI as OpenAI
        client = OpenAI(api_key="sk-xxx")
        # 其余代码不变
    """

    def __init__(self, base_url: str = "http://localhost:8000", **kwargs):
        from openai import OpenAI as RealOpenAI
        self._real = RealOpenAI(**kwargs)
        self._client = TracerClient(base_url)
        self._active_trace = self._client.start_trace("openai_agent")

    @property
    def chat(self):
        return TracedChat(self._real.chat, self._active_trace)

    def complete_trace(self):
        """手动完成 trace（或在程序结束时调用）"""
        self._active_trace.complete()
```

---

## Task 5：演示用例

### Step 5.1：装饰器 Demo

`examples/demo_tracer.py`：改造 Phase 1 的 demo，使用 SDK 装饰器方式。

### Step 5.2：OpenAI Demo

`examples/demo_openai.py`：

```python
from agent_scope.openai import TracedOpenAI as OpenAI

client = OpenAI(api_key="sk-xxx", base_url="http://localhost:8000")
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "你好，介绍一下自己"}],
)
print(response.choices[0].message.content)
client.complete_trace()
```

---

## Task 6：前端体验打磨

### Step 6.1：键盘快捷键

`frontend/src/hooks/useKeyboard.ts`：

```typescript
import { useEffect } from "react";

export function useKeyboard(handlers: Record<string, () => void>) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // j/k 上下导航步骤
      // Enter 展开详情
      // Escape 关闭面板
      const key = e.key;
      if (handlers[key]) {
        e.preventDefault();
        handlers[key]();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlers]);
}
```

### Step 6.2：空状态页面

各页面添加空状态展示：
- TracerPage：无 trace 时显示"暂无追踪数据，运行 demo_tracer.py 试试"
- EvaluatorPage：无用例时显示"暂无评测用例，点击 + 创建"

### Step 6.3：错误状态处理

- 网络断开时显示顶部黄色提示条
- API 请求失败时 toast 提示

### Step 6.4：暗色主题统一

检查所有组件的颜色是否使用 CSS 变量，确保暗色主题一致。

---

## Task 7：最终验证

### Step 7.1：端到端测试

```bash
# 1. 启动后端
cd backend && uv run uvicorn app.main:app --reload

# 2. 启动前端
cd frontend && npm run dev

# 3. 跑装饰器 demo
cd examples && uv run python demo_tracer.py

# 4. 打开 http://localhost:5173/tracer
# 预期：看到 demo trace 时间线

# 5. 打开 http://localhost:5173/evaluator
# 预期：能创建用例、运行评测
```

### Step 7.2：提交

```bash
git add .
git commit -m "feat: SDK + 体验打磨完成 - AgentScope MVP 可用"
```

---

## 全部完成后的状态

- 后端：Trace/Step CRUD + Evaluator + Arena 完整 API
- 前端：Dashboard + Tracer（含回放）+ Evaluator（含雷达图 + 对比）
- SDK：TracerClient + @trace 装饰器 + OpenAI 包装
- Demo：两个可运行的演示脚本
