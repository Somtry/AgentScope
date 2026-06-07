# Phase 1：Tracer 核心 详细计划

> **目标：** 后端能接收和存储 trace 数据，前端能展示时间线，支持内嵌回放。
> **预计时间：** 3-4 小时
> **前置条件：** Phase 0 完成
> **完成后状态：** 运行 demo agent 后，前端能看到完整执行时间线，支持自动回放

---

## 文件结构（本阶段产出）

```
backend/
├── app/
│   ├── models/
│   │   ├── __init__.py
│   │   ├── trace.py
│   │   └── step.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── trace.py
│   └── api/
│       └── traces.py          # Trace API 路由
└── tests/
    └── test_traces.py

frontend/
└── src/
    ├── api/
    │   └── traces.ts          # Trace API 封装
    ├── stores/
    │   └── traceStore.ts      # Zustand 状态
    ├── components/
    │   └── tracer/
    │       ├── TraceList.tsx   # 左侧列表
    │       ├── Timeline.tsx    # 时间线（核心）
    │       ├── StepNode.tsx    # 步骤节点
    │       └── StepDetail.tsx  # 底部详情面板
    └── pages/
        └── TracerPage.tsx      # 主页面（改造）

examples/
└── demo_tracer.py             # 演示 agent
```

---

## Task 1：后端数据模型

### Step 1.1：创建 Trace ORM 模型

`backend/app/models/trace.py`：

```python
import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.database import Base

class Trace(Base):
    __tablename__ = "traces"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id: Mapped[str] = mapped_column(String(100), index=True)
    session_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="running")
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    # 关联 steps
    steps = relationship("Step", back_populates="trace", order_by="Step.seq")
```

### Step 1.2：创建 Step ORM 模型

`backend/app/models/step.py`：

```python
import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, Integer, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.database import Base

class Step(Base):
    __tablename__ = "steps"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    trace_id: Mapped[str] = mapped_column(String(36), ForeignKey("traces.id"), index=True)
    type: Mapped[str] = mapped_column(String(20))  # input/thinking/tool_call/tool_result/output/error
    seq: Mapped[int] = mapped_column(Integer)  # 步骤序号，保证顺序
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    token_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tool_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tool_params: Mapped[str | None] = mapped_column(Text, nullable=True)
    tool_result: Mapped[str | None] = mapped_column(Text, nullable=True)

    trace = relationship("Trace", back_populates="steps")
```

### Step 1.3：注册模型到 __init__

`backend/app/models/__init__.py`：

```python
from .trace import Trace
from .step import Step

__all__ = ["Trace", "Step"]
```

### Step 1.4：在 main.py 中导入模型

在 `backend/app/main.py` 顶部添加：

```python
from .models import Trace, Step  # 确保模型被注册到 Base.metadata
```

### Step 1.5：验证建表

```bash
cd backend
uv run uvicorn app.main:app --reload
# 检查 agentscope.db 文件是否创建，traces 和 steps 表是否存在
```

---

## Task 2：后端 Pydantic Schema

### Step 2.1：创建请求/响应模型

`backend/app/schemas/trace.py`：

```python
from datetime import datetime
from pydantic import BaseModel

# === 请求模型 ===

class TraceCreate(BaseModel):
    agent_id: str
    session_id: str | None = None
    metadata: dict | None = None

class StepCreate(BaseModel):
    type: str  # input/thinking/tool_call/tool_result/output/error
    content: str | None = None
    duration_ms: int | None = None
    token_count: int | None = None
    model: str | None = None
    tool_name: str | None = None
    tool_params: dict | str | None = None
    tool_result: dict | str | None = None

class StepsBatchCreate(BaseModel):
    steps: list[StepCreate]

# === 响应模型 ===

class StepResponse(BaseModel):
    id: str
    type: str
    seq: int
    timestamp: datetime
    content: str | None
    duration_ms: int | None
    token_count: int | None
    model: str | None
    tool_name: str | None
    tool_params: str | None
    tool_result: str | None

    class Config:
        from_attributes = True

class TraceResponse(BaseModel):
    id: str
    agent_id: str
    session_id: str | None
    started_at: datetime
    ended_at: datetime | None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class TraceDetailResponse(TraceResponse):
    steps: list[StepResponse] = []
```

