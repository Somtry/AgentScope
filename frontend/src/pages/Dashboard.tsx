import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";

// 首页仪表盘
function Dashboard() {
  const [health, setHealth] = useState<string>("checking...");
  const [lastCheck, setLastCheck] = useState<string>("");

  const checkHealth = useCallback(() => {
    api
      .get<{ status: string; version: string }>("/health")
      .then((res) => {
        setHealth(`${res.status} (v${res.version})`);
        setLastCheck(new Date().toLocaleTimeString());
      })
      .catch(() => {
        setHealth("unreachable");
        setLastCheck(new Date().toLocaleTimeString());
      });
  }, []);

  useEffect(() => {
    checkHealth();
    const timer = setInterval(checkHealth, 10000);
    return () => clearInterval(timer);
  }, [checkHealth]);

  const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--bg-secondary)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: 20,
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
        AgentScope
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 32 }}>
        <div style={cardStyle}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>
            Backend Status
          </p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: health.includes("ok") ? "#22c55e" : "#ef4444" }}>
            {health}
          </p>
          {lastCheck && (
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--text-secondary)" }}>
              上次检查: {lastCheck}
            </p>
          )}
        </div>
        <div style={cardStyle}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>
            Version
          </p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            v0.1.0 MVP
          </p>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>快速入门</h2>
        <div style={{ fontSize: 13, lineHeight: 1.8, color: "var(--text-primary)" }}>
          <p style={{ margin: "0 0 12px" }}>
            <strong>1. 追踪 Agent 执行</strong> — 启动后端后运行 SDK demo：
          </p>
          <pre style={{ backgroundColor: "var(--bg-tertiary)", padding: "8px 12px", borderRadius: 4, fontSize: 12, marginBottom: 12 }}>
            {"cd backend && uv run uvicorn app.main:app --port 8000\nuv run python examples/demo_tracer.py"}
          </pre>
          <p style={{ margin: "0 0 12px" }}>
            <strong>2. 查看时间线</strong> — 打开 Tracer 页面查看执行链路，支持回放。
          </p>
          <p style={{ margin: "0 0 12px" }}>
            <strong>3. 评测 Agent</strong> — 打开 Evaluator 页面创建用例并运行评测。
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", marginTop: 16 }}>
            键盘快捷键: j/k 导航步骤 · n 新增用例 · 1/2 切换视图
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
