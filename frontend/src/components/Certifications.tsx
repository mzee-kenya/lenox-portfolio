import { Section, SectionHead } from "./Section";
import { useContent } from "../hooks/useContent";
import { useReveal } from "../hooks/useUi";
import { AwardIcon, ExternalIcon } from "./icons";

export function Certifications() {
  const { content } = useContent();
  const certs = content?.certifications ?? [];
  const { ref, classes } = useReveal<HTMLDivElement>();

  if (!certs.length) return null;

  return (
    <Section id="certifications">
      <SectionHead eyebrow="Certifications" title="Certifications" />
      <div ref={ref} className={classes}>
        <ul className="cert-list">
          {certs.map((cert) => (
            <li className="cert-item" key={cert.id}>
              <span className="cert-item__icon" aria-hidden="true">
                <AwardIcon size={18} />
              </span>
              <div className="cert-item__body">
                <strong>{cert.name}</strong>
                <span className="cert-item__meta">
                  {cert.issuer}
                  {cert.issue_date ? ` · ${new Date(cert.issue_date).getFullYear()}` : ""}
                </span>
              </div>
              {cert.credential_url ? (
                <a
                  href={cert.credential_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`Verify ${cert.name} credential`}
                >
                  <ExternalIcon size={15} />
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}