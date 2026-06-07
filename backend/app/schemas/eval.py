from datetime import datetime
from pydantic import BaseModel


class EvalRule(BaseModel):
    """评分规则"""
    type: str  # exact_match / contains / regex
    config: dict = {}
    weight: float = 1.0


class EvalCaseCreate(BaseModel):
    """创建评测用例"""
    name: str
    input: str
    expected_output: str | None = None
    eval_rules: list[EvalRule]
    tags: list[str] = []


class EvalCaseResponse(BaseModel):
    """用例响应"""
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
    """运行评测请求"""
    agent_id: str
    agent_endpoint: str
    case_ids: list[str]


class EvalCompareRequest(BaseModel):
    """Arena 对比请求"""
    agents: list[dict]  # [{"agent_id": "...", "endpoint": "..."}]
    case_ids: list[str]


class EvalReportResponse(BaseModel):
    """报告响应"""
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
