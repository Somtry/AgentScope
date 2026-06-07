import { motion } from "framer-motion";
import type { Step } from "../../api/traces";

// 步骤类型颜色映射
const stepColors: Record<string, string> = {
  input: "#3b82f6",
  thinking: "#8b5cf6",
  tool_call: "#f59e0b",
  tool_result: "#eab308",
  output: "#22c55e",
  error: "#ef4444",
};

// 步骤类型图标
const stepIcons: Record<string, string> = {
  input: "▶",
  thinking: "○",
  tool_call: "⚙",
  tool_result: "✓",
  output: "■",
  error: "✗",
};

interface Props {
  step: Step;
  isSelected: boolean;
  onClick: () => void;
}

function StepNode({ step, isSelected, onClick }: Props) {
  const color = stepColors[step.type] || "#969696";
  const icon = stepIcons[step.type] || "•";
  const summary = step.content ? step.content.slice(0, 80) : "";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "10px 12px",
        cursor: "pointer",
        backgroundColor: isSelected ? "var(--bg-tertiary)" : "transparent",
        borderLeft: `3px solid ${color}`,
        marginBottom: 2,
        transition: "background-color 0.1s",
      }}
    >
      {/* 类型图标 */}
      <span
        style={{
          color,
          fontSize: 14,
          fontWeight: 700,
          minWidth: 20,
          textAlign: "center",
        }}
      >
        {icon}
      </span>

      {/* 内容 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color, fontWeight: 600, marginBottom: 2 }}>
          {step.type}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-primary)", wordBreak: "break-all" }}>
          {summary}{step.content && step.content.length > 80 ? "..." : ""}
        </div>
      </div>

      {/* 元数据 */}
      <div style={{ fontSize: 11, color: "var(--text-secondary)", textAlign: "right", whiteSpace: "nowrap" }}>
        {step.duration_ms != null && <div>{step.duration_ms}ms</div>}
        {step.token_count != null && <div>{step.token_count} tok</div>}
      </div>
    </motion.div>
  );
}

export default StepNode;
