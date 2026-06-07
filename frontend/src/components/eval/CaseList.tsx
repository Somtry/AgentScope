import { useEffect } from "react";
import { useEvalStore } from "../../stores/evalStore";
import { evalApi } from "../../api/evals";

function CaseList() {
  const { cases, selectedCaseIds, isLoading, fetchCases, toggleCase } = useEvalStore();

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("\u786e\u5b9a\u5220\u9664\u8fd9\u4e2a\u7528\u4f8b\uff1f")) return;
    await evalApi.deleteCase(id);
    fetchCases();
  };

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
        \u7528\u4f8b ({cases.length})
        {isLoading && " ..."}
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {cases.length === 0 && !isLoading && (
          <div style={{ padding: 16, color: "var(--text-secondary)", fontSize: 13 }}>
            \u6682\u65e0\u7528\u4f8b
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
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    {rules.length} \u89c4\u5219
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, c.id)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--text-secondary)", fontSize: 14, padding: "0 2px", lineHeight: 1,
                    }}
                    title="\u5220\u9664"
                  >
                    \u00d7
                  </button>
                </div>
              </div>
              {tags.length > 0 && (
                <div style={{ marginTop: 4, display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: 10, padding: "1px 6px", borderRadius: 3,
                        backgroundColor: "var(--accent)", color: "#fff",
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
