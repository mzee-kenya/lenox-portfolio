import { Link } from "react-router-dom";
import { useContent } from "../../hooks/useContent";
import { GitHubIcon, LinkedInIcon, MailIcon, iconForLabel } from "../icons";

const normalizeUrl = (url: string) => url.trim().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "").toLowerCase();

export function Footer() {
  const { content } = useContent();
  const profile = content?.profile;
  const year = new Date().getFullYear();

  const shown = new Set<string>();
  if (profile?.github_url) shown.add(normalizeUrl(profile.github_url));
  if (profile?.linkedin_url) shown.add(normalizeUrl(profile.linkedin_url));
  if (profile?.email) shown.add(normalizeUrl(profile.email));
  const socialLinks = (content?.social_links ?? []).filter((l) => !shown.has(normalizeUrl(l.url)));

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <div className="brand">
            <span className="brand__mark" aria-hidden="true">
              L
            </span>
            <span className="brand__text">{profile?.name ?? "Lenox Okoth"}</span>
          </div>
          <p>Full-Stack Software Engineer building dependable, production-grade products.</p>
        </div>

        <nav className="footer__nav" aria-label="Footer">
          <Link to="/">Home</Link>
          <Link to="/projects">Projects</Link>
          <Link to="/resume">Resume</Link>
          <a href="/#contact">Contact</a>
        </nav>

        <div className="footer__social" aria-label="Social links">
          {profile?.github_url ? (
            <a href={profile.github_url} target="_blank" rel="noreferrer noopener" aria-label="GitHub">
              <GitHubIcon size={18} />
            </a>
          ) : null}
          {profile?.linkedin_url ? (
            <a href={profile.linkedin_url} target="_blank" rel="noreferrer noopener" aria-label="LinkedIn">
              <LinkedInIcon size={18} />
            </a>
          ) : null}
          {socialLinks.map((l) => {
            const Icon = iconForLabel(l.icon || l.label);
            return (
              <a key={l.id} href={l.url} target="_blank" rel="noreferrer noopener" aria-label={l.label}>
                <Icon size={18} />
              </a>
            );
          })}
          {profile?.email ? (
            <a href={`mailto:${profile.email}`} aria-label="Email">
              <MailIcon size={18} />
            </a>
          ) : null}
        </div>
      </div>
      <div className="container footer__bottom">
        <span>
          © {year} {profile?.name ?? "Lenox Okoth"}. Built with React &amp; Django.
        </span>
        {profile?.website_url ? (
          <a href={profile.website_url} target="_blank" rel="noreferrer noopener">
            {profile.website_url.replace(/^https?:\/\//, "")}
          </a>
        ) : null}
      </div>
    </footer>
  );
}