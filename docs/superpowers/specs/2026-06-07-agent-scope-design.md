# AgentScope 设计文档

> 版本：1.0  
> 日期：2026-06-07  
> 作者：AgentScope Team

---

## 一、项目背景

### 1.1 问题陈述

当前 AI Agent 开发存在以下痛点：

1. **黑盒问题** - Agent 的决策过程不透明，难以理解"为什么 agent 做了这个决定"
2. **调试困难** - 缺乏专业的调试工具，只能靠打印日志
3. **评测主观** - 缺乏标准化的评测方法，优化效果难以量化
4. **对比麻烦** - 想比较不同方案，需要手动记录和分析

### 1.2 解决方案

AgentScope 提供一站式 Agent DevTools：

- **Tracer** - 记录完整执行链路，让 agent 变成"白盒"
- **Replay** - 回放调试，支持断点和单步执行
- **Evaluator** - 标准化评测，自动生成能力报告
- **Arena** - 多方对比，数据驱动选择最优方案

### 1.3 目标用户

- Agent 应用开发者
- AI 工程师
- 需要评测第三方 agent 的团队
- AI 研究人员

---

## 二、核心概念

### 2.1 Trace（轨迹）

Trace 是 AgentScope 的核心数据结构，记录 agent 的完整执行过程。

```typescript
interface Trace {
  id: string;                    // 唯一标识
  agent_id: string;              // agent 标识
  session_id: string;            // 会话标识
  started_at: number;            // 开始时间戳
  ended_at: number;              // 结束时间戳
  status: 'running' | 'completed' | 'failed';
  steps: Step[];                 // 执行步骤列表
  metadata: Record<string, any>; // 元数据
}
```

### 2.2 Step（步骤）

Step 是 trace 的基本单位，记录每一步的详细信息。

```typescript
interface Step {
  id: string;
  type: 'input' | 'thinking' | 'tool_call' | 'tool_result' | 'output' | 'error';
  timestamp: number;
  content: string;               // 内容
  metadata: {
    token_count?: number;        // token 消耗
    duration_ms?: number;        // 耗时
    model?: string;              // 使用的模型
    tool_name?: string;          // 工具名称（如果是工具调用）
    tool_params?: any;           // 工具参数
    tool_result?: any;           // 工具返回
  };
}
```

### 2.3 EvalCase（评测用例）

```typescript
interface EvalCase {
  id: string;
  name: string;                  // 用例名称
  input: string;                 // 输入
  expected_output?: string;      // 期望输出（可选）
  eval_rules: EvalRule[];        // 评分规则
  tags: string[];                // 标签（用于分类）
}

interface EvalRule {
  type: 'exact_match' | 'contains' | 'regex' | 'llm_judge' | 'custom';
  config: Record<string, any>;   // 规则配置
  weight: number;                // 权重
}
```

### 2.4 EvalReport（评测报告）

```typescript
interface EvalReport {
  id: string;
  agent_id: string;
  timestamp: number;
  total_cases: number;
  passed_cases: number;
  failed_cases: number;
  pass_rate: number;             // 通过率
  avg_score: number;             // 平均分
  dimensions: {                  // 能力维度
    accuracy: number;            // 准确性
    relevance: number;           // 相关性
    efficiency: number;          // 效率
    safety: number;              // 安全性
  };
  details: EvalResult[];         // 详细结果
}
```

---

## 三、系统架构

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      前端 (React + TS)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Tracer   │ │ Replay   │ │Evaluator │ │  Arena   │       │
│  │ 时间线   │ │ 回放控制 │ │ 测试管理 │ │ 对比视图 │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     后端 (FastAPI)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Gateway                                         │  │
│  │  - WebSocket (实时推送)                               │  │
│  │  - REST API (CRUD操作)                               │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  核心服务                                            │  │
│  │  - Trace Collector (轨迹收集)                         │  │
│  │  - Replay Engine (回放引擎)                          │  │
│  │  - Eval Runner (评测执行器)                          │  │
│  │  - Arena Manager (对比管理)                          │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Agent 接入层                                        │  │
│  │  - OpenAI SDK Wrapper (方法B)                        │  │
│  │  - Proxy Server (代理模式)                           │  │
│  │  - CLI Tool (命令行工具)                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      存储层                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │ SQLite   │ │ 文件系统 │ │  缓存    │                    │
│  │ 轨迹数据 │ │ 导出报告 │ │  Redis   │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 模块职责

#### Trace Collector（轨迹收集器）

