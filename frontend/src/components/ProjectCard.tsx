import { Link } from "react-router-dom";
import type { Project, StatusKind } from "../types";
import { Badge } from "./Badge";
import { STATUS_LABELS } from "../services/content";
import { ArrowRightIcon } from "./icons";

export function statusKind(value: Project["status"]): StatusKind {
  if (value === "implemented" || value === "in_progress" || value === "planned") return value;
  return "implemented";
}

export function statusBadgeKind(status: StatusKind): "success" | "warning" | "default" {
  if (status === "in_progress") return "warning";
  if (status === "planned") return "default";
  return "success";
}

export function ProjectCard({ project }: { project: Project }) {
  const kind = statusKind(project.status);
  return (
    <Link
      className={`card project-card${project.featured ? " project-card--featured" : ""}`}
      to={`/projects/${project.slug}`}
      aria-label={`${project.name} — ${project.tagline}`}
    >
      <header className="project-card__head">
        <div className="project-card__topline">
          <span className="project-card__category">{project.category}</span>
          <Badge kind={statusBadgeKind(kind)}>{STATUS_LABELS[kind]}</Badge>
        </div>
        <h3>{project.name}</h3>
        <p className="project-card__tagline">{project.tagline}</p>
      </header>

      <p className="project-card__desc">{project.description}</p>

      <div className="project-card__tech">
        {project.technologies?.slice(0, 6).map((t) => (
          <span className="chip chip--sm" key={t}>
            {t}
          </span>
        ))}
        {project.technologies && project.technologies.length > 6 ? (
          <span className="chip chip--sm">+{project.technologies.length - 6}</span>
        ) : null}
      </div>

      <footer className="project-card__foot">
        <span className="project-card__link">
          Case study <ArrowRightIcon size={15} />
        </span>
      </footer>
    </Link>
  );
}