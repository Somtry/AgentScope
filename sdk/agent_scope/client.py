import httpx


class TracerClient:
    """AgentScope 追踪客户端，负责与后端 API 交互"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url.rstrip("/")
        self._http = httpx.Client(timeout=10.0)

    def _url(self, path: str) -> str:
        return f"{self.base_url}/api/v1{path}"

    def start_trace(
        self,
        agent_id: str,
        session_id: str | None = None,
        metadata: dict | None = None,
    ) -> "ActiveTrace":
        """创建并返回一个活跃的 trace"""
        resp = self._http.post(
            self._url("/traces"),
            json={"agent_id": agent_id, "session_id": session_id, "metadata": metadata},
        )
        resp.raise_for_status()
        return ActiveTrace(self, resp.json()["id"])


class ActiveTrace:
    """活跃的 trace，支持缓冲区批量提交步骤"""

    def __init__(self, client: TracerClient, trace_id: str):
        self.client = client
        self.id = trace_id
        self._buffer: list[dict] = []
        self._flush_threshold = 10

    def add_step(self, type: str, content: str | None = None, **kwargs) -> None:
        """添加步骤到缓冲区，达到阈值自动刷新"""
        step = {"type": type, "content": content}
        step.update(kwargs)
        self._buffer.append(step)
        if len(self._buffer) >= self._flush_threshold:
            self.flush()

    def flush(self) -> None:
        """批量提交缓冲区中的步骤"""
        if not self._buffer:
            return
        resp = self.client._http.post(
            self.client._url(f"/traces/{self.id}/steps"),
            json={"steps": list(self._buffer)},
        )
        resp.raise_for_status()
        self._buffer.clear()

    def complete(self) -> None:
        """完成 trace（先刷缓冲区）"""
        self.flush()
        resp = self.client._http.post(
            self.client._url(f"/traces/{self.id}/complete"),
        )
        resp.raise_for_status()
