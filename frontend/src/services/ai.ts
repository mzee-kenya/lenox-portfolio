import { api } from "./api";

export type AiAction =
  | "improve_summary"
  | "tailored_summary"
  | "project_bullets"
  | "ats_keywords";

export interface AiResult<T> {
  ok: true;
  result: T;
}

export async function runAiAction(action: string, params: Record<string, unknown>) {
  const { data } = await api.post<AiResult<unknown>>("/ai/assist/", { action, ...params });
  return data.result;
}