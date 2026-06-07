import { useEffect } from "react";
import { useEvalStore } from "../../stores/evalStore";

// 左侧评测用例列表
function CaseList() {
  const { cases, selectedCaseIds, isLoading, fetchCases, toggleCase } = useEvalStore();

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

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
        用例 ({cases.length})
        {isLoading && " ..."}
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {cases.length === 0 && !isLoading && (
          <div style={{ padding: 16, color: "var(--text-secondary)", fontSize: 13 }}>
            暂无用例，点击下方新增
          </div>
        )}
        {cases.map((c) => {
          const tags: string[] = c.tags ? JSON.parse(c.tags) : [];
          const rules: unknown[] = JSON.parse(c.eval_rules);
          const isSelected = selectedCaseIds.includes(c.id);
          return (
            <div
              key={c.id}
              onClick={() => toggleCase(c.id)}
              style={{
                padding: "10px 16px",
                cursor: "pointer",
                backgroundColor: isSelected ? "var(--bg-tertiary)" : "transparent",
                borderBottom: "1px solid var(--border)",
                transition: "background-color 0.1s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {isSelected && "\u2713 "}{c.name}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                  {rules.length} 规则
                </span>
              </div>
              {tags.length > 0 && (
                <div style={{ marginTop: 4, display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: 10,
                        padding: "1px 6px",
                        borderRadius: 3,
                        backgroundColor: "var(--accent)",
                        color: "#fff",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CaseList;
