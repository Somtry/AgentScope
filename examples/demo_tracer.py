"""
演示 Agent 脚本，模拟一个天气查询 agent 的执行过程
用法: uv run python demo_tracer.py
"""
import asyncio
import httpx

API_BASE = "http://localhost:8000/api/v1"


async def run_demo():
    async with httpx.AsyncClient() as client:
        # 创建 trace
        resp = await client.post(
            f"{API_BASE}/traces",
            json={"agent_id": "demo_weather_agent"},
        )
        trace_id = resp.json()["id"]
        print(f"创建 trace: {trace_id}")

        # 模拟 agent 执行过程
        steps = [
            {"type": "input", "content": "帮我查一下北京的天气"},
            {"type": "thinking", "content": "用户想查天气，需要调用天气API获取北京的天气信息", "duration_ms": 120, "token_count": 45, "model": "gpt-4"},
            {"type": "tool_call", "content": "调用 get_weather 工具", "tool_name": "get_weather", "tool_params": {"city": "北京"}},
            {"type": "tool_result", "content": "获取到天气数据", "tool_name": "get_weather", "tool_result": {"temp": 28, "weather": "晴", "humidity": 45}, "duration_ms": 350},
            {"type": "thinking", "content": "已获取天气数据，现在生成回复", "duration_ms": 80, "token_count": 30, "model": "gpt-4"},
            {"type": "output", "content": "北京今天天气晴朗，气温28°C，湿度45%，适合出行！", "duration_ms": 60, "token_count": 52, "model": "gpt-4"},
        ]

        # 批量提交步骤
        resp = await client.post(
            f"{API_BASE}/traces/{trace_id}/steps",
            json={"steps": steps},
        )
        print(f"添加 {len(resp.json())} 个步骤")

        # 完成 trace
        await client.post(f"{API_BASE}/traces/{trace_id}/complete", json={})
        print(f"Trace 完成: {trace_id}")
        print(f"\n打开 http://localhost:5173/tracer 查看时间线")


if __name__ == "__main__":
    asyncio.run(run_demo())
