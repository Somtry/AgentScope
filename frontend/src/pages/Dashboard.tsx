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
              \u4e0a\u6b21\u68c0\u67e5: {lastCheck}
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
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>\u5feb\u901f\u5165\u95e8</h2>
        <div style={{ fontSize: 13, lineHeight: 1.8, color: "var(--text-primary)" }}>
          <p style={{ margin: "0 0 12px" }}>
            <strong>1. \u8ffd\u8e2a Agent \u6267\u884c</strong> \u2014 \u542f\u52a8\u540e\u7aef\u540e\u8fd0\u884c SDK demo\uff1a
          </p>
          <pre style={{ backgroundColor: "var(--bg-tertiary)", padding: "8px 12px", borderRadius: 4, fontSize: 12, marginBottom: 12 }}>
            {"cd backend && uv run uvicorn app.main:app --port 8000\nuv run python examples/demo_tracer.py"}
          </pre>
          <p style={{ margin: "0 0 12px" }}>
            <strong>2. \u67e5\u770b\u65f6\u95f4\u7ebf</strong> \u2014 \u6253\u5f00 Tracer \u9875\u9762\u67e5\u770b\u6267\u884c\u94fe\u8def\uff0c\u652f\u6301\u56de\u653e\u3002
          </p>
          <p style={{ margin: "0 0 12px" }}>
            <strong>3. \u8bc4\u6d4b Agent</strong> \u2014 \u6253\u5f00 Evaluator \u9875\u9762\u521b\u5efa\u7528\u4f8b\u5e76\u8fd0\u884c\u8bc4\u6d4b\u3002
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", marginTop: 16 }}>
            \u952e\u76d8\u5feb\u6377\u952e: j/k \u5bfc\u822a\u6b65\u9aa4 \u00b7 n \u65b0\u589e\u7528\u4f8b \u00b7 1/2 \u5207\u6362\u89c6\u56fe
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
