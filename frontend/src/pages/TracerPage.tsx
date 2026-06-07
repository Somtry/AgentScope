import { useMemo } from "react";
import { useTraceStore } from "../stores/traceStore";
import { useKeyboard } from "../hooks/useKeyboard";
import TraceList from "../components/tracer/TraceList";
import Timeline from "../components/tracer/Timeline";
import StepDetail from "../components/tracer/StepDetail";

// Tracer 主页面：TraceList + Timeline + StepDetail
function TracerPage() {
  const { selectedTrace, selectedStepIndex, selectStep } = useTraceStore();
  const steps = selectedTrace?.steps || [];

  // 键盘快捷键: j/k 上下导航步骤
  const keyHandlers = useMemo(() => ({
    j: () => {
      if (selectedStepIndex < steps.length - 1) selectStep(selectedStepIndex + 1);
    },
    k: () => {
      if (selectedStepIndex > 0) selectStep(selectedStepIndex - 1);
    },
  }), [selectedStepIndex, steps.length, selectStep]);
  useKeyboard(keyHandlers);

  return (
    <div style={{ display: "flex", height: "calc(100vh - 48px)", overflow: "hidden" }}>
      <TraceList />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Timeline />
        <StepDetail />
      </div>
    </div>
  );
}

export default TracerPage;