`backend/app/schemas/__init__.py`：

```python
from .trace import TraceCreate, StepCreate, StepsBatchCreate, TraceResponse, TraceDetailResponse
```

---

## Task 3：后端 API 路由

### Step 3.1：创建 Traces API

`backend/app/api/traces.py`：

```python
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from ..core.database import get_db
from ..models.trace import Trace
from ..models.step import Step
from ..schemas.trace import (
    TraceCreate, StepCreate, StepsBatchCreate,
    TraceResponse, TraceDetailResponse, StepResponse,
)

router = APIRouter()

@router.post("/traces", response_model=TraceResponse)
async def create_trace(data: TraceCreate, db: AsyncSession = Depends(get_db)):
    trace = Trace(
        agent_id=data.agent_id,
        session_id=data.session_id,
        metadata_json=json.dumps(data.metadata) if data.metadata else None,
    )
    db.add(trace)
    await db.commit()
    await db.refresh(trace)
    return trace

@router.get("/traces", response_model=list[TraceResponse])
async def list_traces(
    agent_id: str | None = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    query = select(Trace).order_by(Trace.created_at.desc()).limit(limit).offset(offset)
    if agent_id:
        query = query.where(Trace.agent_id == agent_id)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/traces/{trace_id}", response_model=TraceDetailResponse)
async def get_trace(trace_id: str, db: AsyncSession = Depends(get_db)):
    trace = await db.get(Trace, trace_id)
    if not trace:
        raise HTTPException(status_code=404, detail="Trace not found")
    return trace

@router.post("/traces/{trace_id}/steps", response_model=list[StepResponse])
async def add_steps(
    trace_id: str,
    data: StepsBatchCreate,
    db: AsyncSession = Depends(get_db),
):
    trace = await db.get(Trace, trace_id)
    if not trace:
        raise HTTPException(status_code=404, detail="Trace not found")

    # 获取当前最大 seq
    result = await db.execute(
        select(func.max(Step.seq)).where(Step.trace_id == trace_id)
    )
    max_seq = result.scalar() or 0

    steps = []
    for i, step_data in enumerate(data.steps):
        step = Step(
            trace_id=trace_id,
            type=step_data.type,
            seq=max_seq + i + 1,
            content=step_data.content,
            duration_ms=step_data.duration_ms,
            token_count=step_data.token_count,
            model=step_data.model,
            tool_name=step_data.tool_name,
            tool_params=json.dumps(step_data.tool_params) if isinstance(step_data.tool_params, dict) else step_data.tool_params,
            tool_result=json.dumps(step_data.tool_result) if isinstance(step_data.tool_result, dict) else step_data.tool_result,
        )
        db.add(step)
        steps.append(step)

    await db.commit()
    for s in steps:
        await db.refresh(s)
    return steps

@router.post("/traces/{trace_id}/complete", response_model=TraceResponse)
async def complete_trace(trace_id: str, db: AsyncSession = Depends(get_db)):
    trace = await db.get(Trace, trace_id)
    if not trace:
        raise HTTPException(status_code=404, detail="Trace not found")
    trace.status = "completed"
    trace.ended_at = datetime.utcnow()
    await db.commit()
    await db.refresh(trace)
    return trace
```

### Step 3.2：注册路由

修改 `backend/app/api/router.py`：

```python
from fastapi import APIRouter
from .traces import router as traces_router

router = APIRouter()
router.include_router(traces_router, prefix="/traces", tags=["traces"])
```

### Step 3.3：验证 API

```bash
# 创建 trace
curl -X POST http://localhost:8000/api/v1/traces   -H "Content-Type: application/json"   -d '{"agent_id": "test_agent"}'

# 添加步骤（用返回的 trace id）
curl -X POST http://localhost:8000/api/v1/traces/{id}/steps   -H "Content-Type: application/json"   -d '{"steps": [{"type": "input", "content": "你好"}, {"type": "output", "content": "你好！有什么可以帮你的？"}]}'

# 完成 trace
curl -X POST http://localhost:8000/api/v1/traces/{id}/complete

# 查询详情
curl http://localhost:8000/api/v1/traces/{id}
```

