import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, Integer, Float, func
from sqlalchemy.orm import Mapped, mapped_column
from ..core.database import Base


class EvalReport(Base):
    """评测报告表，存储评测结果和能力维度"""
    __tablename__ = "eval_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id: Mapped[str] = mapped_column(String(100), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    total_cases: Mapped[int] = mapped_column(Integer)
    passed_cases: Mapped[int] = mapped_column(Integer)
    avg_score: Mapped[float] = mapped_column(Float)
    dimensions: Mapped[str] = mapped_column(Text)  # JSON
    details: Mapped[str] = mapped_column(Text)  # JSON
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
