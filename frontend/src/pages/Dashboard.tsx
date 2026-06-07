import { useEffect, useState } from "react";
import { api } from "../api/client";

// 首页仪表盘
function Dashboard() {
  const [health, setHealth] = useState<string>("checking...");

  useEffect(() => {
    api
      .get<{ status: string; version: string }>("/health")
      .then((res) => setHealth(`${res.status} (v${res.version})`))
      .catch(() => setHealth("unreachable"));
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
        Dashboard
      </h1>
      <div
        style={{
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 20,
          display: "inline-block",
        }}
      >
        <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)" }}>
          Backend Status
        </p>
        <p style={{ margin: "8px 0 0", fontSize: 18, fontWeight: 600 }}>
          {health}
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
