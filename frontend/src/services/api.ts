const BASE = "/api";

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, detail: string, status: number) {
    super(detail);
    this.code = code;
    this.status = status;
  }
}

function parseError(payload: unknown, status: number): ApiError {
  const body = payload as { error?: { code?: string; detail?: string } };
  return new ApiError(
    body?.error?.code ?? "server_error",
    body?.error?.detail ?? "Something went wrong. Please try again.",
    status
  );
}

export async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<{ ok: true; data: T }> {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("ph_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Token ${token}`;

  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError("network_unavailable", "Network unavailable. Check your connection and try again.", 0);
  }

  if (response.status === 204) return { ok: true, data: undefined as T };

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    throw parseError(body, response.status);
  }
  return { ok: true, data: (body ?? undefined) as T };
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data === undefined ? undefined : JSON.stringify(data) }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
  put: <T>(path: string, data?: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(data) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}