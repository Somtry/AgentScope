import { useEffect, useRef } from "react";
import { useTraceStore } from "../../stores/traceStore";
import StepNode from "./StepNode";

// 时间线容器，渲染所有步骤节点
function Timeline() {
  const { selectedTrace, selectedStepIndex, selectStep, isPlaying, playSpeed } = useTraceStore();
  const stepsEndRef = useRef<HTMLDivElement>(null);

  // 回放逻辑：纯前端定时器
  useEffect(() => {
    if (!isPlaying || !selectedTrace?.steps) return;
    const steps = selectedTrace.steps;
    const interval = setInterval(() => {
      const store = useTraceStore.getState();
      const next = store.selectedStepIndex + 1;
      if (next >= steps.length) {
        store.pause();
      } else {
        store.selectStep(next);
      }
    }, playSpeed);
    return () => clearInterval(interval);
  }, [isPlaying, playSpeed, selectedTrace]);

  // 自动滚动到当前步骤
  useEffect(() => {
    if (selectedStepIndex >= 0) {
      const el = document.getElementById(`step-${selectedStepIndex}`);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedStepIndex]);

  if (!selectedTrace) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-secondary)",
          fontSize: 14,
        }}
      >
        左侧选择一个 trace 查看时间线
      </div>
    );
  }

  const steps = selectedTrace.steps || [];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* 回放控制栏 */}
      <div
        style={{
          padding: "8px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          backgroundColor: "var(--bg-secondary)",
        }}
      >
        <button
          onClick={() => (isPlaying ? useTraceStore.getState().pause() : useTraceStore.getState().play())}
          style={{
            padding: "4px 12px",
            backgroundColor: "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          {isPlaying ? "⏸ 暂停" : "▶ 播放"}
        </button>

        {/* 速度选择 */}
        <div style={{ display: "flex", gap: 4 }}>
          {[2000, 1000, 500].map((speed) => (
            <button
              key={speed}
              onClick={() => useTraceStore.getState().setPlaySpeed(speed)}
              style={{
                padding: "2px 8px",
                backgroundColor: playSpeed === speed ? "var(--accent)" : "var(--bg-tertiary)",
                color: playSpeed === speed ? "#fff" : "var(--text-primary)",
                border: "none",
                borderRadius: 3,
                cursor: "pointer",
                fontSize: 11,
              }}
            >
              {speed === 2000 ? "0.5x" : speed === 1000 ? "1x" : "2x"}
            </button>
          ))}
        </div>

        {/* 进度 */}
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          {selectedStepIndex >= 0 ? selectedStepIndex + 1 : "-"} / {steps.length}
        </span>

        {/* 轨迩信息 */}
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-secondary)" }}>
          {selectedTrace.agent_id}
        </span>
      </div>

      {/* 步骤列表 */}
      <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
        {steps.length === 0 ? (
          <div style={{ padding: 16, color: "var(--text-secondary)", textAlign: "center" }}>
            无步骤数据
          </div>
        ) : (
          steps.map((step, index) => (
            <div key={step.id} id={`step-${index}`}>
              <StepNode
                step={step}
                isSelected={selectedStepIndex === index}
                onClick={() => selectStep(index)}
              />
            </div>
          ))
        )}
        <div ref={stepsEndRef} />
      </div>
    </div>
  );
}

export default Timeline;
