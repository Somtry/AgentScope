from fastapi import APIRouter
from .traces import router as traces_router

router = APIRouter()
# 注册 Trace 路由
router.include_router(traces_router, prefix="/traces", tags=["traces"])
