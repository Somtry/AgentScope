import ReactECharts from "echarts-for-react";
import { useEvalStore } from "../../stores/evalStore";

// 能力雷达图
function RadarChart() {
  const { reports, dimensions } = useEvalStore();

  const dimKeys = ["accuracy", "relevance", "efficiency", "safety"];
  const dimLabels: Record<string, string> = {
    accuracy: "\u51c6\u786e\u6027",
    relevance: "\u76f8\u5173\u6027",
    efficiency: "\u6548\u7387",
    safety: "\u5b89\u5168\u6027",
  };

  // 雷\u8fbe指\u793a\u5668配置
  const indicator = dimKeys.map((k) => ({
    name: dimLabels[k],
    max: 1,
  }));

  // 单 agent 或 Arena 模式
  const seriesData = reports.length > 1
    ? reports.map((r) => {
        const d = JSON.parse(r.dimensions);
        return { name: r.agent_id, value: dimKeys.map((k) => d[k] || 0) };
      })
    : [{ name: "\u80fd\u529b\u7ef4\u5ea6", value: dimKeys.map((k) => dimensions[k] || 0) }];

  const colors = ["#007acc", "#f59e0b", "#22c55e", "#ef4444"];

  const option = {
    color: colors,
    radar: {
      indicator,
      shape: "polygon",
      splitNumber: 4,
      axisName: { color: "#cccccc", fontSize: 12 },
      splitLine: { lineStyle: { color: "#3e3e3e" } },
      splitArea: { areaStyle: { color: ["#1e1e1e", "#252526"] } },
      axisLine: { lineStyle: { color: "#3e3e3e" } },
    },
    series: [
      {
        type: "radar",
        data: seriesData.map((d, i) => ({
          ...d,
          areaStyle: { opacity: 0.15 },
          lineStyle: { width: 2 },
          symbol: "circle",
          symbolSize: 6,
        })),
      },
    ],
    legend: reports.length > 1 ? { bottom: 0, textStyle: { color: "#cccccc" } } : undefined,
  };

  return (
    <div style={{ width: 300, minWidth: 300, padding: 16, borderLeft: "1px solid var(--border)" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        \u80fd\u529b\u7ef4\u5ea6
      </div>
      <ReactECharts option={option} style={{ height: 280 }} />
    </div>
  );
}

export default RadarChart;
