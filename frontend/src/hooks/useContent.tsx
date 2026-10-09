import { createContext, useContext, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import type { SiteContent } from "../types";
import { errorMessage } from "../services/api";
import { fetchContent } from "../services/content";

interface ContentContextValue {
  content: SiteContent | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const ContentContext = createContext<ContentContextValue | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchContent()
      .then(setContent)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(reload, [reload]);

  const value = useMemo(() => ({ content, loading, error, reload }), [content, loading, error, reload]);

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent(): ContentContextValue {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used inside ContentProvider");
  return ctx;
}