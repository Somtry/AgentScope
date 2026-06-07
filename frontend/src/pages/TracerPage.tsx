import TraceList from "../components/tracer/TraceList";
import Timeline from "../components/tracer/Timeline";
import StepDetail from "../components/tracer/StepDetail";

// Tracer 主页面：TraceList + Timeline + StepDetail
function TracerPage() {
  return (
    <div style={{ display: "flex", height: "calc(100vh - 48px)", overflow: "hidden" }}>
      {/* 左侧 Trace 列表 */}
      <TraceList />

      {/* 中间 + 底部 */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* 时间线 */}
        <Timeline />
        {/* 详情面板 */}
        <StepDetail />
      </div>
    </div>
  );
}

export default TracerPage;
