import { api } from "./api";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
}

export interface LoginResult extends AuthUser {
  token: string;
}

const TOKEN_KEY = "ph_token";
const USER_KEY = "ph_user";

export function saveAuth(token: string, user: AuthUser): void {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function login(username: string, password: string): Promise<LoginResult> {
  const { data } = await api.post<LoginResult>("/auth/login/", { username, password });
  return data;
}

export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout/");
  } catch {
    // token may already be invalid; local logout still proceeds
  }
  clearAuth();
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>("/auth/me/");
  return data;
}

export async function changePassword(current: string, next: string): Promise<void> {
  await api.post("/auth/change-password/", { current_password: current, new_password: next });
  clearAuth();
}