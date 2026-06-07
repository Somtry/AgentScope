import { useState } from "react";
import { evalApi, EvalRule } from "../../api/evals";
import { useEvalStore } from "../../stores/evalStore";

interface Props {
  onClose: () => void;
}

// 用例编辑器弹窗
function CaseEditor({ onClose }: Props) {
  const { fetchCases } = useEvalStore();
  const [name, setName] = useState("");
  const [input, setInput] = useState("");
  const [expected, setExpected] = useState("");
  const [rules, setRules] = useState<EvalRule[]>([{ type: "contains", config: { keywords: [] }, weight: 1.0 }]);
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await evalApi.createCase({
        name, input,
        expected_output: expected || undefined,
        eval_rules: rules,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      });
      await fetchCases();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "6px 10px", fontSize: 13,
    backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)",
    border: "1px solid var(--border)", borderRadius: 4,
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ backgroundColor: "var(--bg-secondary)", borderRadius: 8, padding: 24, width: 500, maxHeight: "80vh", overflow: "auto" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>\u65b0\u589e\u7528\u4f8b</h3>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>\u540d\u79f0</label>
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="\u5929\u6c14\u67e5\u8be2" />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Input</label>
          <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" as const }} value={input} onChange={(e) => setInput(e.target.value)} placeholder="\u8f93\u5165\u5185\u5bb9" />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Expected Output (\u53ef\u9009)</label>
          <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" as const }} value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="\u671f\u671b\u8f93\u51fa" />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>\u8bc4\u5206\u89c4\u5219</label>
          {rules.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <select
                value={r.type}
                onChange={(e) => {
                  const next = [...rules];
                  next[i] = { ...next[i], type: e.target.value };
                  setRules(next);
                }}
                style={{ ...inputStyle, width: 120 }}
              >
                <option value="contains">contains</option>
                <option value="exact_match">exact_match</option>
                <option value="regex">regex</option>
              </select>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={JSON.stringify(r.config)}
                onChange={(e) => {
                  const next = [...rules];
                  try { next[i] = { ...next[i], config: JSON.parse(e.target.value) }; } catch {}
                  setRules(next);
                }}
                placeholder='{"keywords": ["hello"]}'
              />
              <input
                type="number"
                value={r.weight}
                onChange={(e) => {
                  const next = [...rules];
                  next[i] = { ...next[i], weight: parseFloat(e.target.value) || 1.0 };
                  setRules(next);
                }}
                style={{ ...inputStyle, width: 60 }}
              />
            </div>
          ))}
          <button
            onClick={() => setRules([...rules, { type: "contains", config: { keywords: [] }, weight: 1.0 }])}
            style={{ fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}
          >
            + \u6dfb\u52a0\u89c4\u5219
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>\u6807\u7b7e (\u9017\u53f7\u5206\u9694)</label>
          <input style={inputStyle} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="weather, tool_call" />
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "6px 16px", borderRadius: 4, border: "1px solid var(--border)", background: "none", color: "var(--text-primary)", cursor: "pointer", fontSize: 12 }}>\u53d6\u6d88</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: "6px 16px", borderRadius: 4, border: "none", backgroundColor: "var(--accent)", color: "#fff", cursor: "pointer", fontSize: 12 }}>{saving ? "..." : "\u4fdd\u5b58"}</button>
        </div>
      </div>
    </div>
  );
}

export default CaseEditor;
