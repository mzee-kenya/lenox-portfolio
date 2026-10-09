import { useEffect, useState } from "react";
import { api, errorMessage } from "../services/api";
import type { ContactMessage } from "../types";
import { Modal } from "../components/Modal";
import { Button } from "../components/Button";
import { useToast } from "../hooks/useToast";
import { AlertIcon, EyeIcon, TrashIcon } from "../components/icons";

type StatusFilter = "all" | "new" | "read" | "archived";

const STATUS_ORDER: StatusFilter[] = ["all", "new", "read", "archived"];

export function AdminMessages() {
  const [rows, setRows] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>("new");
  const [viewing, setViewing] = useState<ContactMessage | null>(null);
  const { push } = useToast();

  const load = () => {
    setLoading(true);
    setError(null);
    const query = status === "all" ? "" : `?status=${status}`;
    api
      .get<ContactMessage[]>(`/contact/messages/${query}`)
      .then(({ data }) => setRows(data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [status]);

  const updateStatus = async (row: ContactMessage, next: ContactMessage["status"]) => {
    try {
      await api.patch(`/contact/messages/${row.id}/`, { status: next });
      if (viewing?.id === row.id) setViewing({ ...viewing, status: next });
      push("success", `Marked as ${next}.`);
      load();
    } catch (err) {
      push("error", errorMessage(err));
    }
  };

  const remove = async (row: ContactMessage) => {
    if (!window.confirm(`Delete message from ${row.name}?`)) return;
    try {
      await api.del(`/contact/messages/${row.id}/`);
      if (viewing?.id === row.id) setViewing(null);
      push("success", "Message deleted.");
      load();
    } catch (err) {
      push("error", errorMessage(err));
    }
  };

  return (
    <section className="admin-panel">
      <header className="admin-panel__head">
        <div>
          <h1>Messages</h1>
          <p>Enquiries from the contact form, validated and rate-limited on submission.</p>
        </div>
      </header>

      {error ? (
        <div className="alert alert--error" role="alert">
          <AlertIcon size={16} /> {error}
        </div>
      ) : null}

      <div className="filter-row" role="group" aria-label="Filter messages">
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            className={`chip chip--filter${status === s ? " is-active" : ""}`}
            onClick={() => setStatus(s)}
            type="button"
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="skeleton skeleton--card" aria-label="Loading" />
      ) : rows.length ? (
        <ul className="table-rows">
          {rows.map((row) => (
            <li className="table-row" key={row.id}>
              <span className="table-row__main">
                <strong>
                  {row.subject || "(no subject)"}
                  {row.status === "new" ? <em className="admin-warn"> new</em> : null}
                </strong>
                <small>
                  {row.name} · <a href={`mailto:${row.email}`}>{row.email}</a> ·{" "}
                  {new Date(row.created_at).toLocaleString()}
                </small>
              </span>
              <span className="table-row__actions">
                <button className="icon-btn" onClick={() => { setViewing(row); updateStatus(row, "read"); }} aria-label="View message">
                  <EyeIcon size={16} />
                </button>
                <button className="icon-btn" onClick={() => remove(row)} aria-label="Delete message">
                  <TrashIcon size={16} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="admin-empty">No messages in this view.</p>
      )}

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title="Message" wide>
        {viewing ? (
          <div className="message-detail">
            <dl className="kv-list">
              <div>
                <dt>From</dt>
                <dd>
                  {viewing.name} — <a href={`mailto:${viewing.email}`}>{viewing.email}</a>
                </dd>
              </div>
              <div>
                <dt>Received</dt>
                <dd>{new Date(viewing.created_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt>Subject</dt>
                <dd>{viewing.subject}</dd>
              </div>
            </dl>
            <p className="message-detail__body">{viewing.message}</p>
            <div className="admin-panel__footer" style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "1rem" }}>
              <Button kind="ghost" onClick={() => updateStatus(viewing, "archived")}>
                Archive
              </Button>
              <Button kind="danger" onClick={() => remove(viewing)}>
                Delete
              </Button>
              <Button kind="primary" href={`mailto:${viewing.email}?subject=Re: ${encodeURIComponent(viewing.subject)}`}>
                Reply
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}