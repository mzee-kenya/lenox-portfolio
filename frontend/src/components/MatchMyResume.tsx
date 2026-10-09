import { useState, type FormEvent } from "react";
import type { MatchAnalysis } from "../types";
import { analyzeJob } from "../services/content";
import { errorMessage } from "../services/api";
import { Button } from "./Button";
import { SkeletonBlock } from "./Skeleton";
import { AlertIcon, CheckIcon, CloseIcon, SparklesIcon } from "./icons";

export function MatchMyResume({
  versions,
  defaultSlug,
}: {
  versions: { slug: string; title: string }[];
  defaultSlug?: string;
}) {
  const [jd, setJd] = useState("");
  const [version, setVersion] = useState<string>(defaultSlug ?? "");
  const [result, setResult] = useState<MatchAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (jd.trim().length < 40) {
      setError("Paste the full job description so the match is meaningful (at least 40 characters).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const analysis = await analyzeJob(jd, version || undefined, undefined);
      setResult(analysis);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const bandClass =
    result?.band === "strong"
      ? "alert--success"
      : result?.band === "good"
        ? "alert--success"
        : result?.band === "fair"
          ? "alert--warning"
          : "alert--error";

  return (
    <div className="match-card">
      <div className="match-card__head">
        <SparklesIcon size={18} />
        <div>
          <h3>Match my resume</h3>
          <p>Paste a job description for an instant skills fit analysis.</p>
        </div>
      </div>

      <form onSubmit={submit} className="match-card__form">
        <label className="field">
          <span>Job description</span>
          <textarea
            rows={6}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the job posting here…"
            maxLength={12000}
          />
        </label>

        {versions.length > 1 ? (
          <label className="field">
            <span>Resume version</span>
            <select value={version} onChange={(e) => setVersion(e.target.value)}>
              <option value="">Default</option>
              {versions.map((v) => (
                <option key={v.slug} value={v.slug}>
                  {v.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div>
          <Button type="submit" disabled={loading || !jd.trim()}>
            {loading ? "Analyzing…" : "Analyze fit"}
          </Button>
        </div>
      </form>

      {error ? (
        <div className="alert alert--error" role="alert" style={{ marginTop: "1rem" }}>
          <AlertIcon size={16} /> {error}
        </div>
      ) : null}

      {loading ? (
        <div style={{ marginTop: "1.5rem" }}>
          <SkeletonBlock lines={4} />
        </div>
      ) : null}

      {result ? (
        <div className="match-result" style={{ marginTop: "1.5rem" }}>
          <div className={`alert ${bandClass}`} role="status">
            <strong>
              Match score: {Math.round(result.score * 100)}% ({result.band})
            </strong>
            <p>{result.note}</p>
          </div>

          <div className="match-result__cols">
            <div>
              <h4>Present in your resume</h4>
              <ul className="match-list match-list--ok">
                {result.matched.slice(0, 12).map((k) => (
                  <li key={k}>
                    <CheckIcon size={14} /> {k}
                  </li>
                ))}
                {!result.matched.length ? <li>No strong keyword overlap found.</li> : null}
              </ul>
            </div>
            <div>
              <h4>Could strengthen</h4>
              <ul className="match-list match-list--miss">
                {result.missing.slice(0, 12).map((k) => (
                  <li key={k}>
                    <CloseIcon size={14} /> {k}
                  </li>
                ))}
                {!result.missing.length ? <li>Great coverage — nothing critical missing.</li> : null}
              </ul>
            </div>
          </div>

          {result.recommendations.length ? (
            <>
              <h4 style={{ marginTop: "1.25rem" }}>Recommendations</h4>
              <ol className="match-reco">
                {result.recommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ol>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}