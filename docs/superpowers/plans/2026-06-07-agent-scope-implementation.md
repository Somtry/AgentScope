# AgentScope 实现计划（v2 精简版）

> 版本：2.0  
> 日期：2026-06-07  
> 基于：[设计文档](../specs/2026-06-07-agent-scope-design.md)  
> 变更：根据架构评审精简范围，MVP 收敛到 Tracer + Evaluator 两大模块

---

## 总体策略

**核心原则：** 先骨架后模块，先跑起来再打磨。

**MVP 范围：**
- **Tracer** — 链路追踪 + 时间线展示 + 内嵌回放（自动滚动/单步高亮）
- **Evaluator** — 评测引擎 + Arena 对比（作为 Evaluator 的子功能）
- **接入方式** — 装饰器 + OpenAI SDK 包装（两种覆盖新旧项目）

**后期扩展（不在 MVP 范围）：**
- 独立 Replay 模块（WebSocket 实时回放引擎）
- 代理模式接入
- CLI 命令行评测/导入日志
- LLM-as-Judge 评测规则
- 插件系统

---

## Phase 0：项目初始化（30 分钟）

> 目标：搭建项目骨架，前后端能分别启动。

### 任务清单

#### 0.1 后端初始化

- 创建 `backend/` 目录结构
- `backend/pyproject.toml` — Python 项目配置（uv 管理依赖）
- `backend/app/__init__.py`
- `backend/app/main.py` — FastAPI 入口，健康检查接口 `GET /api/v1/health`
- `backend/app/core/config.py` — 配置管理（环境变量 + 默认值）
- `backend/app/core/database.py` — SQLAlchemy 引擎 + Session 管理（SQLite）

**依赖：**
- fastapi
- uvicorn[standard]
- sqlalchemy[asyncio]
- aiosqlite
- pydantic >= 2.0
- pydantic-settings

**验证标准：**
- `uv run uvicorn app.main:app --reload` 能启动
- 访问 `http://localhost:8000/api/v1/health` 返回 200

#### 0.2 前端初始化

- `frontend/` — Vite + React 18 + TypeScript
- 配置 Tailwind CSS v4
- 安装 zustand, framer-motion, echarts, react-router-dom
- 创建基础页面路由（Dashboard、Tracer、Evaluator）
- 创建基础布局：**开发者工具风格**（侧边栏 tree view + 主内容区 + 底部详情面板）

**验证标准：**
- `npm run dev` 能启动
- 访问 `http://localhost:5173` 能看到带侧边栏的空白页面

#### 0.3 项目根目录

- `.gitignore`
- `README.md`（已有）

---

## Phase 1：Tracer 核心（约 3-4 小时）

> 目标：后端能接收和存储 trace 数据，前端能展示时间线。一个 agent 跑完后能看到完整执行过程。  
> 内嵌回放功能：在时间线视图中支持自动滚动高亮和手动单步浏览。

### 任务清单

#### 1.1 后端数据模型

- `backend/app/models/trace.py` — Trace ORM 模型
- `backend/app/models/step.py` — Step ORM 模型
- `backend/app/models/__init__.py` — 模型导出

**Trace 表：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | str (UUID, PK) | 唯一标识 |
| agent_id | str | agent 标识 |
| session_id | str (nullable) | 会话标识 |
| started_at | datetime | 开始时间 |
| ended_at | datetime (nullable) | 结束时间 |
| status | str | running / completed / failed |
| metadata_json | Text | JSON 元数据 |
| created_at | datetime | 创建时间 |

**Step 表：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | str (UUID, PK) | 唯一标识 |
| trace_id | str (FK) | 关联 trace |
| type | str | input / thinking / tool_call / tool_result / output / error |
| seq | int | 步骤序号（保证顺序） |
| timestamp | datetime | 时间戳 |
| content | Text | 内容 |
| duration_ms | int (nullable) | 耗时 |
| token_count | int (nullable) | token 消耗 |
| model | str (nullable) | 使用的模型 |
| tool_name | str (nullable) | 工具名称 |
| tool_params | Text (nullable) | 工具参数 JSON |
| tool_result | Text (nullable) | 工具返回 JSON |

**设计决策：** Step 字段扁平化，不嵌套 metadata JSON。好处是查询和筛选更直接，前端渲染也不需要二次解析。

#### 1.2 后端 API

- `backend/app/schemas/trace.py` — Pydantic 请求/响应模型
- `backend/app/api/traces.py` — Trace API 路由
- `backend/app/api/router.py` — 路由注册

