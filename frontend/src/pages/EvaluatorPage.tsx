import { useState } from "react";
import { useEvalStore } from "../stores/evalStore";
import CaseList from "../components/eval/CaseList";
import CaseEditor from "../components/eval/CaseEditor";
import RunPanel from "../components/eval/RunPanel";
import ReportView from "../components/eval/ReportView";
import RadarChart from "../components/eval/RadarChart";

// Evaluator 主页面：CaseList + RunPanel/ReportView + RadarChart
function EvaluatorPage() {
  const { view, setView } = useEvalStore();
  const [showEditor, setShowEditor] = useState(false);

  return (
    <div style={{ display: "flex", height: "calc(100vh - 48px)", overflow: "hidden" }}>
      {/* 左侧用例列表 */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <CaseList />
        {/* 新增按钮 */}
        <div style={{ padding: "8px", borderTop: "1px solid var(--border)", backgroundColor: "var(--bg-secondary)" }}>
          <button
            onClick={() => setShowEditor(true)}
            style={{
              width: "100%", padding: "6px 0", borderRadius: 4, border: "none",
              backgroundColor: "var(--accent)", color: "#fff", cursor: "pointer", fontSize: 12,
            }}
          >
            + 新增用例
          </button>
        </div>
        {/* 视图切换 */}
        <div style={{ padding: "8px", borderTop: "1px solid var(--border)", backgroundColor: "var(--bg-secondary)", display: "flex", gap: 4 }}>
          {["run", "report"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v as "run" | "report")}
              style={{
                flex: 1, padding: "4px 0", borderRadius: 3, border: "none", cursor: "pointer",
                backgroundColor: view === v ? "var(--bg-tertiary)" : "transparent",
                color: view === v ? "var(--text-primary)" : "var(--text-secondary)",
                fontSize: 11,
              }}
            >
              {v === "run" ? "\u8fd0\u884c" : "\u62a5\u544a"}
            </button>
          ))}
        </div>
      </div>

      {/* 主内\u5bb9 */}
      {view === "run" ? <RunPanel /> : <ReportView />}

      {/* 右\u4fa7\u96f7\u8fbe\u56fe */}
      <RadarChart />

      {/* 编\u8f91\u5668\u5f39\u7a97 */}
      {showEditor && <CaseEditor onClose={() => setShowEditor(false)} />}
    </div>
  );
}

export default EvaluatorPage;
