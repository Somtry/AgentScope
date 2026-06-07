import { useState } from "react";
import { useTraceStore } from "../../stores/traceStore";

// 详情 Tab 类型
type Tab = "content" | "metadata" | "raw";

function StepDetail() {
  const { selectedTrace, selectedStepIndex } = useTraceStore();
  const [activeTab, setActiveTab] = useState<Tab>("content");

  const steps = selectedTrace?.steps || [];
  const step = selectedStepIndex >= 0 ? steps[selectedStepIndex] : null;

  if (!step) {
    return (
      <div
        style={{
          height: 200,
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-secondary)",
          fontSize: 13,
          backgroundColor: "var(--bg-secondary)",
        }}
      >
        点击步骤查看详情
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "content", label: "内容" },
    { key: "metadata", label: "元数据" },
    { key: "raw", label: "原始数据" },
  ];

  return (
    <div
      style={{
        height: 200,
        borderTop: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--bg-secondary)",
      }}
    >
      {/* Tab 栏 */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          padding: "0 12px",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "8px 16px",
              border: "none",
              borderBottom: activeTab === tab.key ? "2px solid var(--accent)" : "2px solid transparent",
              backgroundColor: "transparent",
              color: activeTab === tab.key ? "var(--accent)" : "var(--text-secondary)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: activeTab === tab.key ? 600 : 400,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>
        {activeTab === "content" && (
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 13, color: "var(--text-primary)" }}>
            {step.content || "（无内容）"}
          </pre>
        )}
        {activeTab === "metadata" && (
          <div style={{ fontSize: 13, display: "grid", gridTemplateColumns: "120px 1fr", gap: "6px 12px" }}>
            <span style={{ color: "var(--text-secondary)" }}>type</span><span>{step.type}</span>
            <span style={{ color: "var(--text-secondary)" }}>seq</span><span>{step.seq}</span>
            <span style={{ color: "var(--text-secondary)" }}>duration_ms</span><span>{step.duration_ms ?? "-"}</span>
            <span style={{ color: "var(--text-secondary)" }}>token_count</span><span>{step.token_count ?? "-"}</span>
            <span style={{ color: "var(--text-secondary)" }}>model</span><span>{step.model ?? "-"}</span>
            <span style={{ color: "var(--text-secondary)" }}>tool_name</span><span>{step.tool_name ?? "-"}</span>
          </div>
        )}
        {activeTab === "raw" && (
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              fontSize: 12,
              color: "var(--text-secondary)",
              fontFamily: "Consolas, monospace",
            }}
          >
            {JSON.stringify(step, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

export default StepDetail;
