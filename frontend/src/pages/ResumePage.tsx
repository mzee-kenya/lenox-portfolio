import { useState } from "react";
import { Seo } from "../components/Seo";
import { Section, SectionHead } from "../components/Section";
import { Button } from "../components/Button";
import { ErrorState } from "../components/States";
import { MatchMyResume } from "../components/MatchMyResume";
import { useResume } from "../hooks/useResume";
import { useToast } from "../hooks/useToast";
import { downloadResume, STATUS_LABELS } from "../services/content";
import { track } from "../services/analytics";
import { DownloadIcon, MailIcon, PhoneIcon, ExternalIcon, iconForLabel } from "../components/icons";

function fmtRange(start?: string, end?: string, current?: boolean): string {
  const fmt = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  };
  return `${fmt(start)} — ${current ? "Present" : fmt(end)}`;
}

export function ResumePage() {
  const { data, loading, error, version, setVersion, reload } = useResume();
  const { push } = useToast();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (slug?: string, label?: string) => {
    setDownloading(true);
    const ok = await downloadResume(slug);
    setDownloading(false);
    if (ok) {
      track("resume_download", { slug: slug ?? "default" });
      push("success", label ? `${label} PDF downloaded.` : "PDF downloaded.");
    } else {
      push("error", "Could not download the PDF right now.");
    }
  };

  const versionMeta = data?.versions ?? [];

  return (
    <>
      <Seo
        title="Resume – Lenox Okoth"
        description="Download Lenox Okoth's resume as PDF, or preview it online with versioned/ATS-friendly layouts."
      />
      <Section tight>
        <SectionHead
          eyebrow="Resume"
          title="Resume & matching"
          description="Preview online, download as PDF, or check skills fit against a job description."
        />

        {error ? (
          <ErrorState detail={error} onRetry={reload} />
        ) : null}

        <div className="resume-toolbar">
          <div className="resume-versions">
            <span className="resume-versions__label">Version</span>
            <div role="group" aria-label="Resume version">
              <button
                type="button"
                className={`chip chip--filter${version === "default" ? " is-active" : ""}`}
                onClick={() => setVersion("default")}
                disabled={loading}
              >
                Default
              </button>
              {versionMeta.map((v) => (
                <button
                  key={v.slug}
                  type="button"
                  className={`chip chip--filter${version === v.slug ? " is-active" : ""}`}
                  onClick={() => setVersion(v.slug)}
                  disabled={loading}
                >
                  {v.title}
                </button>
              ))}
            </div>
          </div>

          <div className="resume-actions">
            <Button
              kind="primary"
              icon={DownloadIcon}
              disabled={downloading || loading}
              onClick={() => handleDownload(version === "default" ? data?.version?.slug : version, data?.version?.title)}
            >
              {downloading ? "Downloading…" : "Download PDF"}
            </Button>
            <Button kind="secondary" onClick={() => window.print()}>
              Print
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="resume-sheet shell" aria-label="Loading resume">
            <div className="skeleton skeleton--card" style={{ height: "420px" }} />
          </div>
        ) : data ? (
          <div className="resume-sheet shell">
            <header className="resume-head">
              <div>
                <h2 className="resume-head__name">{data.resume ? contentOr(data.profile?.name, "Lenox Okoth") : "Lenox Okoth"}</h2>
                <p className="resume-head__title">{data.version?.title ?? data.profile?.title}</p>
              </div>
              <div className="resume-head__contacts">
                {data.resume?.email ? (
                  <span><MailIcon size={14} /> {data.resume.email}</span>
                ) : null}
                {data.resume?.phone ? (
                  <span><PhoneIcon size={14} /> {data.resume.phone}</span>
                ) : null}
                {data.resume?.location ? (
                  <span>{data.resume.location}</span>
                ) : null}
                {data.resume?.website ? (
                  <a href={data.resume.website} target="_blank" rel="noreferrer noopener"><ExternalIcon size={14} /> {data.resume.website.replace(/^https?:\/\//, "")}</a>
                ) : null}
                {data.links?.map((l) => {
                  const Icon = iconForLabel(l.label);
                  return (
                    <a key={l.label} href={l.url} target="_blank" rel="noreferrer noopener">
                      <Icon size={14} /> {l.label}
                    </a>
                  );
                })}
              </div>
            </header>

            <div className="resume-cols">
              <div className="resume-main">
                {data.summary ? (
                  <section className="resume-block">
                    <h3>Summary</h3>
                    <p>{data.summary}</p>
                  </section>
                ) : null}

                {data.experience?.length ? (
                  <section className="resume-block">
                    <h3>Experience</h3>
                    {data.experience.map((exp, i) => (
                      <div className="resume-entry" key={i}>
                        <div className="resume-entry__head">
                          <strong>{exp.title}</strong>
                          <span>{fmtRange(exp.start_date, exp.end_date, exp.current)}</span>
                        </div>
                        <p className="resume-entry__org">
                          {exp.organization}
                          {exp.employment_type ? ` · ${exp.employment_type}` : ""}
                          {exp.location ? ` · ${exp.location}` : ""}
                        </p>
                        <ul>
                          {exp.bullets.map((b, j) => (
                            <li key={j}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </section>
                ) : null}

                {data.projects?.length ? (
                  <section className="resume-block">
                    <h3>Projects</h3>
                    {data.projects.map((p, i) => (
                      <div className="resume-entry" key={i}>
                        <div className="resume-entry__head">
                          <strong>{p.name}</strong>
                          {p.status ? <span>{STATUS_LABELS[p.status as keyof typeof STATUS_LABELS] ?? p.status}</span> : null}
                        </div>
                        {p.tagline ? <p className="resume-entry__org">{p.tagline}</p> : null}
                        {p.technologies?.length ? (
                          <p className="resume-entry__tech">{p.technologies.join(", ")}</p>
                        ) : null}
                        {p.highlights?.length ? (
                          <ul>
                            {p.highlights.map((h, j) => (
                              <li key={j}>{h.text}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </section>
                ) : null}
              </div>

              <aside className="resume-side">
                {data.skills?.length ? (
                  <section className="resume-block">
                    <h3>Skills</h3>
                    {data.skills.map((s, i) => (
                      <span className="chip chip--sm" key={i}>
                        {s.name}
                      </span>
                    ))}
                  </section>
                ) : null}

                {data.education?.length ? (
                  <section className="resume-block">
                    <h3>Education</h3>
                    {data.education.map((edu, i) => (
                      <div className="resume-entry" key={i}>
                        <strong>{edu.degree}</strong>
                        <p className="resume-entry__org">
                          {edu.school}
                          {edu.field ? ` · ${edu.field}` : ""}
                        </p>
                        <span className="resume-entry__date">{fmtRange(edu.start_date, edu.end_date, edu.current)}</span>
                      </div>
                    ))}
                  </section>
                ) : null}

                {data.certifications?.length ? (
                  <section className="resume-block">
                    <h3>Certifications</h3>
                    {data.certifications.map((c, i) => (
                      <div className="resume-entry" key={i}>
                        <strong>{c.name}</strong>
                        <p className="resume-entry__org">
                          {c.issuer}
                          {c.issue_date ? ` · ${new Date(c.issue_date).getFullYear()}` : ""}
                        </p>
                        {c.url ? (
                          <a className="resume-entry__link" href={c.url} target="_blank" rel="noreferrer noopener">
                            Verify <ExternalIcon size={12} />
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </section>
                ) : null}
              </aside>
            </div>
          </div>
        ) : null}

        <MatchMyResume versions={versionMeta} defaultSlug={data?.version?.slug} />

        <p className="resume-note">
          This layout mirrors the generated PDF. For a fillable editor and ATS keyword tuning, sign in to the{" "}
          <a href="/admin">admin dashboard</a>.
        </p>
      </Section>
    </>
  );
}

function contentOr(value: string | null | undefined, fallback: string): string {
  return (value && value.trim()) ? value : fallback;
}