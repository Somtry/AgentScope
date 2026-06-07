# AgentScope

> 本地优先、轻量级、框架无关的 Agent DevTools

**一句话定位：** 帮助开发者理解、调试、评测 AI agent 的一站式工具平台。

---

## 🎯 核心价值

- 🔍 **看得懂** - 让 agent 从"黑盒"变成"白盒"
- 📊 **测得准** - 从"凭感觉调优"变成"数据驱动优化"
- 🚀 **用得快** - 5 分钟快速体验，零配置上手

---

## 🧩 四大核心模块

| 模块 | 功能 | 解决的问题 |
|------|------|-----------|
| **Tracer** | 链路追踪 | "agent 是怎么执行的？" |
| **Replay** | 回放调试 | "为什么 agent 做了这个决定？" |
| **Evaluator** | 评测引擎 | "这个 agent 表现怎么样？" |
| **Arena** | 多方对比 | "哪个方案更好？" |

---

## 🔌 五种接入方式

| 方式 | 改代码？ | 适用场景 |
|------|---------|---------|
| **方法 A：代码接入** | 需要 | 新开发，精细控制 |
| **方法 B：SDK 兼容** | 换 import | 已有代码，快速接入 |
| **命令行评测** | 不需要 | 评测现成 agent |
| **代理模式** | 不需要 | 无缝接入，CI/CD |
| **导入日志** | 不需要 | 分析历史数据 |

---

## 🚀 快速开始

```bash
# 安装
pip install agent-scope

# 5 分钟快速体验
agent-scope demo

# 打开浏览器查看
open http://localhost:8000
```

---

## 🏗️ 技术栈

**后端：**
- FastAPI + SQLAlchemy + SQLite/PostgreSQL
- WebSocket（实时推送）
- Typer（命令行工具）

**前端：**
- React 18 + TypeScript + Tailwind CSS v4
- Zustand（状态管理）
- Framer Motion（动效）
- ECharts（可视化）

**SDK：**
- Python（OpenAI SDK 包装 + 装饰器）

---

## 📊 与同类产品对比

| 特性 | AgentScope | LangSmith | AgentOps | LangFuse |
|------|------------|-----------|----------|----------|
| **部署方式** | 本地优先 | 云端 | 云端 | 云端/自部署 |
| **数据隐私** | ✅ 数据在本地 | ❌ 上传云端 | ❌ 上传云端 | ✅ 可自部署 |
| **上手时间** | 5 分钟 | 需注册 | 需注册 | 需配置 |
| **框架绑定** | ❌ 无关 | LangChain | 通用 | 通用 |
| **轻量程度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

**一句话总结：** AgentScope 是"本地版、轻量级、框架无关"的 Agent DevTools

---

## 📅 开发路线

### Phase 1：核心骨架（2 周）
- Tracer 基础功能
- Evaluator 命令行版本
- 5 分钟快速体验

### Phase 2：回放调试（1 周）
- 时间线回放
- 上下文快照
- 单步执行

### Phase 3：评测引擎（1.5 周）
- 测试用例管理
- 批量运行 + 自动评分
- 评测报告（能力雷达图）

### Phase 4：多方对比（1 周）
- 多 agent 并行测试
- 对比视图
- 导出报告

### Phase 5：高级功能（1.5 周）
- 代理模式
- CI/CD 集成
- 插件系统预留

---

## 📁 项目结构

```
AgentScope/
├── docs/
│   └── superpowers/
│       ├── specs/              # 设计文档
│       └── plans/              # 实现计划
├── backend/                    # FastAPI 后端
│   ├── app/
│   │   ├── api/                # API 路由
│   │   ├── core/               # 核心逻辑
│   │   ├── models/             # 数据模型
│   │   └── services/           # 业务服务
│   └── tests/
├── frontend/                   # React 前端
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── hooks/
│   └── tests/
├── sdk/                        # Python SDK
│   ├── agent_scope/
│   └── tests/
├── cli/                        # 命令行工具
│   └── agent_scope_cli/
└── examples/                   # 示例 agent
    └── demo_agent/
```

---

## 📖 文档

- [设计文档](docs/superpowers/specs/2026-06-07-agent-scope-design.md)
- [实现计划](docs/superpowers/plans/2026-06-07-agent-scope-implementation.md)

---

## 🤝 贡献

欢迎贡献！请先阅读 [贡献指南](CONTRIBUTING.md)（待创建）。

---

## 📄 许可证

MIT License

---

**Made with ❤️ by AgentScope Team**
