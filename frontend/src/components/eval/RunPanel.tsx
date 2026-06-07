import { useState } from "react";
import { evalApi } from "../../api/evals";
import { useEvalStore } from "../../stores/evalStore";

// 运行配置面板
function RunPanel() {
  const { selectedCaseIds, setReport, setReports } = useEvalStore();
  const [agentId, setAgentId] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [arenaAgents, setArenaAgents] = useState({ agent_id: "", endpoint: "" });
  const [mode, setMode] = useState<"single" | "arena">("single");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const handleRun = async () => {
    if (selectedCaseIds.length === 0) { setError("\u8bf7先选择用例"); return; }
    if (!agentId || !endpoint) { setError("\u8bf7填写 Agent ID \u548c Endpoint"); return; }
    setRunning(true); setError("");
    try {
      if (mode === "single") {
        const r = await evalApi.runEval({ agent_id: agentId, agent_endpoint: endpoint, case_ids: selectedCaseIds });
        setReport(r);
      } else {
        const agents = [{ agent_id: agentId, endpoint }];
        if (arenaAgents.agent_id && arenaAgents.endpoint) agents.push(arenaAgents);
        const rs = await evalApi.compare({ agents, case_ids: selectedCaseIds });
        setReports(rs);
      }
    } catch (e) {
      setError(`\u8fd0行失败: ${e}`);
    } finally {
      setRunning(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "6px 10px", fontSize: 13,
    backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)",
    border: "1px solid var(--border)", borderRadius: 4,
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
        运行评测
      </h2>

      {/* 模式切换 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["single", "arena"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m as "single" | "arena")}
            style={{
              padding: "6px 16px", borderRadius: 4, border: "none", cursor: "pointer",
              backgroundColor: mode === m ? "var(--accent)" : "var(--bg-tertiary)",
              color: mode === m ? "#fff" : "var(--text-primary)",
              fontSize: 12,
            }}
          >
            {m === "single" ? "\u5355 Agent" : "Arena \u5bf9\u6bd4"}
          </button>
        ))}
      </div>

      {/* Agent \u914d\u7f6e */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Agent ID</label>
        <input style={inputStyle} value={agentId} onChange={(e) => setAgentId(e.target.value)} placeholder="my_agent" />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Endpoint</label>
        <input style={inputStyle} value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="http://localhost:3000/v1/chat" />
      </div>

      {mode === "arena" && (
        <div style={{ marginBottom: 12, padding: 12, backgroundColor: "var(--bg-tertiary)", borderRadius: 6 }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>对\u624b Agent</div>
          <input style={{ ...inputStyle, marginBottom: 6 }} value={arenaAgents.agent_id} onChange={(e) => setArenaAgents({ ...arenaAgents, agent_id: e.target.value })} placeholder="opponent_agent" />
          <input style={inputStyle} value={arenaAgents.endpoint} onChange={(e) => setArenaAgents({ ...arenaAgents, endpoint: e.target.value })} placeholder="http://localhost:3001/v1/chat" />
        </div>
      )}

      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>
        \u5df2\u9009 {selectedCaseIds.length} \u6761\u7528\u4f8b
      </div>

      {error && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 8 }}>{error}</div>}

      <button
        onClick={handleRun}
        disabled={running}
        style={{
          width: "100%", padding: "8px 0", borderRadius: 4, border: "none", cursor: "pointer",
          backgroundColor: running ? "var(--bg-tertiary)" : "var(--accent)",
          color: "#fff", fontSize: 13, fontWeight: 600,
        }}
      >
        {running ? "\u8fd0\u884c\u4e2d..." : "\u5f00\u59cb\u8bc4\u6d4b"}
      </button>
    </div>
  );
}

export default RunPanel;
