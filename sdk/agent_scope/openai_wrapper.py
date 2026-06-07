import time
from .client import TracerClient


class TracedCompletions:
    """包装 chat.completions，自动记录每次调用"""

    def __init__(self, original_completions, active_trace):
        self._original = original_completions
        self._trace = active_trace

    def create(self, **kwargs):
        messages = kwargs.get("messages", [])
        model = kwargs.get("model", "unknown")
        input_text = str(messages[-1].get("content", "")) if messages else ""
        self._trace.add_step("input", content=input_text, model=model)

        start = time.time()
        try:
            response = self._original.create(**kwargs)
            elapsed = int((time.time() - start) * 1000)
            output = response.choices[0].message.content if response.choices else ""
            tokens = response.usage.total_tokens if response.usage else None
            self._trace.add_step(
                "output", content=output, duration_ms=elapsed, token_count=tokens, model=model,
            )
            return response
        except Exception as e:
            elapsed = int((time.time() - start) * 1000)
            self._trace.add_step("error", content=str(e), duration_ms=elapsed)
            raise


class TracedChat:
    def __init__(self, original_chat, active_trace):
        self.completions = TracedCompletions(original_chat.completions, active_trace)


class TracedOpenAI:
    """OpenAI SDK 包装，换一行 import 即可自动追踪

    用法：
        from agent_scope.openai_wrapper import TracedOpenAI as OpenAI
        client = OpenAI(api_key="sk-xxx")
        # 其余代码不变
    """

    def __init__(self, base_url: str = "http://localhost:8000", **kwargs):
        from openai import OpenAI as RealOpenAI
        self._real = RealOpenAI(**kwargs)
        self._client = TracerClient(base_url)
        self._active_trace = self._client.start_trace("openai_agent")

    @property
    def chat(self):
        return TracedChat(self._real.chat, self._active_trace)

    def complete_trace(self):
        """手动完成 trace"""
        self._active_trace.complete()