**接口：**

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/traces` | 创建新 trace |
| GET | `/api/v1/traces` | 列表查询（分页、按 agent_id 筛选、按时间排序） |
| GET | `/api/v1/traces/{id}` | 获取 trace 详情（含 steps） |
| POST | `/api/v1/traces/{id}/steps` | **批量**追加步骤（支持一次提交多个 step） |
| POST | `/api/v1/traces/{id}/complete` | 标记完成 |

**关键设计：** `POST /steps` 支持批量写入（body 是数组），避免每个 step 单独请求导致高频率写入。SDK 端攒一批再提交。

#### 1.3 前端 Tracer 页面

**页面结构：开发者工具风格**
- 左侧：Trace 列表（紧凑的 tree view，按 agent 分组）
- 中间：时间线视图（纵向时间线，步骤节点 + 连接线）
- 底部：详情面板（选中步骤后展示完整信息，tab 切换内容/元数据/原始 JSON）

**组件：**
- `frontend/src/pages/TracerPage.tsx` — 主页面（三栏布局）
- `frontend/src/components/tracer/TraceList.tsx` — 左侧列表
- `frontend/src/components/tracer/Timeline.tsx` — 时间线（核心组件）
- `frontend/src/components/tracer/StepNode.tsx` — 步骤节点（颜色编码）
- `frontend/src/components/tracer/StepDetail.tsx` — 底部详情面板
- `frontend/src/stores/traceStore.ts` — Zustand 状态管理
- `frontend/src/api/traces.ts` — API 请求封装

**步骤颜色编码：**
- input = 蓝色
- thinking = 紫色
- tool_call = 橙色
- tool_result = 黄色
- output = 绿色
- error = 红色

**内嵌回放功能：**
- 时间线顶部加一个迷你控制栏：播放/暂停 + 速度选择
- 播放时自动高亮当前步骤并滚动到可视区域
- 进度条显示当前在第几步 / 总步数
- 实现方式：前端定时器控制，不需要 WebSocket

#### 1.4 演示用例

- `examples/demo_tracer.py` — 一个简单的 demo agent，用装饰器接入 tracer
- 启动时自动生成 3-5 条示例 trace 数据（种子数据），用于前端调试

**验证标准：**
- 运行 demo_tracer.py 后，前端能看到该 agent 的完整执行时间线
- 点击每个步骤能在底部看到详情
- 能按 agent_id 筛选
- 点击播放，步骤逐个高亮并自动滚动

---

## Phase 2：Evaluator + Arena 评测（约 3-4 小时）

> 目标：能定义测试用例、批量运行、自动评分、生成报告（含能力雷达图）。  
> Arena 作为 Evaluator 的"对比模式"：选多个 agent 同跑一组用例，自动生成对比视图。

### 任务清单

#### 2.1 后端评测模型

- `backend/app/models/eval_case.py` — EvalCase ORM
- `backend/app/models/eval_report.py` — EvalReport ORM

**EvalCase 表：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | str (UUID, PK) | 唯一标识 |
| name | str | 用例名称 |
| input | Text | 输入 |
| expected_output | Text (nullable) | 期望输出 |
| eval_rules | Text | JSON 数组，评分规则列表 |
| tags | Text (nullable) | JSON 数组，标签 |
| created_at | datetime | 创建时间 |

**EvalReport 表：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | str (UUID, PK) | 唯一标识 |
| agent_id | str | agent 标识 |
| timestamp | datetime | 运行时间 |
| total_cases | int | 总用例数 |
| passed_cases | int | 通过数 |
| avg_score | float | 平均分 |
| dimensions | Text | JSON，能力维度分数 |
| details | Text | JSON，每条用例的详细结果 |
| created_at | datetime | 创建时间 |

**MVP 评分规则（只做规则匹配）：**

| 规则类型 | 说明 |
|----------|------|
| exact_match | 完全匹配 |
| contains | 包含关键词 |
| regex | 正则匹配 |
| custom | 自定义 Python 函数（预留） |

#### 2.2 评测执行器

- `backend/app/core/eval_runner.py` — 评测执行逻辑

**执行流程：**
1. 加载 eval_cases
2. 对每个 case，调用 agent endpoint 获取输出
3. 按 eval_rules 逐条打分
4. 汇总生成 EvalReport（含能力维度雷达图数据）

**接口：**

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/evals/cases` | 创建评测用例 |
| GET | `/api/v1/evals/cases` | 列表查询 |
| POST | `/api/v1/evals/run` | 运行评测（单 agent） |
| POST | `/api/v1/evals/compare` | Arena 对比模式（多 agent） |
| GET | `/api/v1/evals/{id}/report` | 获取报告 |

#### 2.3 前端评测页面

**页面结构：**
- 左侧：评测用例列表 + 筛选标签
- 中间：评测结果 / 对比视图
- 底部：报告详情（能力雷达图 + 详细结果表格）

