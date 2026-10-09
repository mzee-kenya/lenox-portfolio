import { api } from "./api";

export type AnalyticEventName =
  | "resume_download"
  | "project_view"
  | "contact_submit"
  | "github_click";

export function track(name: AnalyticEventName, meta: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  api.post("/events/", { name, meta }).catch(() => {
    // Analytics are best-effort and never block the page.
  });
}