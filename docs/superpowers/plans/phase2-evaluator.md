# Phase 2：Evaluator + Arena 详细计划

> **目标：** 能定义测试用例、批量运行、自动评分、生成报告（含能力雷达图），支持多 agent 对比。
> **预计时间：** 3-4 小时
> **前置条件：** Phase 1 完成
> **完成后状态：** 能创建评测用例、运行评测、查看报告和雷达图、多 agent 对比

---

## 文件结构（本阶段产出）

```
backend/
├── app/
│   ├── models/
│   │   ├── eval_case.py
│   │   └── eval_report.py
│   ├── schemas/
│   │   └── eval.py
│   ├── api/
│   │   └── evals.py
│   └── core/
│       └── eval_runner.py

frontend/
└── src/
    ├── api/
    │   └── evals.ts
    ├── stores/
    │   └── evalStore.ts
    ├── components/
    │   └── eval/
    │       ├── CaseList.tsx
    │       ├── CaseEditor.tsx
    │       ├── RunPanel.tsx
    │       ├── ReportView.tsx
    │       ├── RadarChart.tsx
    │       ├── CompareTable.tsx
    │       └── CompareChart.tsx
    └── pages/
        └── EvaluatorPage.tsx

examples/
└── sample_cases.json
```

---

## Task 1：后端数据模型

### Step 1.1：创建 EvalCase 模型

`backend/app/models/eval_case.py`：

```python
import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from ..core.database import Base

class EvalCase(Base):
    __tablename__ = "eval_cases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(200))
    input: Mapped[str] = mapped_column(Text)
    expected_output: Mapped[str | None] = mapped_column(Text, nullable=True)
    eval_rules: Mapped[str] = mapped_column(Text)  # JSON 数组
    tags: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON 数组
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
```

### Step 1.2：创建 EvalReport 模型

`backend/app/models/eval_report.py`：

```python
import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, Integer, Float, func
from sqlalchemy.orm import Mapped, mapped_column
from ..core.database import Base

class EvalReport(Base):
    __tablename__ = "eval_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id: Mapped[str] = mapped_column(String(100), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    total_cases: Mapped[int] = mapped_column(Integer)
    passed_cases: Mapped[int] = mapped_column(Integer)
    avg_score: Mapped[float] = mapped_column(Float)
    dimensions: Mapped[str] = mapped_column(Text)  # JSON: {"accuracy": 0.8, "relevance": 0.9, ...}
    details: Mapped[str] = mapped_column(Text)  # JSON: 每条用例的详细结果
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
```

### Step 1.3：注册模型

修改 `backend/app/models/__init__.py`，添加 EvalCase 和 EvalReport。

---

## Task 2：后端评测执行器

### Step 2.1：创建评分引擎

`backend/app/core/eval_runner.py`：

```python
import re
import json
import httpx
from typing import Any

async def call_agent(endpoint: str, input_text: str) -> str:
    """调用 agent endpoint 获取输出"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(endpoint, json={"input": input_text})
        resp.raise_for_status()
        return resp.json().get("output", "")

def score_exact_match(output: str, expected: str) -> float:
    """完全匹配评分"""
    return 1.0 if output.strip() == expected.strip() else 0.0

def score_contains(output: str, keywords: list[str]) -> float:
    """包含关键词评分"""
    if not keywords:
        return 1.0
    matched = sum(1 for kw in keywords if kw in output)
    return matched / len(keywords)

def score_regex(output: str, pattern: str) -> float:
    """正则匹配评分"""
    return 1.0 if re.search(pattern, output) else 0.0

def evaluate_case(output: str, expected: str | None, rules: list[dict]) -> tuple[float, list[dict]]:
    """对单条用例评分，返回 (总分, 详细结果)"""
    if not rules:
        return 0.0, []

    total_weight = sum(r.get("weight", 1.0) for r in rules)
    weighted_score = 0.0
    details = []

    for rule in rules:
        rule_type = rule["type"]
        weight = rule.get("weight", 1.0)
        config = rule.get("config", {})

        if rule_type == "exact_match":
            score = score_exact_match(output, expected or "")
        elif rule_type == "contains":
            score = score_contains(output, config.get("keywords", []))
        elif rule_type == "regex":
            score = score_regex(output, config.get("pattern", ""))
        else:
            score = 0.0

        weighted_score += score * weight
        details.append({"type": rule_type, "score": score, "weight": weight})

    final_score = weighted_score / total_weight if total_weight > 0 else 0.0
    return final_score, details

def compute_dimensions(results: list[dict]) -> dict:
    """根据评测结果计算能力维度分数"""
    if not results:
        return {"accuracy": 0, "relevance": 0, "efficiency": 0, "safety": 0}

    avg_score = sum(r["score"] for r in results) / len(results)
    # 简化处理：所有维度初始等于平均分，后期可细化
    return {
        "accuracy": round(avg_score, 3),
        "relevance": round(avg_score, 3),
        "efficiency": round(avg_score, 3),
        "safety": 1.0,  # 安全性默认满分，后期接入专门的安全检测
    }
```

