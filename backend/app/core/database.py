from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from .config import settings

# 异步数据库引擎
engine = create_async_engine(settings.database_url, echo=settings.debug)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    """ORM 模型基类，所有数据模型继承此类"""
    pass


async def get_db():
    """FastAPI 依赖注入：获取数据库会话"""
    async with async_session() as session:
        yield session


async def init_db():
    """启动时初始化数据库表结构"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
