from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用全局配置，优先读取环境变量（前缀 AS_）"""
    app_name: str = "AgentScope"
    debug: bool = True
    database_url: str = "sqlite+aiosqlite:///./agentscope.db"
    cors_origins: list[str] = ["http://localhost:5173"]

    class Config:
        env_prefix = "AS_"


settings = Settings()
