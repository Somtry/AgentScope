"""
SDK 装饰器模式 Demo
用法: 先启动后端，然后运行此脚本
    cd backend && uv run uvicorn app.main:app --port 8000
    uv run python examples/demo_tracer.py
"""
import sys
import os

# 将 sdk 目录加入 Python 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "sdk"))

from agent_scope import trace


@trace(agent_id="demo_weather_agent")
def ask_weather(city: str) -> str:
    """模拟天气查询 agent"""
    # 这里是 agent 的实际逻辑
    return f"{city}今天晴朗，气温28°C，湿度45%"


if __name__ == "__main__":
    result = ask_weather("北京")
    print(f"Result: {result}")
    print("\nTrace 已自动记录，打开 http://localhost:5173/tracer 查看")
