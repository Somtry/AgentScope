import { api } from "./client";

export interface EvalRule {
  type: string;
  config: Record<string, unknown>;
  weight: number;
}

export interface EvalCase {
  id: string;
  name: string;
  input: string;
  expected_output: string | null;
  eval_rules: string;
  tags: string | null;
  created_at: string;
}

export interface EvalReport {
  id: string;
  agent_id: string;
  timestamp: string;
  total_cases: number;
  passed_cases: number;
  avg_score: number;
  dimensions: string;
  details: string;
}

export interface EvalResult {
  case_id: string;
  case_name: string;
  input: string;
  output: string;
  expected: string | null;
  score: number;
  passed: boolean;
  detail: { type: string; score: number; weight: number }[];
}

export const evalApi = {
  listCases: () => api.get<EvalCase[]>("/evals/cases"),
  createCase: (data: {
    name: string;
    input: string;
    expected_output?: string;
    eval_rules: EvalRule[];
    tags?: string[];
  }) => api.post<EvalCase>("/evals/cases", data),
  deleteCase: (id: string) => api.delete(`/evals/cases/${id}`),
  runEval: (data: {
    agent_id: string;
    agent_endpoint: string;
    case_ids: string[];
  }) => api.post<EvalReport>("/evals/run", data),
  compare: (data: {
    agents: { agent_id: string; endpoint: string }[];
    case_ids: string[];
  }) => api.post<EvalReport[]>("/evals/compare", data),
  getReport: (id: string) => api.get<EvalReport>(`/evals/${id}`),
};
