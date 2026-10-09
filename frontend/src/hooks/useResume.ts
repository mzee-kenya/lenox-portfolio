import { useEffect, useState } from "react";
import type { ResumePayload } from "../types";
import { errorMessage } from "../services/api";
import { fetchResumePreview } from "../services/content";

export interface ResumeState {
  data: ResumePayload | null;
  loading: boolean;
  error: string | null;
  version: string | "default";
  setVersion: (slug: string | "default") => void;
  reload: () => void;
}

export function useResume(): ResumeState {
  const [data, setData] = useState<ResumePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState<string | "default">("default");

  const load = (slug: string | "default") => {
    setLoading(true);
    setError(null);
    fetchResumePreview(slug === "default" ? undefined : slug)
      .then(setData)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(version);
  }, [version]);

  return { data, loading, error, version, setVersion, reload: () => load(version) };
}