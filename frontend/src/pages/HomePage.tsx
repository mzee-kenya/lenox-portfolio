import { Seo } from "../components/Seo";
import { Hero } from "../components/Hero";
import { About } from "../components/About";
import { Skills } from "../components/Skills";
import { Projects } from "../components/Projects";
import { Experience } from "../components/Experience";
import { Education } from "../components/Education";
import { Certifications } from "../components/Certifications";
import { ContactForm } from "../components/Contact";
import { useContent } from "../hooks/useContent";

export function HomePage() {
  const { content } = useContent();

  return (
    <>
      <Seo
        title={content?.meta?.title ?? (content?.profile ? `${content.profile.name} – ${content.profile.title}` : undefined)}
        description={
          content?.meta?.description ??
          content?.profile?.summary ??
          "Full-stack software engineer building dependable, production-grade products."
        }
      />
      <Hero />
      <About />
      <Skills />
      <Projects featuredOnly compact />
      <Experience />
      <Education />
      <Certifications />
      <ContactForm />
    </>
  );
}