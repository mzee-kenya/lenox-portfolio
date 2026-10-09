import { api } from "./api";
import type { MatchAnalysis, ResumePayload, SiteContent, StatusKind } from "../types";

export async function fetchContent(): Promise<SiteContent> {
  const { data } = await api.get<SiteContent>("/content/");
  return data;
}

export async function fetchProject(slugOrId: string | number): Promise<any> {
  const { data } = await api.get(`/projects/${slugOrId}/`);
  return data;
}

export function pdfUrl(versionSlug?: string): string {
  const base = "/api/resume/pdf";
  return versionSlug ? `${base}/${versionSlug}/` : `${base}/`;
}

export async function downloadResume(versionSlug?: string): Promise<boolean> {
  try {
    const token =
      typeof window !== "undefined" ? window.localStorage.getItem("ph_token") : null;
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Token ${token}`;
    const response = await fetch(pdfUrl(versionSlug), { headers });
    if (!response.ok) return false;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `Lenox-Okoth-Resume${versionSlug ? `-${versionSlug}` : ""}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

export async function fetchResumePreview(versionSlug?: string): Promise<ResumePayload> {
  const path = versionSlug
    ? `/resume/preview/${versionSlug}/`
    : "/resume/preview/";
  const { data } = await api.get<ResumePayload>(path);
  return data;
}

export async function analyzeJob(
  jobDescription: string,
  resumeVersion?: string,
  sessionId?: string
): Promise<MatchAnalysis> {
  const { data } = await api.post<{ result: MatchAnalysis }>("/ai/analyze/", {
    job_description: jobDescription,
    resume_version: resumeVersion ?? "",
    session_id: sessionId ?? "",
  });
  return data.result;
}

export const STATUS_LABELS: Record<StatusKind, string> = {
  implemented: "Implemented",
  in_progress: "In Development",
  planned: "Planned",
};