---

## Task 3：后端 API

### Step 3.1：创建 Schema

`backend/app/schemas/eval.py`：

```python
from datetime import datetime
from pydantic import BaseModel

class EvalRule(BaseModel):
    type: str  # exact_match / contains / regex
    config: dict = {}
    weight: float = 1.0

class EvalCaseCreate(BaseModel):
    name: str
    input: str
    expected_output: str | None = None
    eval_rules: list[EvalRule]
    tags: list[str] = []

class EvalCaseResponse(BaseModel):
    id: str
    name: str
    input: str
    expected_output: str | None
    eval_rules: str  # JSON 字符串
    tags: str | None
    created_at: datetime
    class Config:
        from_attributes = True

class EvalRunRequest(BaseModel):
    agent_id: str
    agent_endpoint: str  # agent 的 HTTP 接口
    case_ids: list[str]  # 选用例 ID 列表

class EvalCompareRequest(BaseModel):
    agents: list[dict]  # [{"agent_id": "gpt4", "endpoint": "..."}, ...]
    case_ids: list[str]

class EvalReportResponse(BaseModel):
    id: str
    agent_id: str
    timestamp: datetime
    total_cases: int
    passed_cases: int
    avg_score: float
    dimensions: str  # JSON
    details: str  # JSON
    class Config:
        from_attributes = True
```

### Step 3.2：创建 Evals API

`backend/app/api/evals.py`：

```python
import json
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..core.database import get_db
from ..models.eval_case import EvalCase
from ..models.eval_report import EvalReport
from ..core.eval_runner import call_agent, evaluate_case, compute_dimensions
from ..schemas.eval import (
    EvalCaseCreate, EvalCaseResponse, EvalRunRequest,
    EvalCompareRequest, EvalReportResponse,
)

router = APIRouter()

@router.post("/cases", response_model=EvalCaseResponse)
async def create_case(data: EvalCaseCreate, db: AsyncSession = Depends(get_db)):
    case = EvalCase(
        name=data.name,
        input=data.input,
        expected_output=data.expected_output,
        eval_rules=json.dumps([r.model_dump() for r in data.eval_rules]),
        tags=json.dumps(data.tags) if data.tags else None,
    )
    db.add(case)
    await db.commit()
    await db.refresh(case)
    return case

@router.get("/cases", response_model=list[EvalCaseResponse])
async def list_cases(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EvalCase).order_by(EvalCase.created_at.desc()))
    return result.scalars().all()

@router.post("/run", response_model=EvalReportResponse)
async def run_eval(data: EvalRunRequest, db: AsyncSession = Depends(get_db)):
    """运行单 agent 评测"""
    # 加载用例
    cases = []
    for cid in data.case_ids:
        c = await db.get(EvalCase, cid)
        if c:
            cases.append(c)

    if not cases:
        raise HTTPException(status_code=400, detail="No valid cases found")

    # 逐条运行
    results = []
    for case in cases:
        try:
            output = await call_agent(data.agent_endpoint, case.input)
            rules = json.loads(case.eval_rules)
            score, detail = evaluate_case(output, case.expected_output, rules)
            passed = score >= 0.6
        except Exception as e:
            output = f"ERROR: {e}"
            score = 0.0
            detail = []
            passed = False

        results.append({
            "case_id": case.id,
            "case_name": case.name,
            "input": case.input,
            "output": output,
            "expected": case.expected_output,
            "score": score,
            "passed": passed,
            "detail": detail,
        })

    # 生成报告
    passed_count = sum(1 for r in results if r["passed"])
    avg_score = sum(r["score"] for r in results) / len(results) if results else 0
    dimensions = compute_dimensions(results)

    report = EvalReport(
        agent_id=data.agent_id,
        total_cases=len(results),
        passed_cases=passed_count,
        avg_score=round(avg_score, 3),
        dimensions=json.dumps(dimensions),
        details=json.dumps(results, ensure_ascii=False),
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report

@router.post("/compare")
async def compare_agents(data: EvalCompareRequest, db: AsyncSession = Depends(get_db)):
    """Arena 模式：多 agent 对比"""
    reports = []
    for agent in data.agents:
        run_data = EvalRunRequest(
            agent_id=agent["agent_id"],
            agent_endpoint=agent["endpoint"],
            case_ids=data.case_ids,
        )
        report = await run_eval(run_data, db)
        reports.append(report)
    return reports

@router.get("/{report_id}", response_model=EvalReportResponse)
async def get_report(report_id: str, db: AsyncSession = Depends(get_db)):
    report = await db.get(EvalReport, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report
```

