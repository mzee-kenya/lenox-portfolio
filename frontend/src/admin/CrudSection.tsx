import { useEffect, useMemo, useState } from "react";
import { api, errorMessage } from "../services/api";
import { Modal } from "../components/Modal";
import { Button } from "../components/Button";
import { AlertIcon, PencilIcon, PlusIcon, RefreshIcon, TrashIcon } from "../components/icons";
import { useToast } from "../hooks/useToast";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "boolean"
  | "select"
  | "list"
  | "tags";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  help?: string;
}

interface CrudRow {
  id: number;
  [key: string]: unknown;
}

interface CrudSectionProps {
  endpoint: string;
  title: string;
  description?: string;
  fields: FieldDef[];
  searchable?: boolean;
  display: (row: CrudRow) => string;
}

function emptyValue(def: FieldDef): unknown {
  switch (def.type) {
    case "boolean":
      return false;
    case "number":
      return 0;
    case "list":
    case "tags":
      return [];
    default:
      return "";
  }
}

export function CrudSection({ endpoint, title, description, fields, searchable = false, display }: CrudSectionProps) {
  const [rows, setRows] = useState<CrudRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CrudRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const { push } = useToast();

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .get<CrudRow[]>(endpoint)
      .then(({ data }) => setRows(data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [endpoint]);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  }, [rows, query]);

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    setForm(Object.fromEntries(fields.map((f) => [f.name, emptyValue(f)])));
  };

  const openEdit = (row: CrudRow) => {
    setEditing(row);
    setCreating(false);
    setForm(Object.fromEntries(fields.map((f) => [f.name, row[f.name] ?? emptyValue(f)])));
  };

  const setValue = (name: string, value: unknown) => setForm((f) => ({ ...f, [name]: value }));

  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const save = async () => {
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      let v = form[f.name] ?? emptyValue(f);
      if (f.type === "number") v = Number(v) || 0;
      if (f.type === "date" && !v) v = null;
      if (f.type === "tags") v = Array.isArray(v) ? v : (v as string).split(",").map((s) => s.trim()).filter(Boolean);
      payload[f.name] = v;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`${endpoint}${editing.id}/`, payload);
        push("success", "Changes saved.");
      } else {
        await api.post(endpoint, payload);
        push("success", "Item created.");
      }
      close();
      load();
    } catch (err) {
      push("error", errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: CrudRow) => {
    if (!window.confirm(`Delete "${display(row)}"? This cannot be undone.`)) return;
    try {
      await api.del(`${endpoint}${row.id}/`);
      push("success", "Item deleted.");
      load();
    } catch (err) {
      push("error", errorMessage(err));
    }
  };

  return (
    <section className="admin-panel">
      <header className="admin-panel__head">
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        <div className="admin-panel__tools">
          {searchable ? (
            <input
              className="panel-input"
              type="search"
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={`Search ${title}`}
            />
          ) : null}
          <Button kind="primary" size="sm" icon={PlusIcon} onClick={openCreate}>
            Add
          </Button>
        </div>
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
              <span className="table-row__main">{display(row)}</span>
              <span className="table-row__actions">
                <button className="icon-btn" onClick={() => openEdit(row)} aria-label="Edit">
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
        <p className="admin-empty">Nothing here yet. Add the first one.</p>
      )}

      <Modal
        open={creating || Boolean(editing)}
        onClose={close}
        title={creating ? `Add ${title.toLowerCase()}` : `Edit ${title.toLowerCase()}`}
        wide={fields.some((f) => f.type === "textarea" || f.type === "list")}
      >
        <div className="form-grid">
          {fields.map((f) => {
            if (f.type === "boolean") {
              return (
                <label className="field field--inline" key={f.name}>
                  <input
                    type="checkbox"
                    checked={Boolean(form[f.name])}
                    onChange={(e) => setValue(f.name, e.target.checked)}
                  />
                  <span>{f.label}</span>
                </label>
              );
            }
            if (f.type === "select") {
              return (
                <label className="field" key={f.name}>
                  <span>{f.label}</span>
                  <select
                    value={(form[f.name] as string) ?? ""}
                    onChange={(e) => setValue(f.name, e.target.value)}
                    required={f.required}
                  >
                    {(f.options ?? []).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              );
            }
            if (f.type === "list" || f.type === "tags") {
              const val = (form[f.name] as unknown[]) ?? [];
              return (
                <label className="field" key={f.name}>
                  <span>{f.label}</span>
                  <input
                    required={f.required}
                    value={(val as string[]).join(", ")}
                    onChange={(e) =>
                      setValue(
                        f.name,
                        e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                      )
                    }
                    placeholder={f.type === "tags" ? "Comma-separated tags" : f.placeholder ?? "Comma-separated items"}
                  />
                  {f.help ? <span className="hint">{f.help}</span> : null}
                </label>
              );
            }
            return (
              <label className="field" key={f.name}>
                <span>{f.label}</span>
                {f.type === "textarea" ? (
                  <textarea
                    className="panel-textarea"
                    required={f.required}
                    value={(form[f.name] as string) ?? ""}
                    onChange={(e) => setValue(f.name, e.target.value)}
                    placeholder={f.placeholder}
                  />
                ) : (
                  <input
                    className="panel-input"
                    type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                    required={f.required}
                    value={(form[f.name] as string) ?? ""}
                    onChange={(e) => setValue(f.name, e.target.value)}
                    placeholder={f.placeholder}
                  />
                )}
              </label>
            );
          })}
        </div>

        <div className="admin-panel__footer">
          <Button kind="ghost" onClick={close}>
            Cancel
          </Button>
          <Button kind="primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </Modal>
    </section>
  );
}