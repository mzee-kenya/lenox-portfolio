import { useState, type FormEvent } from "react";
import { Button } from "../components/Button";
import { useAuth } from "../hooks/useAuth";
import { changePassword } from "../services/auth";
import { errorMessage } from "../services/api";
import { useToast } from "../hooks/useToast";
import { AlertIcon } from "../components/icons";

export function AdminSettings() {
  const { user } = useAuth();
  const { push } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (next !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await changePassword(current, next);
      push("success", "Password updated. Sign in again to continue.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin-panel" style={{ maxWidth: "560px" }}>
      <header className="admin-panel__head">
        <div>
          <h1>Security</h1>
          <p>
            Signed in as <strong>{user?.username}</strong> ({user?.email || "no email set"}). Changing your
            password signs out every device and revokes the current token.
          </p>
        </div>
      </header>

      {error ? (
        <div className="alert alert--error" role="alert">
          <AlertIcon size={16} /> {error}
        </div>
      ) : null}

      <form onSubmit={submit}>
        <label className="field">
          <span>Current password</span>
          <input
            className="panel-input"
            type="password"
            required
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </label>
        <label className="field">
          <span>New password</span>
          <input
            className="panel-input"
            type="password"
            required
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Confirm new password</span>
          <input
            className="panel-input"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>
        <Button type="submit" disabled={busy || !current || !next || !confirm}>
          {busy ? "Updating…" : "Change password"}
        </Button>
      </form>
    </section>
  );
}