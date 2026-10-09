import type { ReactNode } from "react";
import { AlertIcon, RefreshIcon } from "./icons";

export function ErrorState({
  title = "Something went wrong",
  detail,
  onRetry,
  children,
}: {
  title?: string;
  detail?: string | null;
  onRetry?: () => void;
  children?: ReactNode;
}) {
  return (
    <div
      role="alert"
      style={{ display: "grid", gap: "1rem", justifyItems: "start", padding: "1.5rem 0" }}
    >
      <div className="alert alert--error" style={{ maxWidth: "560px" }}>
        <AlertIcon size={18} />
        <div>
          <strong>{title}</strong>
          {detail ? <p style={{ marginTop: "0.25rem" }}>{detail}</p> : null}
          {children}
        </div>
      </div>
      {onRetry ? (
        <button className="btn btn--secondary btn--sm" onClick={onRetry}>
          <RefreshIcon size={15} /> Try again
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ icon, message, action }: { icon?: ReactNode; message: string; action?: ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        gap: "0.75rem",
        padding: "2.5rem 1rem",
        textAlign: "center",
        color: "var(--text-muted)",
        border: "1px dashed var(--border-strong)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      {icon}
      <p>{message}</p>
      {action}
    </div>
  );
}