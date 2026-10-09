import { useReveal } from "../hooks/useUi";
import type { ReactNode } from "react";

interface SectionProps {
  id?: string;
  className?: string;
  children: ReactNode;
  tight?: boolean;
}

export function Section({ id, className = "", children, tight = false }: SectionProps) {
  return (
    <section id={id} className={`section ${tight ? "section--tight" : ""} ${className}`}>
      <div className="container">{children}</div>
    </section>
  );
}

interface SectionHeadProps {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export function SectionHead({ eyebrow, title, description, align = "left" }: SectionHeadProps) {
  const { ref, classes } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={classes} style={{ textAlign: align }}>
      <div className="section-head" style={align === "center" ? { marginInline: "auto" } : undefined}>
        <span className="eyebrow" style={align === "center" ? { justifyContent: "center" } : undefined}>
          {eyebrow}
        </span>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
    </div>
  );
}