# Phase 0：项目初始化 详细计划

> **目标：** 搭建项目骨架，前后端能分别启动并通信。
> **预计时间：** 30-45 分钟
> **前置条件：** 无
> **完成后状态：** `uv run uvicorn` 启动后端、`npm run dev` 启动前端，健康检查通过

---

## 文件结构（本阶段产出）

```
AgentScope/
├── .gitignore
├── backend/
│   ├── pyproject.toml
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── router.py
│   │   └── core/
│   │       ├── __init__.py
│   │       ├── config.py
│   │       └── database.py
│   └── tests/
│       └── __init__.py
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── api/
│       │   └── client.ts
│       ├── components/
│       │   └── layout/
│       │       ├── Sidebar.tsx
│       │       └── Layout.tsx
│       └── pages/
│           ├── Dashboard.tsx
│           ├── TracerPage.tsx
│           └── EvaluatorPage.tsx
```

---

## Task 1：后端项目初始化

### Step 1.1：创建 pyproject.toml

```toml
[project]
name = "agent-scope"
version = "0.1.0"
description = "本地优先的 Agent DevTools"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.34.0",
    "sqlalchemy[asyncio]>=2.0.0",
    "aiosqlite>=0.20.0",
    "pydantic>=2.0.0",
    "pydantic-settings>=2.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.24.0",
    "httpx>=0.27.0",
]
```

### Step 1.2：创建配置管理

`backend/app/core/config.py`：

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "AgentScope"
    debug: bool = True
    database_url: str = "sqlite+aiosqlite:///./agentscope.db"
    cors_origins: list[str] = ["http://localhost:5173"]

    class Config:
        env_prefix = "AS_"

settings = Settings()
```

### Step 1.3：创建数据库引擎

`backend/app/core/database.py`：

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from .config import settings

engine = create_async_engine(settings.database_url, echo=settings.debug)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with async_session() as session:
        yield session

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

### Step 1.4：创建 FastAPI 入口

`backend/app/main.py`：

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import init_db
from .api.router import router

app = FastAPI(title=settings.app_name, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")

@app.on_event("startup")
async def startup():
    await init_db()

@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}
```

### Step 1.5：创建路由注册

`backend/app/api/router.py`：

```python
from fastapi import APIRouter

router = APIRouter()
# 后续各模块路由在此注册
```

### Step 1.6：验证后端启动

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

**预期：** `Uvicorn running on http://127.0.0.1:8000`
**验证：** `http://localhost:8000/api/v1/health` 返回 `{"status":"ok","version":"0.1.0"}`

---

## Task 2：前端项目初始化

### Step 2.1：初始化 Vite 项目

```bash
cd E:\code\develop\AgentScope
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

### Step 2.2：安装依赖

```bash
npm install react-router-dom zustand framer-motion echarts echarts-for-react
npm install -D tailwindcss @tailwindcss/vite
```

### Step 2.3：配置 Vite + Tailwind

`frontend/vite.config.ts`：

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:8000" },
  },
});
```

`frontend/src/index.css`：

```css
@import "tailwindcss";

:root {
  --bg-primary: #1e1e1e;
  --bg-secondary: #252526;
  --bg-tertiary: #2d2d2d;
  --text-primary: #cccccc;
  --text-secondary: #969696;
  --accent: #007acc;
  --border: #3e3e3e;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: "Segoe UI", system-ui, sans-serif;
  margin: 0;
}
```

### Step 2.4：创建 API 客户端

`frontend/src/api/client.ts`：

```typescript
const BASE_URL = "/api/v1";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
};
```

### Step 2.5：创建布局组件

`frontend/src/components/layout/Sidebar.tsx`：暗色侧边栏，包含 Dashboard / Tracer / Evaluator 三个导航项，使用 NavLink 高亮当前路由。

`frontend/src/components/layout/Layout.tsx`：左侧 Sidebar + 右侧 Outlet 的 flex 布局。

### Step 2.6：创建页面占位 + 路由

`frontend/src/App.tsx`：BrowserRouter + Routes，Layout 包裹三个页面路由（/ , /tracer, /evaluator）。

每个页面组件只显示标题文字，作为占位。

### Step 2.7：验证前端启动

```bash
cd frontend
npm run dev
```

**预期：** `http://localhost:5173` 显示暗色侧边栏
**验证：** 点击侧边栏能切换页面，/api/health 请求能代理到后端

---

## Task 3：项目配置 + 提交

### Step 3.1：创建 .gitignore

```gitignore
__pycache__/
*.py[cod]
*.egg-info/
dist/
.venv/
*.db
node_modules/
frontend/dist/
.vscode/
.idea/
.DS_Store
Thumbs.db
```

### Step 3.2：提交

```bash
git add .
git commit -m "feat: 项目初始化 - 前后端骨架搭建完成"
```

---

## 阶段衔接：Phase 0 -> Phase 1

**Phase 0 完成后的状态：**
- 后端 `/api/v1/health` 返回 200
- 前端暗色侧边栏 + 三个页面路由
- API 代理配置完成（前端 /api -> 后端 8000）
- 数据库引擎就绪，Base 基类可用

**Phase 1 需要继承的基础设施：**
- `database.py` 中的 `Base`（ORM 模型继承它）
- `database.py` 中的 `get_db`（API 依赖注入）
- `router.py` 中的路由注册点
- `client.ts` 中的 API 客户端
- `TracerPage.tsx` 占位页面（待改造）

**Phase 1 第一步：** 创建 Trace 和 Step 的 ORM 模型，继承 Base
