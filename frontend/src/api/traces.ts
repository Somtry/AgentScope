import { api } from "./client";

// 步骤接口
export interface Step {
  id: string;
  type: string;
  seq: number;
  timestamp: string;
  content: string | null;
  duration_ms: number | null;
  token_count: number | null;
  model: string | null;
  tool_name: string | null;
  tool_params: string | null;
  tool_result: string | null;
}

// 轨迹接口
export interface Trace {
  id: string;
  agent_id: string;
  session_id: string | null;
  started_at: string;
  ended_at: string | null;
  status: string;
  created_at: string;
  steps?: Step[];
}

// Trace API 封装
export const traceApi = {
  list: (agentId?: string) => {
    const params = agentId ? `?agent_id=${agentId}` : "";
    return api.get<Trace[]>(`/traces${params}`);
  },
  get: (id: string) => api.get<Trace>(`/traces/${id}`),
  create: (agentId: string) =>
    api.post<Trace>("/traces", { agent_id: agentId }),
  addSteps: (traceId: string, steps: Partial<Step>[]) =>
    api.post<Step[]>(`/traces/${traceId}/steps`, { steps }),
  complete: (traceId: string) =>
    api.post<Trace>(`/traces/${traceId}/complete`, {}),
};
