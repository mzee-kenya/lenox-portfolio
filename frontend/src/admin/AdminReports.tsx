import { useEffect, useState } from "react";
import { api, errorMessage } from "../services/api";
import { Skeleton } from "../components/Skeleton";
import { AlertIcon, RefreshIcon, SparklesIcon } from "../components/icons";

interface HistoryRow {
  id: number;
  score: number;
  provider: string;
  created_at: string;
  job_excerpt: string;
}

export function AdminReports() {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .get<HistoryRow[]>(`/ai/history/`)
      .then(({ data }) => setRows(data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <section className="admin-panel">
      <header className="admin-panel__head">
        <div>
          <h1>Assistant & analytics</h1>
          <p>Job-description analyses run against the resume, plus lightweight visitor events.</p>
        </div>
        <button className="icon-btn" onClick={load} aria-label="Refresh">
          <RefreshIcon size={16} />
        </button>
      </header>

      {error ? (
        <div className="alert alert--error" role="alert">
          <AlertIcon size={16} /> {error}
        </div>
      ) : null}

      {loading ? (
        <Skeleton />
      ) : rows.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Score</th>
                <th>Source</th>
                <th>Date</th>
                <th>Job description (excerpt)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{Math.round(r.score * 100)}%</strong>
                  </td>
                  <td>{r.provider}</td>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                  <td className="table__muted">{r.job_excerpt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty">No analyses yet. Visitors use "Match my resume" on the resume page.</p>
      )}

      <div className="alert alert--info" style={{ marginTop: "1.5rem" }}>
        <SparklesIcon size={16} />
        <span>
          The assistant runs a deterministic matching engine locally (no external API required). If{" "}
          <code>AI_API_KEY</code> is configured on the server, responses are grounded in your resume before
          returning.
        </span>
      </div>
    </section>
  );
}