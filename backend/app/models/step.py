import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, Integer, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.database import Base


class Step(Base):
    """步骤表，记录 trace 中每一步的详细信息"""
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

    # 关联 trace
    trace = relationship("Trace", back_populates="steps")
