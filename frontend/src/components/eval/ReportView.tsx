import { useEvalStore } from "../../stores/evalStore";

// 评\u6d4b\u62a5\u544a\u89c6\u56fe
function ReportView() {
  const { report, results } = useEvalStore();

  if (!report) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontSize: 14 }}>
        \u5de6\u4fa7\u9009\u62e9\u7528\u4f8b\u5e76\u8fd0\u884c\u8bc4\u6d4b
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
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>\u8bc4\u6d4b\u62a5\u544a</h2>

      {/* \u603b\u89c8\u5361\u7247 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>\u901a\u8fc7\u7387</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#22c55e" }}>{passRate}%</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>\u5e73\u5747\u5206</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{(report.avg_score * 100).toFixed(0)}%</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>\u7528\u4f8b\u6570</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{report.total_cases}</div>
        </div>
      </div>

      {/* \u8be6\u7ec6\u7ed3\u679c\u8868\u683c */}
      <div style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)" }}>\u7528\u4f8b</th>
              <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)" }}>\u8f93\u51fa</th>
              <th style={{ padding: "8px 12px", textAlign: "right", color: "var(--text-secondary)" }}>\u5206\u6570</th>
              <th style={{ padding: "8px 12px", textAlign: "center", color: "var(--text-secondary)" }}>\u7ed3\u679c</th>
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
