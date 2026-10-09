import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";
import { Button } from "../components/Button";
import { HomeIcon, FolderIcon, DocIcon } from "../components/icons";

export function NotFoundPage() {
  return (
    <>
      <Seo title="Page not found – Lenox Okoth" />
      <section className="nf-page">
        <div className="container nf-page__inner">
          <span className="nf-page__code" aria-hidden="true">
            404
          </span>
          <h1>This page drifted off the map</h1>
          <p>The link may be broken, or the page moved. Let&apos;s get you back on track.</p>
          <div className="nf-page__actions">
            <Button href="/" icon={HomeIcon}>
              Back home
            </Button>
            <Button href="/projects" kind="secondary" icon={FolderIcon}>
              Projects
            </Button>
            <Button href="/resume" kind="ghost" icon={DocIcon}>
              Resume
            </Button>
          </div>
          <Link to="/" className="link-muted">
            Lenox Okoth — Full-Stack Software Engineer
          </Link>
        </div>
      </section>
    </>
  );
}