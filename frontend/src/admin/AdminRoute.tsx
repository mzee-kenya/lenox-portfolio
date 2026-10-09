import { useAuth } from "../hooks/useAuth";
import { AdminLogin } from "./AdminLogin";
import { AdminLayout } from "./AdminLayout";

export function AdminRoute() {
  const { token } = useAuth();
  if (!token) return <AdminLogin />;
  return <AdminLayout />;
}