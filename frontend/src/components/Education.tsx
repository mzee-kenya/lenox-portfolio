import { Section, SectionHead } from "./Section";
import { useContent } from "../hooks/useContent";
import { useReveal } from "../hooks/useUi";
import { GraduationIcon } from "./icons";

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

export function Education() {
  const { content } = useContent();
  const education = content?.education ?? [];
  const { ref, classes } = useReveal<HTMLDivElement>();

  if (!education.length) return null;

  return (
    <Section id="education" className="section--alt">
      <SectionHead eyebrow="Education" title="Learning path" />
      <div ref={ref} className={classes}>
        <ol className="timeline">
          {education.map((edu) => (
            <li className="timeline__item" key={edu.id}>
              <div className="timeline__node" aria-hidden="true" />
              <article className="card timeline__card">
                <header className="timeline__head">
                  <div>
                    <h3 className="timeline__title-with-icon">
                      <GraduationIcon size={16} /> {edu.degree}
                    </h3>
                    <p className="timeline__org">
                      {edu.school}
                      {edu.field ? <span> · {edu.field}</span> : null}
                    </p>
                  </div>
                  <span className="chip chip--muted chip--sm">
                    {formatRange(edu.start_date, edu.end_date, edu.current)}
                  </span>
                </header>
                {edu.detail ? <p className="timeline__desc">{edu.detail}</p> : null}
              </article>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}