**组件：**
- `frontend/src/pages/EvaluatorPage.tsx` — 主页面
- `frontend/src/components/eval/CaseList.tsx` — 用例列表
- `frontend/src/components/eval/CaseEditor.tsx` — 用例编辑器（弹窗）
- `frontend/src/components/eval/RunPanel.tsx` — 运行配置面板（选 agent、选用例）
- `frontend/src/components/eval/ReportView.tsx` — 报告查看
- `frontend/src/components/eval/RadarChart.tsx` — 能力雷达图（ECharts）
- `frontend/src/components/eval/CompareTable.tsx` — Arena 对比表格
- `frontend/src/components/eval/CompareChart.tsx` — 多 agent 雷达图叠加
- `frontend/src/stores/evalStore.ts` — Zustand 状态管理

**Arena 对比模式：**
- 在运行面板中选择多个 agent
- 同一组用例跑所有选中的 agent
- 结果用表格 + 叠加雷达图展示
- 表格每行一条用例，每列一个 agent 的得分

**验证标准：**
- 能创建和编辑评测用例（4 种规则类型）
- 运行评测后能看到报告和雷达图
- Arena 对比模式能同时跑 2-3 个 agent 并展示对比

---

## Phase 3：SDK + 打磨（约 2-3 小时）

> 目标：提供 Python SDK 让用户 5 分钟接入，完善整体体验。

### 任务清单

#### 3.1 Python SDK

- `sdk/agent_scope/__init__.py` — 包入口
- `sdk/agent_scope/client.py` — TracerClient（HTTP 客户端）
- `sdk/agent_scope/decorators.py` — @trace 装饰器
- `sdk/agent_scope/openai_wrapper.py` — OpenAI SDK 包装

**装饰器用法：**
```python
from agent_scope import TracerClient

client = TracerClient("http://localhost:8000")

@client.trace(agent_id="my_agent")
async def run_agent(input_text: str):
    # agent 逻辑
    return result
```

**OpenAI 包装用法（换一行 import）：**
```python
# 原代码
from openai import OpenAI

# 改成
from agent_scope.openai import TracedOpenAI as OpenAI

# 其他代码完全不变，自动记录所有 API 调用
client = OpenAI(api_key="sk-xxx")
```

#### 3.2 种子数据与 Demo

- `examples/demo_tracer.py` — 装饰器接入的 demo
- `examples/demo_openai.py` — OpenAI 包装的 demo
- `examples/sample_cases.json` — 示例评测用例

#### 3.3 体验打磨

- 前端暗色主题统一调优（开发者工具风格）
- 错误状态处理（网络断开、agent 超时等空状态页面）
- 键盘快捷键（j/k 上下导航步骤、Enter 展开详情）
- Trace 导出为 JSON

**验证标准：**
- `pip install agent-scope` 后跑 demo 能看到 trace
- OpenAI 包装 demo 能自动记录 API 调用
- 整体 UI 风格统一、暗色主题、开发者工具质感

---

## 技术决策备忘

| 决策 | 选择 | 原因 |
|------|------|------|
| 包管理 | uv | 用户要求 |
| 数据库 | SQLite（开发）/ PostgreSQL（生产） | 零配置开发 |
| ORM | SQLAlchemy 2.0 async | 异步高性能 |
| 前端构建 | Vite | 快速 HMR |
| 状态管理 | Zustand | 轻量、简洁 |
| 图表 | ECharts | 雷达图支持好 |
| CSS | Tailwind CSS v4 | 用户技术栈 |
| 动效 | Framer Motion | 用户技术栈 |
| 前端风格 | 开发者工具（类 Chrome DevTools） | 与定位匹配 |
| Step 写入 | 批量 POST | 避免高频写入瓶颈 |
| 评分规则 | 规则匹配（MVP） | LLM-as-Judge 成本高，后期加 |

---

## 执行顺序

```
Phase 0       Phase 1           Phase 2              Phase 3
 初始化   -->  Tracer 核心   -->  Evaluator + Arena  -->  SDK + 打磨
 (30min)      (3-4h)            (3-4h)                (2-3h)
```

每个 Phase 完成后独立 git commit，确保可回退。

**Phase 完成后可用的状态：**
- Phase 0：前后端能分别启动，看到空白骨架
- Phase 1：能看到 agent 执行的时间线，支持内嵌回放
- Phase 2：能跑评测、看报告、多 agent 对比
- Phase 3：SDK 接入 5 分钟上手，整体体验完善

---

## 注意事项

- 所有代码注释使用中文
- 使用 uv 管理 Python 依赖
- 前端保持暗色主题、开发者工具风格
- API 遵循 RESTful 规范
- Step 写入必须支持批量
- 错误处理要完善，不能有未捕获异常
