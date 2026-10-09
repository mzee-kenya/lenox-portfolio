import { Section, SectionHead } from "./Section";
import { useContent } from "../hooks/useContent";
import { useReveal } from "../hooks/useUi";
import { CheckIcon } from "./icons";

export function About() {
  const { content } = useContent();
  const experience = content?.experience ?? [];
  const education = content?.education ?? [];
  const profile = content?.profile;

  const { ref, classes } = useReveal<HTMLDivElement>();

  const years = experience.reduce((acc, e) => {
    const start = new Date(e.start_date).getFullYear();
    const end = e.current ? new Date().getFullYear() : new Date(e.end_date).getFullYear();
    return acc + Math.max(0, end - start);
  }, 0);

  const highlights = [
    ...profile?.about?.split("\n").filter((l) => l.trim().startsWith("-")) ?? [],
  ].map((l) => l.replace(/^-\s*/, ""));

  return (
    <Section id="about">
      <SectionHead eyebrow="About" title="Who I am" />
      <div ref={ref} className={classes}>
        <div className="about-grid">
          <div className="about-grid__body">
            <p className="about-grid__lead">{profile?.summary}</p>
            <div className="about-grid__text">
              {(profile?.about?.split("\n") ?? [])
                .map((line) => line.trim())
                .filter((line) => line && !line.startsWith("-"))
                .map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
            </div>
          </div>

          <div className="stat-list">
            <div className="stat-card">
              <strong>{years > 1 ? years : 1}+</strong>
              <span>Years of experience</span>
            </div>
            <div className="stat-card">
              <strong>{content?.projects?.length ?? 0}</strong>
              <span>Featured projects</span>
            </div>
            <div className="stat-card">
              <strong>{content?.skills?.reduce((n, g) => n + g.items.length, 0) ?? 0}</strong>
              <span>Technologies</span>
            </div>
            <div className="stat-card">
              <strong>{education[0]?.degree ?? "BSc"}</strong>
              <span>{education[0]?.field ?? "Software Engineering"}</span>
            </div>
          </div>
        </div>

        {highlights.length ? (
          <ul className="check-list" style={{ marginTop: "2.5rem" }}>
            {highlights.slice(0, 6).map((h, i) => (
              <li key={i}>
                <CheckIcon size={16} /> {h}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Section>
  );
}