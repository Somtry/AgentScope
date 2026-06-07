import { create } from "zustand";
import { traceApi, Trace } from "../api/traces";

// Trace 状态管理
interface TraceState {
  traces: Trace[];
  selectedTrace: Trace | null;
  selectedStepIndex: number;
  isLoading: boolean;
  filterAgentId: string;
  // 回放状态
  isPlaying: boolean;
  playSpeed: number; // 每步毫秒数

  fetchTraces: () => Promise<void>;
  selectTrace: (id: string) => Promise<void>;
  selectStep: (index: number) => void;
  setFilterAgentId: (id: string) => void;
  play: () => void;
  pause: () => void;
  setPlaySpeed: (speed: number) => void;
}

export const useTraceStore = create<TraceState>((set, get) => ({
  traces: [],
  selectedTrace: null,
  selectedStepIndex: -1,
  isLoading: false,
  filterAgentId: "",
  isPlaying: false,
  playSpeed: 1000,

  fetchTraces: async () => {
    set({ isLoading: true });
    const traces = await traceApi.list(get().filterAgentId || undefined);
    set({ traces, isLoading: false });
  },

  selectTrace: async (id: string) => {
    set({ isLoading: true, isPlaying: false });
    const trace = await traceApi.get(id);
    set({ selectedTrace: trace, selectedStepIndex: -1, isLoading: false });
  },

  selectStep: (index: number) => set({ selectedStepIndex: index }),

  setFilterAgentId: (id: string) => set({ filterAgentId: id }),

  play: () => set({ isPlaying: true }),

  pause: () => set({ isPlaying: false }),

  setPlaySpeed: (speed: number) => set({ playSpeed: speed }),
}));
