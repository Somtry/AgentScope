import ReactECharts from "echarts-for-react";
import { useEvalStore } from "../../stores/evalStore";

// 能力雷达图
function RadarChart() {
  const { reports, dimensions } = useEvalStore();

  const dimKeys = ["accuracy", "relevance", "efficiency", "safety"];
  const dimLabels: Record<string, string> = {
    accuracy: "准确性",
    relevance: "相关性",
    efficiency: "效率",
    safety: "安全性",
  };

  const indicator = dimKeys.map((k) => ({
    name: dimLabels[k],
    max: 1,
  }));

  const seriesData = reports.length > 1
    ? reports.map((r) => {
        const d = JSON.parse(r.dimensions);
        return { name: r.agent_id, value: dimKeys.map((k) => d[k] || 0) };
      })
    : [{ name: "能力维度", value: dimKeys.map((k) => dimensions[k] || 0) }];

  const colors = ["#007acc", "#f59e0b", "#22c55e", "#ef4444"];

  const option = {
    color: colors,
    grid: { containLabel: true },
    radar: {
      indicator,
      shape: "polygon",
      splitNumber: 4,
      center: ["50%", "55%"],
      radius: "55%",
      nameGap: 15,
      axisName: {
        color: "#cccccc",
        fontSize: 13,
      },
      splitLine: { lineStyle: { color: "#3e3e3e" } },
      splitArea: { areaStyle: { color: ["#1e1e1e", "#252526"] } },
      axisLine: { lineStyle: { color: "#3e3e3e" } },
    },
    series: [
      {
        type: "radar",
        data: seriesData.map((d) => ({
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
    <div style={{ width: 380, minWidth: 380, padding: "16px 24px", borderLeft: "1px solid var(--border)", boxSizing: "border-box" as const }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        能力维度
      </div>
      <ReactECharts option={option} style={{ height: 340 }} />
    </div>
  );
}

export default RadarChart;
