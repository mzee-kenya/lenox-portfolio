import { createContext, useContext, type ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  clearAuth,
  getStoredUser,
  getToken,
  login as apiLogin,
  logout as apiLogout,
  saveAuth,
  type AuthUser,
} from "../services/auth";
import { errorMessage } from "../services/api";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  busy: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getToken());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (username: string, password: string) => {
    setBusy(true);
    setError(null);
    try {
      const result = await apiLogin(username, password);
      if (!result.is_staff) {
        throw new Error("This account does not have access to the dashboard.");
      }
      saveAuth(result.token, result);
      setUser(result);
      setToken(result.token);
    } catch (err) {
      setError(errorMessage(err));
      throw err;
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    await apiLogout().catch(() => undefined);
    setUser(null);
    setToken(null);
  };

  useEffect(() => {
    setUser(getStoredUser());
    setToken(getToken());
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, signIn, signOut, busy, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function hasToken(): boolean {
  return Boolean(getToken());
}

export { clearAuth };