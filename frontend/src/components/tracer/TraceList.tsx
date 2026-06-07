import { useEffect } from "react";
import { useTraceStore } from "../../stores/traceStore";

// 状态标签颜色
const statusColors: Record<string, string> = {
  running: "#3b82f6",
  completed: "#22c55e",
  failed: "#ef4444",
};

function TraceList() {
  const { traces, selectedTrace, isLoading, fetchTraces, selectTrace } = useTraceStore();

  useEffect(() => {
    fetchTraces();
  }, [fetchTraces]);

  return (
    <div
      style={{
        width: 240,
        minWidth: 240,
        backgroundColor: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* 标题 */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        Traces {traces.length > 0 && `(${traces.length})`}
        {isLoading && " ..."}
      </div>

      {/* 列表 */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {traces.length === 0 && !isLoading && (
          <div style={{ padding: 16, color: "var(--text-secondary)", fontSize: 13 }}>
            暂无 trace 数据
          </div>
        )}
        {traces.map((trace) => (
          <div
            key={trace.id}
            onClick={() => selectTrace(trace.id)}
            style={{
              padding: "10px 16px",
              cursor: "pointer",
              backgroundColor:
                selectedTrace?.id === trace.id ? "var(--bg-tertiary)" : "transparent",
              borderBottom: "1px solid var(--border)",
              transition: "background-color 0.1s",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              {trace.agent_id}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 6px",
                  borderRadius: 4,
                  backgroundColor: statusColors[trace.status] || "#969696",
                  color: "#fff",
                }}
              >
                {trace.status}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                {new Date(trace.created_at).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 刷新按钮 */}
      <div
        style={{
          padding: "8px 16px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <button
          onClick={fetchTraces}
          style={{
            width: "100%",
            padding: "6px 0",
            backgroundColor: "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          刷新
        </button>
      </div>
    </div>
  );
}

export default TraceList;