**职责：** 接收、验证、存储 trace 数据

**接口：**
- `POST /api/v1/traces` - 创建新 trace
- `PATCH /api/v1/traces/{id}/steps` - 添加步骤
- `POST /api/v1/traces/{id}/complete` - 完成 trace
- `WebSocket /ws/traces/{id}` - 实时推送步骤

#### Replay Engine（回放引擎）

**职责：** 加载 trace，支持回放、断点、单步执行

**接口：**
- `GET /api/v1/traces/{id}/replay` - 获取回放数据
- `POST /api/v1/traces/{id}/replay/step` - 单步执行
- `POST /api/v1/traces/{id}/replay/snapshot` - 获取快照

#### Eval Runner（评测执行器）

**职责：** 执行评测用例，收集结果，生成报告

**接口：**
- `POST /api/v1/evals/run` - 运行评测
- `GET /api/v1/evals/{id}/status` - 查询评测状态
- `GET /api/v1/evals/{id}/report` - 获取评测报告

#### Arena Manager（对比管理器）

**职责：** 管理多个 agent 的并行测试和对比

**接口：**
- `POST /api/v1/arena/compare` - 创建对比任务
- `GET /api/v1/arena/{id}/results` - 获取对比结果
- `GET /api/v1/arena/{id}/report` - 获取对比报告

---

## 四、接入方式详解

### 4.1 方法 A：代码接入（装饰器）

```python
from agent_scope import trace, TracerClient

# 初始化客户端
client = TracerClient("http://localhost:8000")

# 方式 1：装饰器
@client.trace
async def my_agent(input: str):
    # agent 逻辑
    return result

# 方式 2：手动埋点
async def my_agent(input: str):
    trace = client.start_trace(agent_id="my_agent")
    
    trace.add_step("input", content=input)
    
    # 思考过程
    trace.add_step("thinking", content="分析用户需求...")
    
    # 工具调用
    result = await call_tool("search", params)
    trace.add_step("tool_call", 
                   tool_name="search",
                   tool_params=params,
                   tool_result=result)
    
    # 最终输出
    output = generate_response(result)
    trace.add_step("output", content=output)
    
    trace.complete()
    return output
```

### 4.2 方法 B：SDK 兼容（OpenAI 包装）

```python
# 原代码
from openai import OpenAI

# 改成
from agent_scope.openai import TracedOpenAI as OpenAI

# 其他代码完全不变
client = OpenAI(api_key="sk-xxx")
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "你好"}]
)
# 自动记录所有 API 调用
```

### 4.3 命令行评测

```bash
# 评测单个 agent
agent-scope eval \
  --endpoint http://localhost:3000/v1/chat \
  --test-cases test_cases.json \
  --output report.html

# 批量评测多个 agent
agent-scope eval-batch \
  --agents agents.json \
  --test-cases test_cases.json \
  --output comparison.html
```

### 4.4 代理模式

```bash
# 启动代理
agent-scope proxy --port 9000 --target http://agent-server:3000

# 所有请求经过代理，自动记录
# 用户请求 → 代理 (localhost:9000) → 真正的 agent
```

### 4.5 导入日志

```bash
# 导入 JSON 格式日志
agent-scope import \
  --format json \
  --input agent_logs.json \
  --output trace.html

# 支持的格式：json, csv, jsonl
```

---

## 五、前端设计

### 5.1 页面结构

```
首页 (Dashboard)
├── Agent 列表
├── 最近 Trace
├── 评测概览
└── 快速操作

Tracer 页面
├── 时间线视图
│   ├── 步骤列表
│   ├── 耗时统计
│   └── Token 统计
├── 详情面板
│   ├── 步骤详情
│   ├── 上下文快照
│   └── 元数据
└── 操作栏
    ├── 导出
    ├── 分享
    └── 重新执行

Replay 页面
├── 回放控制栏
│   ├── 播放/暂停
│   ├── 单步执行
│   ├── 速度控制
│   └── 进度条
├── 当前步骤高亮
└── 上下文面板

Evaluator 页面
├── 测试用例管理
│   ├── 用例列表
│   ├── 导入/导出
│   └── 编辑器
├── 评测运行
│   ├── 运行配置
│   ├── 进度显示
│   └── 实时日志
└── 报告查看
    ├── 总览
    ├── 能力雷达图
    ├── 详细结果
    └── 导出

Arena 页面
├── Agent 选择
├── 测试用例选择
├── 对比结果
│   ├── 表格视图
│   ├── 图表视图
│   └── 详细对比
└── 导出报告
```

