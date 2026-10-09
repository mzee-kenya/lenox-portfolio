import { useMemo, useState } from "react";
import { Seo } from "../components/Seo";
import { Section, SectionHead } from "../components/Section";
import { ProjectCard } from "../components/ProjectCard";
import { ErrorState, EmptyState } from "../components/States";
import { SkeletonCard } from "../components/SkeletonCard";
import { useContent } from "../hooks/useContent";
import { FolderIcon } from "../components/icons";

export function ProjectsPage() {
  const { content, loading, error, reload } = useContent();
  const [category, setCategory] = useState<string>("all");

  const categories = useMemo(() => {
    const set = new Set((content?.projects ?? []).map((p) => p.category).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [content]);

  const projects = useMemo(
    () =>
      (content?.projects ?? []).filter((p) => category === "all" || p.category === category),
    [content, category]
  );

  if (loading) {
    return (
      <Section tight>
        <SkeletonCard count={4} />
      </Section>
    );
  }

  return (
    <>
      <Seo
        title="Projects – Lenox Okoth"
        description="Selected work and case studies by Lenox Okoth, full-stack software engineer."
      />
      <Section tight>
        <SectionHead
          eyebrow="Portfolio"
          title="All projects"
          description="Case studies, architecture notes, and the story behind each build."
        />
        {error ? <ErrorState detail={error} onRetry={reload} /> : null}

        {categories.length > 1 ? (
          <div className="filter-row" role="group" aria-label="Filter projects">
            {categories.map((c) => (
              <button
                key={c}
                className={`chip chip--filter${category === c ? " is-active" : ""}`}
                onClick={() => setCategory(c)}
                type="button"
              >
                {c === "all" ? "All" : c}
              </button>
            ))}
          </div>
        ) : null}

        {projects.length ? (
          <div className="projects-grid">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FolderIcon size={32} />}
            message="No projects in this category yet."
          />
        )}
      </Section>
    </>
  );
}