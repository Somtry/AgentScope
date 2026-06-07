import { useEvalStore } from "../../stores/evalStore";

// 评测报告视图
function ReportView() {
  const { report, results } = useEvalStore();

  if (!report) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontSize: 14 }}>
        左侧选择用例并运行评测
      </div>
    );
  }

  const passRate = report.total_cases > 0 ? ((report.passed_cases / report.total_cases) * 100).toFixed(0) : "0";

  const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8,
    padding: "12px 16px", textAlign: "center",
  };

  return (
    <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>评测报告</h2>

      {/* 总览卡片 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>通过率</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#22c55e" }}>{passRate}%</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>平均分</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{(report.avg_score * 100).toFixed(0)}%</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>用例数</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{report.total_cases}</div>
        </div>
      </div>

      {/* 详细结果表格 */}
      <div style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)" }}>用例</th>
              <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)" }}>输出</th>
              <th style={{ padding: "8px 12px", textAlign: "right", color: "var(--text-secondary)" }}>分数</th>
              <th style={{ padding: "8px 12px", textAlign: "center", color: "var(--text-secondary)" }}>结果</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.case_id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 12px" }}>{r.case_name}</td>
                <td style={{ padding: "8px 12px", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.output}</td>
                <td style={{ padding: "8px 12px", textAlign: "right" }}>{(r.score * 100).toFixed(0)}%</td>
                <td style={{ padding: "8px 12px", textAlign: "center" }}>
                  <span style={{ color: r.passed ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                    {r.passed ? "PASS" : "FAIL"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ReportView;