---

## Task 4：前端 Trace API + 状态管理

### Step 4.1：创建 Trace API 封装

`frontend/src/api/traces.ts`：

```typescript
import { api } from "./client";

export interface Step {
  id: string;
  type: string;
  seq: number;
  timestamp: string;
  content: string | null;
  duration_ms: number | null;
  token_count: number | null;
  model: string | null;
  tool_name: string | null;
  tool_params: string | null;
  tool_result: string | null;
}

export interface Trace {
  id: string;
  agent_id: string;
  session_id: string | null;
  started_at: string;
  ended_at: string | null;
  status: string;
  created_at: string;
  steps?: Step[];
}

export const traceApi = {
  list: (agentId?: string) => {
    const params = agentId ? `?agent_id=${agentId}` : "";
    return api.get<Trace[]>(`/traces${params}`);
  },
  get: (id: string) => api.get<Trace>(`/traces/${id}`),
  create: (agentId: string) =>
    api.post<Trace>("/traces", { agent_id: agentId }),
  addSteps: (traceId: string, steps: Partial<Step>[]) =>
    api.post<Step[]>(`/traces/${traceId}/steps`, { steps }),
  complete: (traceId: string) =>
    api.post<Trace>(`/traces/${traceId}/complete`, {}),
};
```

### Step 4.2：创建 Zustand Store

`frontend/src/stores/traceStore.ts`：

```typescript
import { create } from "zustand";
import { traceApi, Trace } from "../api/traces";

interface TraceState {
  traces: Trace[];
  selectedTrace: Trace | null;
  selectedStepIndex: number;
  isLoading: boolean;
  filterAgentId: string;

  fetchTraces: () => Promise<void>;
  selectTrace: (id: string) => Promise<void>;
  selectStep: (index: number) => void;
  setFilterAgentId: (id: string) => void;
}

export const useTraceStore = create<TraceState>((set, get) => ({
  traces: [],
  selectedTrace: null,
  selectedStepIndex: -1,
  isLoading: false,
  filterAgentId: "",

  fetchTraces: async () => {
    set({ isLoading: true });
    const traces = await traceApi.list(get().filterAgentId || undefined);
    set({ traces, isLoading: false });
  },

  selectTrace: async (id: string) => {
    set({ isLoading: true });
    const trace = await traceApi.get(id);
    set({ selectedTrace: trace, selectedStepIndex: -1, isLoading: false });
  },

  selectStep: (index: number) => set({ selectedStepIndex: index }),
  setFilterAgentId: (id: string) => set({ filterAgentId: id }),
}));
```

---

## Task 5：前端 Tracer 页面

### Step 5.1：TraceList 组件

`frontend/src/components/tracer/TraceList.tsx`：左侧列表，显示所有 trace，按 agent_id 分组，点击选中。每条显示 agent_id + 状态标签 + 时间 + 步骤数。

### Step 5.2：StepNode 组件

`frontend/src/components/tracer/StepNode.tsx`：单个步骤节点，纵向时间线上的一个点。

颜色编码：
- input = #3b82f6（蓝）
- thinking = #8b5cf6（紫）
- tool_call = #f59e0b（橙）
- tool_result = #eab308（黄）
- output = #22c55e（绿）
- error = #ef4444（红）

节点内容：类型图标 + 内容摘要（截断到 80 字）+ 耗时 + token 消耗。

### Step 5.3：Timeline 组件

`frontend/src/components/tracer/Timeline.tsx`：纵向时间线容器，渲染所有 StepNode。选中的节点高亮。支持自动滚动到选中节点。

### Step 5.4：StepDetail 组件

`frontend/src/components/tracer/StepDetail.tsx`：底部详情面板，展示选中步骤的完整信息。

Tab 切换：
- **内容** — content 字段完整展示
- **元数据** — duration_ms, token_count, model, tool_name 等
- **原始数据** — JSON 格式展示所有字段

