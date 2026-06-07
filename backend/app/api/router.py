from fastapi import APIRouter
from .traces import router as traces_router
from .evals import router as evals_router

router = APIRouter()
# 注册 Trace 路由
router.include_router(traces_router, prefix="/traces", tags=["traces"])
# 注册 Evaluator 路由
router.include_router(evals_router, prefix="/evals", tags=["evals"])
