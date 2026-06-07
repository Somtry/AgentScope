import json
from fastapi import APIRouter, Depends, HTTPException
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
    """创建评测用例"""
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
    """查询所有评测用例"""
    result = await db.execute(select(EvalCase).order_by(EvalCase.created_at.desc()))
    return result.scalars().all()


@router.post("/run", response_model=EvalReportResponse)
async def run_eval(data: EvalRunRequest, db: AsyncSession = Depends(get_db)):
    """运行单 agent 评测"""
    cases = []
    for cid in data.case_ids:
        c = await db.get(EvalCase, cid)
        if c:
            cases.append(c)

    if not cases:
        raise HTTPException(status_code=400, detail="No valid cases found")

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
    """查询评测报告"""
    report = await db.get(EvalReport, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report
