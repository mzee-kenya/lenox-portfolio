import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Project } from "../types";
import { Seo } from "../components/Seo";
import { Section, SectionHead } from "../components/Section";
import { Badge } from "../components/Badge";
import { ErrorState } from "../components/States";
import { Button } from "../components/Button";
import { fetchProject, STATUS_LABELS } from "../services/content";
import { errorMessage } from "../services/api";
import { track } from "../services/analytics";
import { statusBadgeKind, statusKind } from "../components/ProjectCard";
import { ArrowRightIcon, CodeIcon, DownloadIcon, ExternalIcon, GitHubIcon, LayersIcon } from "../components/icons";

function MarkdownishList({ items, ordered = false }: { items: string[]; ordered?: boolean }) {
  if (!items?.length) return null;
  return ordered ? (
    <ol>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ol>
  ) : (
    <ul>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    fetchProject(slug)
      .then((data) => {
        setProject(data);
        track("project_view", { slug });
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Section><div className="container"><h1 className="visually-hidden">Loading project</h1><div className="skeleton skeleton--card" style={{ height: "220px" }} /></div></Section>;

  if (error || !project) {
    return (
      <Section tight>
        <Seo title="Project not found" />
        <ErrorState title="Project not found" detail={error} />
        <div><Button href="/projects" kind="secondary">Back to projects</Button></div>
      </Section>
    );
  }

  const cs = project.case_study;
  const kind = statusKind(project.status);

  return (
    <>
      <Seo
        title={`${project.name} – Lenox Okoth`}
        description={project.tagline || project.description}
      />
      <Section tight>
        <div className="project-hero">
          <div className="project-hero__crumbs">
            <Link to="/projects" className="link-back">
              <ArrowRightIcon size={14} />
              Projects
            </Link>
          </div>
          <div className="project-hero__topline">
            <span className="chip chip--muted">{project.category}</span>
            <Badge kind={statusBadgeKind(kind)}>{STATUS_LABELS[kind]}</Badge>
          </div>
          <h1>{project.name}</h1>
          <p className="project-hero__tagline">{project.tagline}</p>

          <div className="project-hero__actions">
            {project.demo_url ? (
              <Button href={project.demo_url} target="_blank" icon={ExternalIcon}>
                Live demo
              </Button>
            ) : null}
            {project.github_url ? (
              <Button href={project.github_url} target="_blank" kind="secondary" icon={GitHubIcon}>
                Source code
              </Button>
            ) : null}
            <Button href="/resume" kind="ghost" icon={DownloadIcon}>
              Resume
            </Button>
          </div>

          <div className="project-hero__tech">
            {project.technologies?.map((t) => (
              <span className="chip" key={t}>
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="project-layout">
          <article className="project-body">
            <SectionHead eyebrow="Overview" title="The brief" />
            <div className="prose">
              <p>{project.description}</p>
              {project.problem ? (
                <>
                  <h3>Problem</h3>
                  <p>{project.problem}</p>
                </>
              ) : null}
              {project.solution ? (
                <>
                  <h3>Solution</h3>
                  <p>{project.solution}</p>
                </>
              ) : null}
              {project.role ? (
                <>
                  <h3>My role</h3>
                  <p>{project.role}</p>
                </>
              ) : null}
            </div>

            {cs?.architecture_text ? (
              <>
                <SectionHead eyebrow="Inside the build" title="Architecture" />
                <div className="prose">
                  <p>{cs.architecture_text}</p>
                </div>
              </>
            ) : null}

            {project.features?.length ? (
              <>
                <SectionHead eyebrow="Deliverables" title="Features" />
                <ul className="feature-list">
                  {project.features.map((f, i) => (
                    <li key={i} className="feature-list__item">
                      <span className="feature-list__icon" aria-hidden="true">
                        <CheckPip status={f.status} />
                      </span>
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {cs?.challenges?.length ? (
              <>
                <SectionHead eyebrow="Process" title="Challenges & decisions" />
                <div className="paired-list">
                  <div>
                    <h3>Challenges</h3>
                    <MarkdownishList items={cs.challenges} />
                  </div>
                  <div>
                    <h3>Solutions</h3>
                    <MarkdownishList items={cs.solutions} />
                  </div>
                </div>
              </>
            ) : null}

            {cs?.results?.length ? (
              <>
                <SectionHead eyebrow="Impact" title="Results" />
                <MarkdownishList items={cs.results} />
              </>
            ) : null}

            {cs?.lessons?.length ? (
              <>
                <SectionHead eyebrow="Reflection" title="Lessons learned" />
                <MarkdownishList items={cs.lessons} />
              </>
            ) : null}
          </article>

          <aside className="project-aside">
            <div className="card project-aside__card">
              <h3>Details</h3>
              <dl className="kv-list">
                {project.category ? (
                  <div>
                    <dt>Category</dt>
                    <dd>{project.category}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Status</dt>
                  <dd>{STATUS_LABELS[kind]}</dd>
                </div>
                {project.started_at ? (
                  <div>
                    <dt>Started</dt>
                    <dd>{new Date(project.started_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</dd>
                  </div>
                ) : null}
                {project.role ? (
                  <div>
                    <dt>Role</dt>
                    <dd>{project.role}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="project-aside__links">
                <Button href="/resume" block>
                  <LayersIcon size={16} /> View full resume
                </Button>
                <Button href="/#contact" kind="secondary" block>
                  Discuss a project <CodeIcon size={15} />
                </Button>
              </div>
            </div>
          </aside>
        </div>

        <div style={{ marginTop: "3rem" }}>
          <Button href="/projects" kind="ghost" icon={ArrowRightIcon}>
            Back to all projects
          </Button>
        </div>
      </Section>
    </>
  );
}

function CheckPip({ status }: { status?: string }) {
  const cls = status === "in_progress" ? " is-wip" : status === "planned" ? " is-planned" : "";
  return <span className={`ok-pip${cls}`} aria-hidden="true">✓</span>;
}