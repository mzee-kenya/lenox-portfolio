import type { ComponentType } from "react";
import { Section, SectionHead } from "./Section";
import { useContent } from "../hooks/useContent";
import { useReveal } from "../hooks/useUi";
import { CodeIcon, DatabaseIcon, LayersIcon, PhoneDeviceIcon, ServerIcon, SparklesIcon, WrenchIcon } from "./icons";

const categoryIcons: Record<string, ComponentType<{ size?: number }>> = {
  frontend: CodeIcon,
  backend: ServerIcon,
  database: DatabaseIcon,
  mobile: PhoneDeviceIcon,
  tools: WrenchIcon,
  engineering: LayersIcon,
  other: SparklesIcon,
};

export function Skills() {
  const { content } = useContent();
  const groups = content?.skills ?? [];
  const { ref, classes } = useReveal<HTMLDivElement>();

  return (
    <Section id="skills">
      <SectionHead
        eyebrow="Skills"
        title="Things I build with"
        description="Categorized tools and technologies I use across the stack."
      />
      <div ref={ref} className={classes}>
        <div className="skill-grid">
          {groups.map((group) => {
            if (!group.items.length) return null;
            const Icon = categoryIcons[group.category] ?? SparklesIcon;
            return (
              <div className="card skill-card" key={group.category}>
                <div className="skill-card__head">
                  <span className="skill-card__icon" aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  <h3>{group.categoryLabel}</h3>
                </div>
                <div className="skill-card__chips">
                  {group.items.map((skill) => (
                    <span className="chip" key={skill.id}>
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}