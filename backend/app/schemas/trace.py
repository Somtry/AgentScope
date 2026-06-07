from datetime import datetime
from pydantic import BaseModel


# === 请求模型 ===

class TraceCreate(BaseModel):
    """创建 trace 请求"""
    agent_id: str
    session_id: str | None = None
    metadata: dict | None = None


class StepCreate(BaseModel):
    """创建步骤请求"""
    type: str  # input/thinking/tool_call/tool_result/output/error
    content: str | None = None
    duration_ms: int | None = None
    token_count: int | None = None
    model: str | None = None
    tool_name: str | None = None
    tool_params: dict | str | None = None
    tool_result: dict | str | None = None


class StepsBatchCreate(BaseModel):
    """批量创建步骤请求"""
    steps: list[StepCreate]


# === 响应模型 ===

class StepResponse(BaseModel):
    """步骤响应"""
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
    """轨迹响应（不含 steps）"""
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
    """轨迹详情响应（含 steps）"""
    steps: list[StepResponse] = []
