import { useState, type FormEvent } from "react";
import { Section, SectionHead } from "./Section";
import { useContent } from "../hooks/useContent";
import { useReveal } from "../hooks/useUi";
import { useToast } from "../hooks/useToast";
import { Button } from "./Button";
import { sendMessage } from "../services/contact";
import { errorMessage } from "../services/api";
import { track } from "../services/analytics";
import { iconForLabel } from "./icons";

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
  website: string;
  consent: boolean;
}

const emptyForm: FormState = { name: "", email: "", subject: "", message: "", website: "", consent: false };

export function ContactForm() {
  const { content } = useContent();
  const profile = content?.profile;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { push } = useToast();
  const { ref, classes } = useReveal<HTMLDivElement>();

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.website) return;
    setBusy(true);
    setError(null);
    try {
      await sendMessage({
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
        consent: form.consent,
      });
      track("contact_submit");
      setSucceeded(true);
      push("success", "Thanks! Your message has been sent.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section id="contact">
      <SectionHead
        eyebrow="Contact"
        title="Let's build something together"
        description="Have a project in mind, a role to fill, or just want to say hi?"
      />
      <div ref={ref} className={classes}>
        <div className="contact-grid">
          <div className="contact-card">
            <h3>Contact details</h3>
            <dl className="contact-card__list">
              {profile?.email ? (
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${profile.email}`}>{profile.email}</a>
                  </dd>
                </div>
              ) : null}
              {profile?.phone ? (
                <div>
                  <dt>Phone</dt>
                  <dd>
                    <a href={`tel:${profile.phone.replace(/[^+\d]/g, "")}`}>{profile.phone}</a>
                  </dd>
                </div>
              ) : null}
              {profile?.location ? (
                <div>
                  <dt>Location</dt>
                  <dd>{profile.location}</dd>
                </div>
              ) : null}
            </dl>
            <p className="contact-card__note">
              I usually reply within 1–2 business days.
            </p>
            {content?.social_links?.length ? (
              <div className="contact-card__social" aria-label="Social links">
                {content.social_links.map((l) => {
                  const Icon = iconForLabel(l.icon || l.label);
                  return (
                    <a key={l.id} href={l.url} target="_blank" rel="noreferrer noopener" aria-label={l.label} title={l.label}>
                      <Icon size={18} />
                    </a>
                  );
                })}
              </div>
            ) : null}
          </div>

          <form className="card contact-form" onSubmit={submit} noValidate>
            <div className="form-row">
              <label className="field">
                <span>Your name</span>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={120}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Jane Doe"
                />
              </label>
              <label className="field">
                <span>Email address</span>
                <input
                  type="email"
                  required
                  maxLength={200}
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="jane@example.com"
                />
              </label>
            </div>

            <label className="field">
              <span>Subject</span>
              <input
                type="text"
                required
                minLength={3}
                maxLength={160}
                value={form.subject}
                onChange={(e) => set("subject", e.target.value)}
                placeholder="What's this about?"
              />
            </label>

            <label className="field">
              <span>Message</span>
              <textarea
                required
                minLength={20}
                maxLength={5000}
                rows={6}
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                placeholder="Tell me about your project or opportunity…"
              />
            </label>

            {/* Honeypot field — hidden from real users */}
            <label className="field hp-field" aria-hidden="true" style={{ display: "none" }}>
              <span>Website</span>
              <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set("website", e.target.value)} />
            </label>

            <label className="field field--inline consent">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => set("consent", e.target.checked)}
              />
              <span>I agree to be contacted about this message.</span>
            </label>

            {error ? (
              <div className="alert alert--error" role="alert">
                {error}
              </div>
            ) : null}

            <Button type="submit" block disabled={busy || !form.consent}>
              {busy ? "Sending…" : "Send message"}
            </Button>

            {succeeded ? (
              <p className="contact-form__success" role="status">
                Message sent successfully.
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </Section>
  );
}