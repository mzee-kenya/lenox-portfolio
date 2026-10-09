import { Button } from "./Button";
import { ArrowRightIcon, DownloadIcon, MailIcon } from "./icons";
import { useContent } from "../hooks/useContent";
import { useReveal } from "../hooks/useUi";

export function Hero() {
  const { content } = useContent();
  const profile = content?.profile;

  const { ref, classes } = useReveal<HTMLDivElement>();
  const name = profile?.name ?? "Lenox Okoth";

  const monogram = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");

  return (
    <section className="hero" id="home">
      <div className="container hero__inner">
        <div ref={ref} className={classes}>
          <span className="hero__availability">
            <span className="hero__dot" aria-hidden="true" />
            Available for opportunities
          </span>
          <h1 className="hero__title">
            Hi, I&apos;m <span className="text-accent">{name}</span>.
          </h1>
          <p className="hero__subtitle">{profile?.role_tagline ?? profile?.title}</p>
          <p className="hero__summary">{profile?.summary}</p>

          <div className="hero__actions">
            <Button href="/projects" icon={ArrowRightIcon}>
              View my work
            </Button>
            <Button href="/resume" kind="secondary">
              <DownloadIcon size={17} /> Resume
            </Button>
            <Button href="/#contact" kind="ghost">
              <MailIcon size={17} /> Get in touch
            </Button>
          </div>

          <div className="hero__meta">
            {profile?.location ? <span>📍 {profile.location}</span> : null}
            {profile?.github_url ? (
              <a href={profile.github_url} target="_blank" rel="noreferrer noopener">
                GitHub ↗
              </a>
            ) : null}
            {profile?.linkedin_url ? (
              <a href={profile.linkedin_url} target="_blank" rel="noreferrer noopener">
                LinkedIn ↗
              </a>
            ) : null}
          </div>
        </div>

        {profile?.photo ? (
          <div className="hero__photo" aria-hidden="true">
            <img src={profile.photo} alt="" />
          </div>
        ) : (
          <div className="hero__monogram" aria-hidden="true">
            {monogram}
          </div>
        )}
      </div>
    </section>
  );
}