import { api } from "./client";

// 评测规则
export interface EvalRule {
  type: string;
  config: Record<string, unknown>;
  weight: number;
}

// 评测用例
export interface EvalCase {
  id: string;
  name: string;
  input: string;
  expected_output: string | null;
  eval_rules: string; // JSON
  tags: string | null; // JSON
  created_at: string;
}

// 评测报告
export interface EvalReport {
  id: string;
  agent_id: string;
  timestamp: string;
  total_cases: number;
  passed_cases: number;
  avg_score: number;
  dimensions: string; // JSON
  details: string; // JSON
}

// 评测结果详情
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

// Evals API 封装
export const evalApi = {
  listCases: () => api.get<EvalCase[]>("/evals/cases"),
  createCase: (data: {
    name: string;
    input: string;
    expected_output?: string;
    eval_rules: EvalRule[];
    tags?: string[];
  }) => api.post<EvalCase>("/evals/cases", data),
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