### Step 3.3：注册路由

修改 `backend/app/api/router.py`，添加 evals 路由。

---

## Task 4：前端评测页面

### Step 4.1：API 封装 + Store

`frontend/src/api/evals.ts`：封装 cases CRUD、run、compare、report 接口。

`frontend/src/stores/evalStore.ts`：管理 cases 列表、当前报告、对比结果。

### Step 4.2：CaseList 组件

`frontend/src/components/eval/CaseList.tsx`：左侧用例列表，显示名称 + 标签 + 规则数量。支持新增按钮。

### Step 4.3：CaseEditor 组件

`frontend/src/components/eval/CaseEditor.tsx`：弹窗编辑器。
- 名称输入框
- Input 多行文本
- Expected Output 多行文本
- 评分规则：动态添加行（类型下拉 + 配置 JSON + 权重滑块）
- 标签输入

### Step 4.4：RunPanel 组件

`frontend/src/components/eval/RunPanel.tsx`：运行配置面板。
- Agent ID 输入
- Agent Endpoint 输入
- 选用例（勾选列表）
- 运行按钮
- Arena 模式：添加多个 agent 行（agent_id + endpoint）

### Step 4.5：RadarChart 组件

`frontend/src/components/eval/RadarChart.tsx`：ECharts 雷达图。

```typescript
// 能力维度
const dimensions = ["accuracy", "relevance", "efficiency", "safety"];
// 单 agent 显示一个雷达
// Arena 模式叠加多个雷达，不同颜色区分
```

### Step 4.6：ReportView 组件

`frontend/src/components/eval/ReportView.tsx`：报告详情。
- 顶部：总览卡片（通过率、平均分、总用例数）
- 中间：雷达图
- 底部：详细结果表格（用例名 / 输出 / 期望 / 分数 / 通过）

### Step 4.7：CompareTable 组件

`frontend/src/components/eval/CompareTable.tsx`：Arena 对比表格。
- 每行一条用例
- 每列一个 agent 的得分
- 最高分高亮

### Step 4.8：CompareChart 组件

`frontend/src/components/eval/CompareChart.tsx`：多 agent 雷达图叠加，不同颜色区分。

### Step 4.9：改造 EvaluatorPage

`frontend/src/pages/EvaluatorPage.tsx`：三栏布局，类似 TracerPage。

```
┌──────────┬────────────────────────┬──────────┐
│ CaseList │  RunPanel / ReportView │ Radar    │
│ (240px)  │  (主内容区)             │ Chart    │
│          │                        │ (300px)  │
└──────────┴────────────────────────┴──────────┘
```

---

## Task 5：示例用例

### Step 5.1：创建示例评测用例

`examples/sample_cases.json`：

```json
[
  {
    "name": "天气查询",
    "input": "北京今天天气怎么样？",
    "expected_output": "",
    "eval_rules": [
      {"type": "contains", "config": {"keywords": ["北京", "天气"]}, "weight": 1.0}
    ],
    "tags": ["weather", "tool_call"]
  },
  {
    "name": "数学计算",
    "input": "123 * 456 等于多少？",
    "expected_output": "56088",
    "eval_rules": [
      {"type": "contains", "config": {"keywords": ["56088"]}, "weight": 1.0}
    ],
    "tags": ["math"]
  }
]
```

---

## 阶段衔接：Phase 2 -> Phase 3

**Phase 2 完成后的状态：**
- 后端有 EvalCase CRUD + 评测运行 + Arena 对比 API
- 前端 Evaluator 页面能创建用例、运行评测、查看报告和雷达图

**Phase 3 需要的输入：**
- 已有的 Trace/Step API（SDK 需要调用）
- 已有的 Evals API（CLI 需要调用）
- 前端所有页面（需要体验打磨）

**Phase 3 第一步：** 创建 SDK 包结构（pyproject.toml + __init__.py）