### 5.2 关键组件

#### Timeline（时间线组件）

- 按时间轴展示每个步骤
- 颜色编码：不同步骤类型用不同颜色
- 点击展开详情
- 支持缩放和滚动

#### ReplayControls（回放控制组件）

- 播放/暂停按钮
- 单步执行按钮
- 速度控制滑块（0.5x, 1x, 2x, 4x）
- 进度条（可拖拽）

#### RadarChart（能力雷达图）

- 展示 agent 在各维度的能力
- 支持多 agent 叠加对比
- 可交互（点击查看详细分数）

#### DiffView（对比视图）

- 左右分栏展示两个 agent 的输出
- 高亮差异部分
- 支持同步滚动

---

## 六、数据模型

### 6.1 数据库设计

#### traces 表

```sql
CREATE TABLE traces (
    id VARCHAR(36) PRIMARY KEY,
    agent_id VARCHAR(100) NOT NULL,
    session_id VARCHAR(36),
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    status VARCHAR(20) NOT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_traces_agent_id ON traces(agent_id);
CREATE INDEX idx_traces_started_at ON traces(started_at);
```

#### steps 表

```sql
CREATE TABLE steps (
    id VARCHAR(36) PRIMARY KEY,
    trace_id VARCHAR(36) NOT NULL,
    type VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    content TEXT,
    metadata JSON,
    FOREIGN KEY (trace_id) REFERENCES traces(id)
);

CREATE INDEX idx_steps_trace_id ON steps(trace_id);
CREATE INDEX idx_steps_timestamp ON steps(timestamp);
```

#### eval_cases 表

```sql
CREATE TABLE eval_cases (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    input TEXT NOT NULL,
    expected_output TEXT,
    eval_rules JSON NOT NULL,
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### eval_reports 表

```sql
CREATE TABLE eval_reports (
    id VARCHAR(36) PRIMARY KEY,
    agent_id VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    total_cases INT NOT NULL,
    passed_cases INT NOT NULL,
    failed_cases INT NOT NULL,
    pass_rate FLOAT NOT NULL,
    avg_score FLOAT NOT NULL,
    dimensions JSON NOT NULL,
    details JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_eval_reports_agent_id ON eval_reports(agent_id);
```

---

## 七、性能要求

| 指标 | 目标值 | 说明 |
|------|--------|------|
| Trace 记录延迟 | < 10ms | 不能拖慢 agent 执行 |
| 前端渲染 | 1000 步 < 1s | 大量数据时保持流畅 |
| 评测并发 | 10 个 agent | 支持并行评测 |
| 存储效率 | 单条 trace < 100KB | 节省存储空间 |
| 查询响应 | < 100ms | 快速查询历史 trace |
| WebSocket 延迟 | < 50ms | 实时推送流畅 |

---

## 八、安全考虑

### 8.1 数据安全

- 本地存储，数据不上传到第三方
- 支持数据加密（可选）
- 定期备份

### 8.2 访问控制

- 初期：单用户模式，无需认证
- 后期：支持多用户 + API Key 认证

### 8.3 API 安全

- 速率限制
- 输入验证
- CORS 配置

---

## 九、扩展性设计

### 9.1 插件系统（后期）

```python
# 评测规则插件
class CustomEvalRule:
    def evaluate(self, input, output, expected):
        # 自定义评分逻辑
        return score

# 可视化插件
class CustomVisualization:
    def render(self, trace):
        # 自定义展示逻辑
        return html
```

### 9.2 Webhook 集成

```json
{
  "event": "eval.completed",
  "data": {
    "agent_id": "my_agent",
    "pass_rate": 0.85,
    "report_url": "http://localhost:8000/reports/123"
  }
}
```

---

## 十、术语表

| 术语 | 定义 |
|------|------|
| Trace | Agent 的完整执行轨迹 |
| Step | Trace 中的单个执行步骤 |
| EvalCase | 评测用例，包含输入和期望输出 |
| EvalRule | 评分规则 |
| EvalReport | 评测报告 |
| Arena | 多 agent 对比场景 |
| Replay | 回放调试 |

---

## 附录

### A. 参考资料

- OpenAI API 文档
- LangChain 文档
- FastAPI 文档
- React 文档

### B. 相关项目

- LangSmith
- AgentOps
- LangFuse
- Weights & Biases

---

**文档版本历史：**

| 版本 | 日期 | 修改内容 |
|------|------|---------|
| 1.0 | 2026-06-07 | 初始版本 |
