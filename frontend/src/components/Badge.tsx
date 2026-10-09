import type { ReactNode } from "react";

type BadgeKind = "default" | "accent" | "success" | "warning" | "error";

export function Badge({ children, kind = "default" }: { children: ReactNode; kind?: BadgeKind }) {
  return <span className={`badge badge--${kind}`}>{children}</span>;
}