### Step 5.5：改造 TracerPage

`frontend/src/pages/TracerPage.tsx`：三栏布局。

```
┌──────────┬────────────────────────┬──────────┐
│          │                        │          │
│ Trace    │     Timeline           │ 详情面板 │
│ List     │     (步骤时间线)        │ (选中    │
│ (240px)  │                        │  步骤)   │
│          │                        │          │
├──────────┴────────────────────────┴──────────┤
│              StepDetail (底部 200px)          │
└──────────────────────────────────────────────┘
```

---

## Task 6：内嵌回放功能

### Step 6.1：回放控制栏

在 Timeline 顶部添加迷你控制栏：
- 播放/暂停按钮
- 速度选择（0.5x / 1x / 2x）
- 进度条（当前第几步 / 总步数）

实现方式：纯前端定时器，不依赖 WebSocket。

```typescript
// 在 traceStore 中添加回放状态
isPlaying: boolean;
playSpeed: number;  // ms per step

play: () => void;
pause: () => void;
setPlaySpeed: (speed: number) => void;
```

播放逻辑：`setInterval` 每隔 `playSpeed` 毫秒，`selectedStepIndex + 1`，直到最后一步自动停止。

### Step 6.2：自动滚动

Timeline 组件监听 `selectedStepIndex` 变化，使用 `scrollIntoView({ behavior: "smooth" })` 自动滚动到当前步骤。

---

## Task 7：演示用例 + 种子数据

### Step 7.1：创建 Demo Agent

`examples/demo_tracer.py`：

```python
import asyncio
import httpx

API_BASE = "http://localhost:8000/api/v1"

async def run_demo():
    async with httpx.AsyncClient() as client:
        # 创建 trace
        resp = await client.post(f"{API_BASE}/traces", json={"agent_id": "demo_weather_agent"})
        trace_id = resp.json()["id"]

        # 模拟 agent 执行过程
        steps = [
            {"type": "input", "content": "帮我查一下北京的天气"},
            {"type": "thinking", "content": "用户想查天气，需要调用天气API获取北京的天气信息"},
            {"type": "tool_call", "content": "调用 get_weather 工具", "tool_name": "get_weather", "tool_params": {"city": "北京"}},
            {"type": "tool_result", "content": "获取到天气数据", "tool_name": "get_weather", "tool_result": {"temp": 28, "weather": "晴", "humidity": 45}},
            {"type": "output", "content": "北京今天天气晴朗，气温28°C，湿度45%，适合出行！"},
        ]

        # 批量提交步骤
        await client.post(f"{API_BASE}/traces/{trace_id}/steps", json={"steps": steps})

        # 完成 trace
        await client.post(f"{API_BASE}/traces/{trace_id}/complete")
        print(f"Demo trace created: {trace_id}")

if __name__ == "__main__":
    asyncio.run(run_demo())
```

### Step 7.2：验证完整流程

```bash
# 1. 启动后端
cd backend && uv run uvicorn app.main:app --reload

# 2. 运行 demo
cd examples && uv run python demo_tracer.py

# 3. 启动前端
cd frontend && npm run dev

# 4. 打开 http://localhost:5173/tracer
# 预期：左侧看到 demo_weather_agent 的 trace，点击后中间显示时间线
```

---

## 阶段衔接：Phase 1 -> Phase 2

**Phase 1 完成后的状态：**
- 后端有完整的 Trace/Step CRUD API（含批量写入）
- 前端 Tracer 页面能展示时间线、详情面板、内嵌回放
- 有一条 demo trace 数据

**Phase 2 需要继承的基础设施：**
- `database.py` 中的 `Base`（EvalCase/EvalReport 继承它）
- `router.py` 中的路由注册点（注册 evals 路由）
- `client.ts` 中的 API 客户端
- `EvaluatorPage.tsx` 占位页面（待改造）
- `Sidebar.tsx` 中的导航项（Evaluator 已有）

**Phase 2 第一步：** 创建 EvalCase 和 EvalReport 的 ORM 模型
