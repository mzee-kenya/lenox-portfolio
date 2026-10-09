import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../services/api";
import { Modal } from "../components/Modal";
import { Button } from "../components/Button";
import { useToast } from "../hooks/useToast";
import { AlertIcon, PencilIcon, PlusIcon, RefreshIcon, TrashIcon } from "../components/icons";

interface FeatureLine {
  text: string;
  status: string;
}

interface ProjectForm {
  id: number | null;
  name: string;
  slug: string;
  tagline: string;
  category: string;
  status: string;
  description: string;
  problem: string;
  solution: string;
  role: string;
  architecture: string;
  image_url: string;
  github_url: string;
  demo_url: string;
  featured: boolean;
  published: boolean;
  order: number;
  started_at: string;
  technologies: string;
  features: string;
  challenge_list: string;
  solution_list: string;
  result_list: string;
  lesson_list: string;
}

const emptyForm: ProjectForm = {
  id: null,
  name: "",
  slug: "",
  tagline: "",
  category: "",
  status: "implemented",
  description: "",
  problem: "",
  solution: "",
  role: "",
  architecture: "",
  image_url: "",
  github_url: "",
  demo_url: "",
  featured: false,
  published: false,
  order: 0,
  started_at: "",
  technologies: "",
  features: "",
  challenge_list: "",
  solution_list: "",
  result_list: "",
  lesson_list: "",
};

function toLines(value: string | unknown): string {
  if (Array.isArray(value)) return value.join("\n");
  return (value as string) ?? "";
}

function featureLines(value: string): FeatureLine[] {
  return value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^\(([^)]+)\)\s*(.*)/);
      if (m) return { status: m[1], text: m[2] };
      return { status: "implemented", text: line };
    });
}

export function AdminProjects() {
  const [rows, setRows] = useState<
    {
      id: number;
      name: string;
      slug: string;
      status: string;
      published: boolean;
      featured: boolean;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ProjectForm | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { push } = useToast();

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .get<ProjectForm[]>(`/projects/`)
      .then(({ data }) =>
        setRows(
          data.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            status: p.status,
            published: p.published,
            featured: p.featured,
          })) as typeof rows
        )
      )
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm(emptyForm);
  };

  const openEdit = async (id: number) => {
    try {
      const { data } = await api.get<
        ProjectForm & {
          technologies: string[];
          features: FeatureLine[];
          case_study?: {
            challenges: string[];
            solutions: string[];
            results: string[];
            lessons: string[];
          } | null;
        }
      >(`/projects/${id}/`);
      setCreating(false);
      setEditing({
        ...emptyForm,
        ...data,
        technologies: (data.technologies ?? []).join(", "),
        features: (data.features ?? []).map((f) => (f.status && f.status !== "implemented" ? `(${f.status}) ${f.text}` : f.text)).join("\n"),
        challenge_list: toLines(data.case_study?.challenges ?? []),
        solution_list: toLines(data.case_study?.solutions ?? []),
        result_list: toLines(data.case_study?.results ?? []),
        lesson_list: toLines(data.case_study?.lessons ?? []),
      });
    } catch (err) {
      push("error", errorMessage(err));
    }
  };

  const set = <K extends keyof ProjectForm>(key: K, value: ProjectForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const save = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      push("error", "Name and slug are required.");
      return;
    }
    const payload = {
      name: form.name,
      slug: form.slug,
      tagline: form.tagline,
      category: form.category,
      status: form.status,
      description: form.description,
      problem: form.problem,
      solution: form.solution,
      role: form.role,
      architecture: form.architecture,
      image_url: form.image_url,
      github_url: form.github_url,
      demo_url: form.demo_url,
      featured: form.featured,
      published: form.published,
      order: Number(form.order) || 0,
      started_at: form.started_at || null,
      technologies: form.technologies.split(",").map((s) => s.trim()).filter(Boolean),
      features: featureLines(form.features),
      challenge_list: form.challenge_list.split("\n").map((s) => s.trim()).filter(Boolean),
      solution_list: form.solution_list.split("\n").map((s) => s.trim()).filter(Boolean),
      result_list: form.result_list.split("\n").map((s) => s.trim()).filter(Boolean),
      lesson_list: form.lesson_list.split("\n").map((s) => s.trim()).filter(Boolean),
    };
    setSaving(true);
    try {
      if (editing?.id) {
        await api.patch(`/projects/${editing.id}/`, payload);
        push("success", "Project updated.");
      } else {
        await api.post("/projects/", payload);
        push("success", "Project created.");
      }
      close();
      load();
    } catch (err) {
      push("error", errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: { id: number; name: string }) => {
    if (!window.confirm(`Delete "${row.name}" and its case study?`)) return;
    try {
      await api.del(`/projects/${row.id}/`);
      push("success", "Project deleted.");
      load();
    } catch (err) {
      push("error", errorMessage(err));
    }
  };

  const filtered = useMemo(() => rows, [rows]);

  return (
    <section className="admin-panel">
      <header className="admin-panel__head">
        <div>
          <h1>Projects</h1>
          <p>Each project powers a case-study page. Add features and case-study lists for the narrative sections.</p>
        </div>
        <Button kind="primary" size="sm" icon={PlusIcon} onClick={openCreate}>
          New project
        </Button>
      </header>

      {error ? (
        <div className="alert alert--error" role="alert">
          <AlertIcon size={16} /> {error}{" "}
          <button className="btn btn--sm" onClick={load}>
            <RefreshIcon size={14} /> Retry
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="skeleton skeleton--card" aria-label="Loading" />
      ) : filtered.length ? (
        <ul className="table-rows">
          {filtered.map((row) => (
            <li className="table-row" key={row.id}>
              <span className="table-row__main">
                <strong>{row.name}</strong>
                <small>
                  {row.status}
                  {row.published ? "" : " · draft"}
                  {row.featured ? " · ★ featured" : ""}
                </small>
              </span>
              <span className="table-row__actions">
                <Link to={`/projects/${row.slug}`} className="icon-btn" target="_blank" rel="noreferrer noopener" aria-label="View">
                  ↗
                </Link>
                <button className="icon-btn" onClick={() => openEdit(row.id)} aria-label="Edit">
                  <PencilIcon size={16} />
                </button>
                <button className="icon-btn" onClick={() => remove(row)} aria-label="Delete">
                  <TrashIcon size={16} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="admin-empty">No projects yet.</p>
      )}

      <Modal open={creating || Boolean(editing)} onClose={close} title={creating ? "New project" : "Edit project"} wide>
        <div className="form-grid form-grid--3">
          <Label text="Name" required>
            <input className="panel-input" required value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Label>
          <Label text="Slug (URL) *" required>
            <input className="panel-input" required value={form.slug} onChange={(e) => set("slug", e.target.value)} />
          </Label>
          <Label text="Category">
            <input className="panel-input" value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="e.g. POS" />
          </Label>
          <Label text="Status">
            <select className="panel-input" value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="implemented">Implemented</option>
              <option value="in_progress">In development</option>
              <option value="planned">Planned</option>
            </select>
          </Label>
          <Label text="Started (date)">
            <input className="panel-input" type="date" value={form.started_at} onChange={(e) => set("started_at", e.target.value)} />
          </Label>
          <Label text="Order (0 = first)">
            <input className="panel-input" type="number" value={String(form.order)} onChange={(e) => set("order", Number(e.target.value) || 0)} />
          </Label>
          <Label text="Tagline">
            <input className="panel-input" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
          </Label>
          <Label text="Image URL">
            <input className="panel-input" value={form.image_url} onChange={(e) => set("image_url", e.target.value)} />
          </Label>
          <Label text="GitHub URL">
            <input className="panel-input" value={form.github_url} onChange={(e) => set("github_url", e.target.value)} />
          </Label>
          <Label text="Demo URL">
            <input className="panel-input" value={form.demo_url} onChange={(e) => set("demo_url", e.target.value)} />
          </Label>
          <Label text="Technologies (comma-separated)">
            <input className="panel-input" value={form.technologies} onChange={(e) => set("technologies", e.target.value)} placeholder="Django, React, PostgreSQL" />
          </Label>
          <div className="field field--inline">
            <label className="field field--inline">
              <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
              <span>Featured</span>
            </label>
            <label className="field field--inline">
              <input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} />
              <span>Published</span>
            </label>
          </div>
          <div className="field field--full">
            <span>Description</span>
            <textarea className="panel-textarea" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="field field--full">
            <span>Problem</span>
            <textarea className="panel-textarea" rows={3} value={form.problem} onChange={(e) => set("problem", e.target.value)} />
          </div>
          <div className="field field--full">
            <span>Solution</span>
            <textarea className="panel-textarea" rows={3} value={form.solution} onChange={(e) => set("solution", e.target.value)} />
          </div>
          <div className="field field--full">
            <span>Architecture notes</span>
            <textarea className="panel-textarea" rows={4} value={form.architecture} onChange={(e) => set("architecture", e.target.value)} />
          </div>
          <div className="field field--full">
            <span>Role</span>
            <textarea className="panel-textarea" rows={3} value={form.role} onChange={(e) => set("role", e.target.value)} />
          </div>
          <div className="field field--full">
            <span>Features (one per line, prefix <code>(in_progress)</code> or <code>(planned)</code> to set status)</span>
            <textarea className="panel-textarea" rows={4} value={form.features} onChange={(e) => set("features", e.target.value)} />
          </div>
          <div className="field field--full">
            <span>Case study — challenges (one per line)</span>
            <textarea className="panel-textarea" rows={3} value={form.challenge_list} onChange={(e) => set("challenge_list", e.target.value)} />
          </div>
          <div className="field field--full">
            <span>Case study — solutions (one per line)</span>
            <textarea className="panel-textarea" rows={3} value={form.solution_list} onChange={(e) => set("solution_list", e.target.value)} />
          </div>
          <div className="field field--full">
            <span>Case study — results (one per line)</span>
            <textarea className="panel-textarea" rows={3} value={form.result_list} onChange={(e) => set("result_list", e.target.value)} />
          </div>
          <div className="field field--full">
            <span>Case study — lessons (one per line)</span>
            <textarea className="panel-textarea" rows={3} value={form.lesson_list} onChange={(e) => set("lesson_list", e.target.value)} />
          </div>
        </div>

        <div className="admin-panel__footer">
          <Button kind="ghost" onClick={close}>
            Cancel
          </Button>
          <Button kind="primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save project"}
          </Button>
        </div>
      </Modal>
    </section>
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