import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from ..core.database import get_db
from ..models.trace import Trace
from ..models.step import Step
from ..schemas.trace import (
    TraceCreate, StepCreate, StepsBatchCreate,
    TraceResponse, TraceDetailResponse, StepResponse,
)

router = APIRouter()


@router.post("", response_model=TraceResponse)
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


@router.get("", response_model=list[TraceResponse])
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


@router.get("/{trace_id}", response_model=TraceDetailResponse)
async def get_trace(trace_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Trace).options(selectinload(Trace.steps)).where(Trace.id == trace_id)
    )
    trace = result.scalar_one_or_none()
    if not trace:
        raise HTTPException(status_code=404, detail="Trace not found")
    return trace


@router.post("/{trace_id}/steps", response_model=list[StepResponse])
async def add_steps(
    trace_id: str,
    data: StepsBatchCreate,
    db: AsyncSession = Depends(get_db),
):
    trace = await db.get(Trace, trace_id)
    if not trace:
        raise HTTPException(status_code=404, detail="Trace not found")

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


@router.post("/{trace_id}/complete", response_model=TraceResponse)
async def complete_trace(trace_id: str, db: AsyncSession = Depends(get_db)):
    trace = await db.get(Trace, trace_id)
    if not trace:
        raise HTTPException(status_code=404, detail="Trace not found")
    trace.status = "completed"
    trace.ended_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(trace)
    return trace
