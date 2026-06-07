from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import init_db
from .api.router import router

app = FastAPI(title=settings.app_name, version="0.1.0")

# CORS 中间件，允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册 API 路由
app.include_router(router, prefix="/api/v1")


@app.on_event("startup")
async def startup():
    """应用启动时初始化数据库"""
    await init_db()


@app.get("/api/v1/health")
async def health_check():
    """健康检查端点"""
    return {"status": "ok", "version": "0.1.0"}
