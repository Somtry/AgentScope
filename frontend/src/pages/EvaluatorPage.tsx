import { useState, useMemo } from "react";
import { useEvalStore } from "../stores/evalStore";
import { useKeyboard } from "../hooks/useKeyboard";
import CaseList from "../components/eval/CaseList";
import CaseEditor from "../components/eval/CaseEditor";
import RunPanel from "../components/eval/RunPanel";
import ReportView from "../components/eval/ReportView";
import RadarChart from "../components/eval/RadarChart";

// Evaluator 主页面
function EvaluatorPage() {
  const { view, setView } = useEvalStore();
  const [showEditor, setShowEditor] = useState(false);

  // 键盘快捷键: n 新增用例, 1/2 切换视图
  const keyHandlers = useMemo(() => ({
    n: () => setShowEditor(true),
    "1": () => setView("run"),
    "2": () => setView("report"),
    Escape: () => setShowEditor(false),
  }), [setView]);
  useKeyboard(keyHandlers);

  return (
    <div style={{ display: "flex", height: "calc(100vh - 48px)", overflow: "hidden" }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <CaseList />
        <div style={{ padding: "8px", borderTop: "1px solid var(--border)", backgroundColor: "var(--bg-secondary)" }}>
          <button
            onClick={() => setShowEditor(true)}
            style={{
              width: "100%", padding: "6px 0", borderRadius: 4, border: "none",
              backgroundColor: "var(--accent)", color: "#fff", cursor: "pointer", fontSize: 12,
            }}
          >
            + 新增用例 (n)
          </button>
        </div>
        <div style={{ padding: "8px", borderTop: "1px solid var(--border)", backgroundColor: "var(--bg-secondary)", display: "flex", gap: 4 }}>
          {["run", "report"].map((v, i) => (
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
              {v === "run" ? "运行 (1)" : "报告 (2)"}
            </button>
          ))}
        </div>
      </div>

      {view === "run" ? <RunPanel /> : <ReportView />}
      <RadarChart />

      {showEditor && <CaseEditor onClose={() => setShowEditor(false)} />}
    </div>
  );
}

export default EvaluatorPage;
