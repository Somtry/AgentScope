import functools
import time
import asyncio


def trace(agent_id: str | None = None, client=None):
    """装饰器：自动追踪函数执行过程

    用法：
        @trace(agent_id="my_agent")
        def run(input_text):
            return "output"

        @trace(agent_id="my_agent")
        async def run(input_text):
            return "output"
    """

    def decorator(func):
        _agent_id = agent_id or func.__name__

        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            from . import TracerClient
            _client = client or TracerClient()
            active = _client.start_trace(_agent_id)
            active.add_step("input", content=str(args[0]) if args else str(kwargs))
            start = time.time()
            try:
                result = func(*args, **kwargs)
                elapsed = int((time.time() - start) * 1000)
                active.add_step("output", content=str(result), duration_ms=elapsed)
                active.complete()
                return result
            except Exception as e:
                elapsed = int((time.time() - start) * 1000)
                active.add_step("error", content=f"{type(e).__name__}: {e}", duration_ms=elapsed)
                active.complete()
                raise

        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            from . import TracerClient
            _client = client or TracerClient()
            active = _client.start_trace(_agent_id)
            active.add_step("input", content=str(args[0]) if args else str(kwargs))
            start = time.time()
            try:
                result = await func(*args, **kwargs)
                elapsed = int((time.time() - start) * 1000)
                active.add_step("output", content=str(result), duration_ms=elapsed)
                active.complete()
                return result
            except Exception as e:
                elapsed = int((time.time() - start) * 1000)
                active.add_step("error", content=f"{type(e).__name__}: {e}", duration_ms=elapsed)
                active.complete()
                raise

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator
