import { useEffect, useState } from "react";
import { api, errorMessage } from "../services/api";
import { Button } from "../components/Button";
import { useToast } from "../hooks/useToast";
import { AlertIcon } from "../components/icons";

interface ProfileForm {
  id: number | null;
  name: string;
  title: string;
  brand: string;
  role_tagline: string;
  summary: string;
  about: string;
  location: string;
  email: string;
  phone: string;
  photo: string;
  github_url: string;
  linkedin_url: string;
  website_url: string;
  meta_title: string;
  meta_description: string;
}

const empty: ProfileForm = {
  id: null,
  name: "",
  title: "",
  brand: "",
  role_tagline: "",
  summary: "",
  about: "",
  location: "",
  email: "",
  phone: "",
  photo: "",
  github_url: "",
  linkedin_url: "",
  website_url: "",
  meta_title: "",
  meta_description: "",
};

export function AdminProfile() {
  const [form, setForm] = useState<ProfileForm>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { push } = useToast();

  useEffect(() => {
    api
      .get<ProfileForm>("/profile/")
      .then(({ data }) => setForm({ ...empty, ...data }))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof ProfileForm, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    if (!form.id) return;
    setSaving(true);
    setError(null);
    try {
      const { id, ...payload } = form;
      await api.patch(`/profile/${id}/`, payload);
      push("success", "Profile saved. The public site now shows these details.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="skeleton skeleton--card" aria-label="Loading" style={{ height: "360px" }} />;

  return (
    <div className="admin-panel">
      <header className="admin-panel__head">
        <div>
          <h1>Profile</h1>
          <p>Identity, bio and social links shown across the site and on the resume.</p>
        </div>
        <Button kind="primary" onClick={save} disabled={saving || !form.id}>
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </header>

      {error ? (
        <div className="alert alert--error" role="alert">
          <AlertIcon size={16} /> {error}
        </div>
      ) : null}

      <div className="form-grid form-grid--3">
        <Label text="Full name" required>
          <input className="panel-input" required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Label>
        <Label text="Headline / title">
          <input className="panel-input" value={form.title} onChange={(e) => set("title", e.target.value)} />
        </Label>
        <Label text="Brand (nav logo text)">
          <input className="panel-input" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
        </Label>
        <Label text="Tagline">
          <input className="panel-input" value={form.role_tagline} onChange={(e) => set("role_tagline", e.target.value)} />
        </Label>
        <Label text="Location">
          <input className="panel-input" value={form.location} onChange={(e) => set("location", e.target.value)} />
        </Label>
        <Label text="Email">
          <input className="panel-input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Label>
        <Label text="Phone">
          <input className="panel-input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Label>
        <Label text="Photo URL">
          <input className="panel-input" value={form.photo} onChange={(e) => set("photo", e.target.value)} />
        </Label>
        <Label text="Website URL">
          <input className="panel-input" value={form.website_url} onChange={(e) => set("website_url", e.target.value)} />
        </Label>
        <Label text="GitHub URL">
          <input className="panel-input" value={form.github_url} onChange={(e) => set("github_url", e.target.value)} />
        </Label>
        <Label text="LinkedIn URL">
          <input className="panel-input" value={form.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} />
        </Label>
        <Label text="Meta title (SEO)">
          <input className="panel-input" value={form.meta_title} onChange={(e) => set("meta_title", e.target.value)} />
        </Label>
      </div>

      <Label text="Summary (short hero blurb)">
        <textarea className="panel-textarea" rows={3} value={form.summary} onChange={(e) => set("summary", e.target.value)} />
      </Label>
      <Label text="About (long form, use '-' bullets for highlights list)">
        <textarea className="panel-textarea" rows={6} value={form.about} onChange={(e) => set("about", e.target.value)} />
      </Label>
      <Label text="Meta description (SEO)">
        <textarea className="panel-textarea" rows={2} value={form.meta_description} onChange={(e) => set("meta_description", e.target.value)} />
      </Label>
    </div>
  );
}

function Label({ text, children, required }: { text: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="field">
      <span>
        {text}
        {required ? <span className="req"> *</span> : null}
      </span>
      {children}
    </label>
  );
}