import { create } from "zustand";
import { evalApi, EvalCase, EvalReport, EvalResult } from "../api/evals";

// 评测状态管理
interface EvalState {
  cases: EvalCase[];
  selectedCaseIds: string[];
  report: EvalReport | null;
  reports: EvalReport[]; // Arena 多报告
  results: EvalResult[];
  dimensions: Record<string, number>;
  isLoading: boolean;
  view: "cases" | "run" | "report";

  fetchCases: () => Promise<void>;
  toggleCase: (id: string) => void;
  setView: (v: "cases" | "run" | "report") => void;
  setReport: (r: EvalReport) => void;
  setReports: (r: EvalReport[]) => void;
}

export const useEvalStore = create<EvalState>((set, get) => ({
  cases: [],
  selectedCaseIds: [],
  report: null,
  reports: [],
  results: [],
  dimensions: {},
  isLoading: false,
  view: "cases",

  fetchCases: async () => {
    set({ isLoading: true });
    const cases = await evalApi.listCases();
    set({ cases, isLoading: false });
  },

  toggleCase: (id: string) => {
    const { selectedCaseIds } = get();
    const next = selectedCaseIds.includes(id)
      ? selectedCaseIds.filter((c) => c !== id)
      : [...selectedCaseIds, id];
    set({ selectedCaseIds: next });
  },

  setView: (v) => set({ view: v }),

  setReport: (r) => {
    const results: EvalResult[] = JSON.parse(r.details);
    const dimensions = JSON.parse(r.dimensions);
    set({ report: r, results, dimensions, view: "report", reports: [] });
  },

  setReports: (rs) => {
    if (rs.length > 0) {
      const results: EvalResult[] = JSON.parse(rs[0].details);
      const dimensions = JSON.parse(rs[0].dimensions);
      set({ reports: rs, report: rs[0], results, dimensions, view: "report" });
    }
  },
}));
