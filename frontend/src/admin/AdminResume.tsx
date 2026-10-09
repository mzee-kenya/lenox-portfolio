import { useCallback, useEffect, useState } from "react";
import { api, errorMessage } from "../services/api";
import { Modal } from "../components/Modal";
import { Button } from "../components/Button";
import { useToast } from "../hooks/useToast";
import { AlertIcon, PencilIcon, PlusIcon, RefreshIcon, TrashIcon } from "../components/icons";

interface ResumeDoc {
  id: number;
  summary: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  references_note: string;
  is_active: boolean;
}

interface VersionRow {
  id: number;
  slug: string;
  title: string;
  target_role: string;
  summary: string;
  emphasis: string;
  is_default: boolean;
  enabled: boolean;
  order: number;
}

interface SectionRow {
  id: number;
  key: string;
  version: number;
  title: string;
  enabled: boolean;
  order: number;
  data: Record<string, unknown>;
}

const emptyVersion: Omit<VersionRow, "id"> = {
  slug: "",
  title: "",
  target_role: "",
  summary: "",
  emphasis: "balanced",
  is_default: false,
  enabled: true,
  order: 0,
};

const SECTION_KEYS = ["summary", "skills", "experience", "projects", "education", "certifications", "links"];

export function AdminResume() {
  const [doc, setDoc] = useState<ResumeDoc | null>(null);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [activeVersion, setActiveVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [versionModal, setVersionModal] = useState<{ open: boolean; row: Omit<VersionRow, "id">; id: number | null }>({
    open: false,
    row: emptyVersion,
    id: null,
  });
  const [sectionModal, setSectionModal] = useState<{ open: boolean; row: SectionRow | null }>({ open: false, row: null });
  const { push } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([api.get<ResumeDoc[]>(`/resume/`), api.get<VersionRow[]>(`/resume/versions/`)])
      .then(async ([docs, vers]) => {
        setDoc(docs.data[0] ?? null);
        setVersions(vers.data);
        const target = vers.data.find((v) => v.is_default) ?? vers.data[0];
        if (target) setActiveVersion((prev) => prev ?? target.id);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!activeVersion) return;
    api
      .get<SectionRow[]>(`/resume/sections/?version=${activeVersion}`)
      .then(({ data }) => setSections(data))
      .catch(() => setSections([]));
  }, [activeVersion]);

  const saveDoc = async () => {
    if (!doc) return;
    setSaving(true);
    try {
      const { id, ...payload } = doc;
      await api.patch(`/resume/${id}/`, payload);
      push("success", "Resume settings saved.");
    } catch (err) {
      push("error", errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const saveVersion = async () => {
    const row = versionModal.row;
    if (!row.slug.trim() || !row.title.trim()) {
      push("error", "Slug and title are required.");
      return;
    }
    try {
      if (versionModal.id) {
        await api.patch(`/resume/versions/${versionModal.id}/`, row);
      } else {
        await api.post(`/resume/versions/`, row);
      }
      push("success", "Version saved.");
      setVersionModal({ open: false, row: emptyVersion, id: null });
      load();
    } catch (err) {
      push("error", errorMessage(err));
    }
  };

  const removeVersion = async (row: VersionRow) => {
    if (!window.confirm(`Delete version "${row.title}" (${row.slug})?`)) return;
    try {
      await api.del(`/resume/versions/${row.id}/`);
      setActiveVersion(null);
      push("success", "Version deleted.");
      load();
    } catch (err) {
      push("error", errorMessage(err));
    }
  };

  const saveSection = async () => {
    const row = sectionModal.row;
    if (!row) return;
    let parsed: Record<string, unknown>;
    try {
      parsed =
        typeof row.data === "string"
          ? (JSON.parse((row.data as string).trim() || "{}") as Record<string, unknown>)
          : (row.data as Record<string, unknown>);
    } catch {
      push("error", "Section data is not valid JSON.");
      return;
    }
    try {
      await api.patch(`/resume/sections/${row.id}/`, { ...row, data: parsed });
      push("success", "Section saved.");
      setSectionModal({ open: false, row: null });
      const v = activeVersion ?? versions.find((x) => x.is_default)?.id;
      if (v) setActiveVersion(v);
    } catch (err) {
      push("error", errorMessage(err));
    }
  };

  const addSection = async () => {
    if (!activeVersion) {
      push("error", "Save a version first.");
      return;
    }
    try {
      const { data } = await api.post<SectionRow>(`/resume/sections/`, {
        key: "",
        version: activeVersion,
        title: "",
        enabled: true,
        order: sections.length,
        data: { bullets: [] },
      });
      push("success", "Section created. Edit its key and JSON data.");
      setSections((prev) => [...prev, data]);
    } catch (err) {
      push("error", errorMessage(err));
    }
  };

  const removeSection = async (row: SectionRow) => {
    if (!window.confirm(`Delete the "${row.title || row.key}" section?`)) return;
    try {
      await api.del(`/resume/sections/${row.id}/`);
      setSections((prev) => prev.filter((s) => s.id !== row.id));
      push("success", "Section deleted.");
    } catch (err) {
      push("error", errorMessage(err));
    }
  };

  const setVersionField = (key: keyof Omit<VersionRow, "id">, value: unknown) =>
    setVersionModal((m) => ({ ...m, row: { ...m.row, [key]: value } }));

  if (loading) return <div className="skeleton skeleton--card" aria-label="Loading" style={{ height: "380px" }} />;

  return (
    <div className="admin-resume">
      <header className="admin-panel__head">
        <div>
          <h1>Resume & builder</h1>
          <p>General settings, target-role versions, and per-version AI-ready sections.</p>
        </div>
        <div className="resume-actions">
          <Button kind="secondary" href="/resume">
            Open resume page
          </Button>
          <Button
            kind="primary"
            icon={RefreshIcon}
            disabled={!doc}
            onClick={saveDoc}
          >
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </header>

      {error ? (
        <div className="alert alert--error" role="alert">
          <AlertIcon size={16} /> {error}{" "}
          <button className="btn btn--sm" onClick={load}>
            Try again
          </button>
        </div>
      ) : null}

      <div className="admin-cols">
        <section className="admin-panel">
          <header className="admin-panel__head">
            <div>
              <h2>Base settings</h2>
              <p>These are overridden by version sections when present.</p>
            </div>
          </header>
          {doc ? (
            <div className="form-grid form-grid--3">
              <Label text="Email">
                <input className="panel-input" value={doc.email} onChange={(e) => setDoc({ ...doc, email: e.target.value })} />
              </Label>
              <Label text="Phone">
                <input className="panel-input" value={doc.phone} onChange={(e) => setDoc({ ...doc, phone: e.target.value })} />
              </Label>
              <Label text="Location">
                <input className="panel-input" value={doc.location} onChange={(e) => setDoc({ ...doc, location: e.target.value })} />
              </Label>
              <Label text="Website">
                <input className="panel-input" value={doc.website} onChange={(e) => setDoc({ ...doc, website: e.target.value })} />
              </Label>
              <Label text="References note">
                <input className="panel-input" value={doc.references_note} onChange={(e) => setDoc({ ...doc, references_note: e.target.value })} />
              </Label>
              <Label text="Active">
                <select
                  className="panel-input"
                  value={doc.is_active ? "yes" : "no"}
                  onChange={(e) => setDoc({ ...doc, is_active: e.target.value === "yes" })}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </Label>
              <div className="field field--full">
                <span>Summary</span>
                <textarea className="panel-textarea" rows={4} value={doc.summary} onChange={(e) => setDoc({ ...doc, summary: e.target.value })} />
              </div>
            </div>
          ) : (
            <p className="admin-empty">Resume record missing. Create one via the Django admin or seed command.</p>
          )}
        </section>

        <section className="admin-panel">
          <header className="admin-panel__head">
            <div>
              <h2>Versions</h2>
              <p>Target-role copies of the resume (e.g. backend, frontend).</p>
            </div>
            <Button icon={PlusIcon} size="sm" kind="primary" onClick={() => setVersionModal({ open: true, row: emptyVersion, id: null })}>
              Add version
            </Button>
          </header>
          {versions.length ? (
            <ul className="table-rows">
              {versions.map((v) => (
                <li className={`table-row${activeVersion === v.id ? " is-active" : ""}`} key={v.id}>
                  <span className="table-row__main">
                    <strong>{v.title}</strong>
                    <small>
                      /{v.slug} · {v.target_role || "no target role"}
                      {v.is_default ? " · default" : ""}
                      {v.enabled ? "" : " · disabled"}
                    </small>
                  </span>
                  <span className="table-row__actions">
                    <Button
                      kind="ghost"
                      size="sm"
                      onClick={() => setActiveVersion(v.id)}
                      aria-label={`Edit sections of ${v.title}`}
                    >
                      Sections
                    </Button>
                    <button className="icon-btn" onClick={() => setVersionModal({ open: true, row: v, id: v.id })} aria-label="Edit version">
                      <PencilIcon size={16} />
                    </button>
                    <button className="icon-btn" onClick={() => removeVersion(v)} aria-label="Delete version">
                      <TrashIcon size={16} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-empty">No versions yet.</p>
          )}

          <div className="admin-panel__head" style={{ marginTop: "1.5rem" }}>
            <div>
              <h2>Sections — {versions.find((v) => v.id === activeVersion)?.title ?? "…"}</h2>
              <p>
                Keys: {SECTION_KEYS.join(", ")}. Data is JSON; bullets render from <code>{"{ \"bullets\": [...] }"}</code>.
              </p>
            </div>
            <Button icon={PlusIcon} size="sm" kind="secondary" onClick={addSection}>
              Add section
            </Button>
          </div>

          {sections.length ? (
            <ul className="table-rows">
              {sections.map((s) => (
                <li className="table-row" key={s.id}>
                  <span className="table-row__main">
                    <strong>{s.title || s.key || "(untitled)"}</strong>
                    <small>
                      key: {s.key || "—"} · order {s.order}
                      {s.enabled ? "" : " · hidden"}
                    </small>
                  </span>
                  <span className="table-row__actions">
                    <button className="icon-btn" onClick={() => setSectionModal({ open: true, row: s })} aria-label="Edit section">
                      <PencilIcon size={16} />
                    </button>
                    <button className="icon-btn" onClick={() => removeSection(s)} aria-label="Delete section">
                      <TrashIcon size={16} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-empty">No sections for this version. Add one to control what renders.</p>
          )}
        </section>
      </div>

      <Modal
        open={versionModal.open}
        onClose={() => setVersionModal({ open: false, row: emptyVersion, id: null })}
        title={versionModal.id ? "Edit version" : "Add version"}
      >
        <div className="form-grid form-grid--2">
          <Label text="Title" required>
            <input className="panel-input" required value={versionModal.row.title} onChange={(e) => setVersionField("title", e.target.value)} />
          </Label>
          <Label text="Slug" required>
            <input className="panel-input" required value={versionModal.row.slug} onChange={(e) => setVersionField("slug", e.target.value)} placeholder="backend" />
          </Label>
          <Label text="Target role">
            <input className="panel-input" value={versionModal.row.target_role} onChange={(e) => setVersionField("target_role", e.target.value)} placeholder="Backend Engineer" />
          </Label>
          <Label text="Emphasis">
            <select className="panel-input" value={versionModal.row.emphasis} onChange={(e) => setVersionField("emphasis", e.target.value)}>
              <option value="balanced">Balanced</option>
              <option value="backend">Backend</option>
              <option value="frontend">Frontend</option>
              <option value="leadership">Leadership</option>
            </select>
          </Label>
          <div className="field field--full">
            <span>Version summary (overrides base)</span>
            <textarea className="panel-textarea" rows={3} value={versionModal.row.summary} onChange={(e) => setVersionField("summary", e.target.value)} />
          </div>
          <div className="field field--inline">
            <input type="checkbox" checked={versionModal.row.is_default} onChange={(e) => setVersionField("is_default", e.target.checked)} />
            <span>Default version</span>
          </div>
          <div className="field field--inline">
            <input type="checkbox" checked={versionModal.row.enabled} onChange={(e) => setVersionField("enabled", e.target.checked)} />
            <span>Enabled</span>
          </div>
          <Label text="Order">
            <input className="panel-input" type="number" value={String(versionModal.row.order)} onChange={(e) => setVersionField("order", Number(e.target.value) || 0)} />
          </Label>
        </div>
        <div className="admin-panel__footer">
          <Button kind="ghost" onClick={() => setVersionModal({ open: false, row: emptyVersion, id: null })}>
            Cancel
          </Button>
          <Button kind="primary" onClick={saveVersion}>
            Save version
          </Button>
        </div>
      </Modal>

      <Modal open={sectionModal.open} onClose={() => setSectionModal({ open: false, row: null })} title="Edit section" wide>
        {sectionModal.row ? (
          <div className="form-grid form-grid--3">
            <Label text="Key">
              <input className="panel-input" list="section-keys" value={sectionModal.row.key} onChange={(e) => setSectionModal((m) => ({ ...m, row: { ...m.row!, key: e.target.value } }))} />
              <datalist id="section-keys">
                {SECTION_KEYS.map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
            </Label>
            <Label text="Title">
              <input className="panel-input" value={sectionModal.row.title} onChange={(e) => setSectionModal((m) => ({ ...m, row: { ...m.row!, title: e.target.value } }))} />
            </Label>
            <Label text="Order">
              <input className="panel-input" type="number" value={String(sectionModal.row.order)} onChange={(e) => setSectionModal((m) => ({ ...m, row: { ...m.row!, order: Number(e.target.value) || 0 } }))} />
            </Label>
            <div className="field field--inline">
              <input type="checkbox" checked={sectionModal.row.enabled} onChange={(e) => setSectionModal((m) => ({ ...m, row: { ...m.row!, enabled: e.target.checked } }))} />
              <span>Enabled</span>
            </div>
            <div className="field field--full">
              <span>Data (JSON)</span>
              <textarea
                className="panel-textarea"
                rows={12}
                value={
                  typeof sectionModal.row.data === "string"
                    ? sectionModal.row.data
                    : JSON.stringify(sectionModal.row.data ?? {}, null, 2)
                }
                onChange={(e) => setSectionModal((m) => ({ ...m, row: { ...m.row!, data: e.target.value as unknown as Record<string, unknown> } }))}
              />
            </div>
          </div>
        ) : null}
        <div className="admin-panel__footer">
          <Button kind="ghost" onClick={() => setSectionModal({ open: false, row: null })}>
            Cancel
          </Button>
          <Button kind="primary" onClick={saveSection}>
            Save section
          </Button>
        </div>
      </Modal>
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