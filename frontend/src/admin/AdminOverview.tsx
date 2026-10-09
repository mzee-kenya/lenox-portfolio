import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useContent } from "../hooks/useContent";
import { errorMessage } from "../services/api";
import { api } from "../services/api";
import { Button } from "../components/Button";
import { Skeleton } from "../components/Skeleton";
import { AlertIcon, MessageIcon } from "../components/icons";
import { downloadResume } from "../services/content";

interface Counts {
  skills: number;
  experience: number;
  education: number;
  certifications: number;
  projects: number;
  messages: number;
  versions: number;
}

export function AdminOverview() {
  const { content, loading: contentLoading } = useContent();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<unknown[]>(`/skills/?limit=1`),
      api.get<unknown[]>(`/experience/?limit=1`),
      api.get<unknown[]>(`/education/?limit=1`),
      api.get<unknown[]>(`/certifications/?limit=1`),
      api.get<unknown[]>(`/projects/?limit=1`),
      api.get<unknown[]>(`/contact/messages/?limit=1`),
      api.get<unknown[]>(`/resume/versions/?limit=1`),
    ])
      .then(([skills, experience, education, certifications, projects, messages, versions]) => {
        setCounts({
          skills: count(items(skills.data)),
          experience: count(items(experience.data)),
          education: count(items(education.data)),
          certifications: count(items(certifications.data)),
          projects: count(items(projects.data)),
          messages: count(items(messages.data)),
          versions: count(items(versions.data)),
        });
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const cards: { label: string; value: string | number; to?: string }[] = [
    { label: "Skills", value: counts?.skills ?? "…", to: "/admin/skills" },
    { label: "Roles", value: counts?.experience ?? "…", to: "/admin/experience" },
    { label: "Education", value: counts?.education ?? "…", to: "/admin/education" },
    { label: "Certifications", value: counts?.certifications ?? "…", to: "/admin/certifications" },
    { label: "Projects", value: counts?.projects ?? "…", to: "/admin/projects" },
    { label: "Resume versions", value: counts?.versions ?? "…", to: "/admin/resume" },
    { label: "Messages", value: counts?.messages ?? "…", to: "/admin/messages" },
  ];

  const recentProjects = (content?.projects ?? []).slice(0, 3);
  const versionCount = counts?.versions ?? 0;

  return (
    <div className="admin-overview">
      <header className="admin-panel__head">
        <div>
          <h1>Overview</h1>
          <p>Everything on the public site is editable below. Signed-in as staff — changes publish immediately.</p>
        </div>
      </header>

      {error ? (
        <div className="alert alert--error" role="alert">
          <AlertIcon size={16} /> {error}
        </div>
      ) : null}

      <div className="admin-stat-grid">
        {cards.map((c) => (
          <Link to={c.to ?? "#"} className="admin-stat" key={c.label}>
            <strong>{c.value}</strong>
            <span>{c.label}</span>
          </Link>
        ))}
      </div>

      <div className="admin-cols">
        <section className="admin-panel">
          <header className="admin-panel__head">
            <div>
              <h2>Quick actions</h2>
            </div>
          </header>
          <div className="admin-quick">
            <Button href="/admin/profile" kind="secondary" block>
              Edit profile
            </Button>
            <Button href="/admin/resume" kind="secondary" block>
              Resume builder
            </Button>
            <Button href="/admin/projects" kind="secondary" block>
              Manage projects
            </Button>
            <Button
              kind="secondary"
              block
              onClick={() => downloadResume()}
            >
              Download default PDF
            </Button>
          </div>
        </section>

        <section className="admin-panel">
          <header className="admin-panel__head">
            <div>
              <h2>Latest projects</h2>
            </div>
            <Link to="/admin/projects" className="admin-link">
              Manage →
            </Link>
          </header>
          {contentLoading ? (
            <Skeleton />
          ) : recentProjects.length ? (
            <ul className="admin-mini-list">
              {recentProjects.map((p) => (
                <li key={p.id}>
                  <span>
                    <strong>{p.name}</strong>
                    <small>
                      {p.status} · {p.category}
                    </small>
                  </span>
                  {!p.published ? <em className="admin-warn">draft</em> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-empty">No projects yet.</p>
          )}
          {versionCount === 0 ? (
            <div className="alert alert--info" style={{ marginTop: "1rem" }}>
              No resume versions yet — create one in the Resume builder so PDFs can be generated.
            </div>
          ) : null}
        </section>
      </div>

      <section className="admin-panel">
        <header className="admin-panel__head">
          <div>
            <h2>Inbox snapshot</h2>
          </div>
          <Link to="/admin/messages" className="admin-link">
            <MessageIcon size={14} /> View messages
          </Link>
        </header>
        <p className="admin-empty">
          {counts?.messages ? `You have ${counts.messages} message(s).` : "Open the Messages section to review or archive enquiries."}
        </p>
      </section>
    </div>
  );
}

function items(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && Array.isArray((value as { results?: unknown[] }).results)) {
    return (value as { results: unknown[] }).results;
  }
  return [];
}

function count(items: unknown[]): number {
  return items.length;
}