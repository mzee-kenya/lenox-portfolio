import { Section, SectionHead } from "./Section";
import { ProjectCard } from "./ProjectCard";
import { Button } from "./Button";
import { useContent } from "../hooks/useContent";
import { useReveal } from "../hooks/useUi";
import { ArrowRightIcon } from "./icons";
import { Link } from "react-router-dom";

export function Projects({ featuredOnly = false, compact = false }: { featuredOnly?: boolean; compact?: boolean }) {
  const { content } = useContent();
  const { ref, classes } = useReveal<HTMLDivElement>();

  const projects = featuredOnly
    ? (content?.projects ?? []).filter((p) => p.featured)
    : (content?.projects ?? []);

  return (
    <Section id="projects" className="section--alt">
      <SectionHead
        eyebrow={featuredOnly ? "Featured work" : "Portfolio"}
        title="Projects I've shipped"
        description="From architecture to production — a look at the work behind the screen."
      />
      <div ref={ref} className={classes}>
        {projects.length ? (
          <div className="projects-grid">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : null}

        {compact && (content?.projects?.length ?? 0) > projects.length ? (
          <div style={{ marginTop: "2.5rem", display: "flex", justifyContent: "center" }}>
            <Button href="/projects" icon={ArrowRightIcon}>
              All projects
            </Button>
          </div>
        ) : null}

        {!compact && !featuredOnly ? (
          <div style={{ marginTop: "2.5rem", display: "flex", justifyContent: "center" }}>
            <Link to="/resume" className="link-arrow">
              More details in my resume <ArrowRightIcon size={15} />
            </Link>
          </div>
        ) : null}
      </div>
    </Section>
  );
}