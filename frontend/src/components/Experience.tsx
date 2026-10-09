import { Section, SectionHead } from "./Section";
import { useContent } from "../hooks/useContent";
import { useReveal } from "../hooks/useUi";
import { MapPinIcon } from "./icons";

function formatRange(start: string, end: string, current: boolean): string {
  const fmt = (iso: string) => {
    if (!iso) return "";
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  };
  const s = fmt(start);
  const e = current ? "Present" : fmt(end);
  return `${s} — ${e}`;
}

export function Experience() {
  const { content } = useContent();
  const experiences = content?.experience ?? [];
  const { ref, classes } = useReveal<HTMLDivElement>();

  if (!experiences.length) return null;

  return (
    <Section id="experience">
      <SectionHead eyebrow="Experience" title="Where I've worked" />
      <div ref={ref} className={classes}>
        <ol className="timeline">
          {experiences.map((exp) => (
            <li className="timeline__item" key={exp.id}>
              <div className="timeline__node" aria-hidden="true" />
              <article className="card timeline__card">
                <header className="timeline__head">
                  <div>
                    <h3>{exp.title}</h3>
                    <p className="timeline__org">
                      {exp.organization}
                      {exp.employment_type ? <span> · {exp.employment_type}</span> : null}
                      {exp.location ? (
                        <>
                          {" "}
                          · <MapPinIcon size={13} /> {exp.location}
                        </>
                      ) : null}
                    </p>
                  </div>
                  <span className="chip chip--muted chip--sm">
                    {formatRange(exp.start_date, exp.end_date, exp.current)}
                  </span>
                </header>
                <p className="timeline__desc">{exp.description}</p>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}