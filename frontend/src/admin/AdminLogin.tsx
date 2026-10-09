import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/Button";
import { LogoMark } from "../components/icons";

export function AdminLogin() {
  const { signIn, busy, error } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await signIn(username, password);
    } catch {
      // error surfaced from context
    }
  };

  return (
    <div className="admin-login">
      <form className="admin-login__card" onSubmit={submit}>
        <div className="admin-login__logo" aria-hidden="true">
          <LogoMark size={40} />
        </div>
        <h1>Admin dashboard</h1>
        <p className="admin-login__sub">Sign in to manage your portfolio and resume.</p>

        <label className="field">
          <span>Username</span>
          <input
            className="panel-input"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            className="panel-input"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error ? (
          <div className="alert alert--error" role="alert">
            {error}
          </div>
        ) : null}

        <Button type="submit" block disabled={busy || !username || !password}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>

        <Link to="/" className="admin-login__back">
          ← Back to public site
        </Link>
      </form>
    </div>
  );
}