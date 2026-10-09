import { useState } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { CrudSection } from "./CrudSection";
import { AdminOverview } from "./AdminOverview";
import { AdminProfile } from "./AdminProfile";
import { AdminProjects } from "./AdminProjects";
import { AdminResume } from "./AdminResume";
import { AdminMessages } from "./AdminMessages";
import { AdminReports } from "./AdminReports";
import { AdminSettings } from "./AdminSettings";
import {
  AwardIcon,
  CloseIcon,
  DocIcon,
  ExternalIcon,
  FolderIcon,
  GraduationIcon,
  HomeIcon,
  LayersIcon,
  LogoutIcon,
  MenuIcon,
  MessageIcon,
  SettingsIcon,
  SparklesIcon,
  UserIcon,
  WrenchIcon,
} from "../components/icons";

const sections = [
  { path: "", label: "Overview", icon: HomeIcon, end: true },
  { path: "profile", label: "Profile", icon: UserIcon },
  { path: "skills", label: "Skills", icon: LayersIcon },
  { path: "experience", label: "Experience", icon: WrenchIcon },
  { path: "education", label: "Education", icon: GraduationIcon },
  { path: "certifications", label: "Certifications", icon: AwardIcon },
  { path: "links", label: "Social links", icon: ExternalIcon },
  { path: "projects", label: "Projects", icon: FolderIcon },
  { path: "resume", label: "Resume & builder", icon: DocIcon },
  { path: "messages", label: "Messages", icon: MessageIcon },
  { path: "reports", label: "Assistant & analytics", icon: SparklesIcon },
  { path: "settings", label: "Security", icon: SettingsIcon },
];

export function AdminLayout() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="admin">
      <aside className={`admin__side${open ? " is-open" : ""}`}>
        <div className="admin__side-head">
          <span className="brand">
            <span className="brand__mark" aria-hidden="true">
              L
            </span>
            <span className="brand__text">Admin</span>
          </span>
          <button
            className="icon-btn admin__side-close"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <nav className="admin__nav" aria-label="Admin sections">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <NavLink
                key={s.path}
                to={`/admin/${s.path}`}
                end={s.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) => `admin__link${isActive ? " is-active" : ""}`}
              >
                <Icon size={16} /> {s.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="admin__side-foot">
          <a className="admin__link" href="/" target="_blank" rel="noreferrer noopener">
            <ExternalIcon size={16} /> Open site
          </a>
          <button className="admin__link" onClick={() => signOut()}>
            <LogoutIcon size={16} /> Sign out {user ? `· ${user.username}` : ""}
          </button>
        </div>
      </aside>

      {open ? (
        <button
          className="admin__backdrop"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        />
      ) : null}

      <div className="admin__main">
        <header className="admin__topbar">
          <button
            className="icon-btn"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon size={20} />
          </button>
          <span className="admin__breadcrumb">Content management</span>
          <Link to="/" className="admin__home">
            Home
          </Link>
        </header>

        <main className="admin__content">
          <Routes>
            <Route index element={<AdminOverview />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="skills" element={<AdminSkills />} />
            <Route path="experience" element={<AdminExperience />} />
            <Route path="education" element={<AdminEducation />} />
            <Route path="certifications" element={<AdminCertifications />} />
            <Route path="links" element={<AdminLinks />} />
            <Route path="projects/*" element={<AdminProjects />} />
            <Route path="resume" element={<AdminResume />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

const SKILL_CATEGORIES = [
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "database", label: "Database" },
  { value: "mobile", label: "Mobile" },
  { value: "tools", label: "Tools" },
  { value: "engineering", label: "Engineering" },
  { value: "other", label: "Other" },
];

function AdminSkills() {
  return (
    <CrudSection
      endpoint="/skills/"
      title="Skills"
      description="Technologies grouped by category. Order within a group controls display order."
      searchable
      display={(r) => String(r.name ?? "")}
      fields={[
        { name: "name", label: "Skill", type: "text", required: true },
        { name: "category", label: "Category", type: "select", required: true, options: SKILL_CATEGORIES },
        { name: "order", label: "Order", type: "number" },
        { name: "active", label: "Active", type: "boolean" },
      ]}
    />
  );
}

function AdminExperience() {
  return (
    <CrudSection
      endpoint="/experience/"
      title="Experience"
      description="Roles in reverse-chronological order."
      searchable
      display={(r) => `${r.title ?? ""} · ${r.organization ?? ""}`}
      fields={[
        { name: "title", label: "Title", type: "text", required: true },
        { name: "organization", label: "Organization", type: "text", required: true },
        { name: "employment_type", label: "Employment type", type: "text", placeholder: "Full-time" },
        { name: "location", label: "Location", type: "text" },
        { name: "start_date", label: "Start", type: "date", required: true },
        { name: "end_date", label: "End", type: "date" },
        { name: "current", label: "Current role", type: "boolean" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "order", label: "Order", type: "number" },
        { name: "active", label: "Active", type: "boolean" },
      ]}
    />
  );
}

function AdminEducation() {
  return (
    <CrudSection
      endpoint="/education/"
      title="Education"
      searchable
      display={(r) => `${r.degree ?? ""} · ${r.school ?? ""}`}
      fields={[
        { name: "school", label: "School", type: "text", required: true },
        { name: "degree", label: "Degree", type: "text", required: true },
        { name: "field", label: "Field", type: "text" },
        { name: "start_date", label: "Start", type: "date", required: true },
        { name: "end_date", label: "End", type: "date" },
        { name: "current", label: "Current", type: "boolean" },
        { name: "detail", label: "Detail", type: "textarea" },
        { name: "order", label: "Order", type: "number" },
        { name: "active", label: "Active", type: "boolean" },
      ]}
    />
  );
}

function AdminCertifications() {
  return (
    <CrudSection
      endpoint="/certifications/"
      title="Certifications"
      searchable
      display={(r) => `${r.name ?? ""} · ${r.issuer ?? ""}`}
      fields={[
        { name: "name", label: "Credential name", type: "text", required: true },
        { name: "issuer", label: "Issuer", type: "text", required: true },
        { name: "issue_date", label: "Issue date", type: "date" },
        { name: "credential_url", label: "Verify URL", type: "text" },
        { name: "order", label: "Order", type: "number" },
        { name: "active", label: "Active", type: "boolean" },
      ]}
    />
  );
}

function AdminLinks() {
  return (
    <CrudSection
      endpoint="/links/"
      title="Social links"
      description="Shown in the footer, contact card and on the resume. The icon is picked from the label (whatsapp, facebook, instagram, tiktok, youtube, linkedin…)."
      searchable
      display={(r) => `${r.label ?? ""} — ${r.url ?? ""}`}
      fields={[
        { name: "label", label: "Label", type: "text", required: true, placeholder: "WhatsApp" },
        { name: "url", label: "URL", type: "text", required: true, placeholder: "https://wa.me/254…" },
        { name: "icon", label: "Icon key", type: "text", placeholder: "whatsapp" },
        { name: "order", label: "Order", type: "number" },
        { name: "active", label: "Active", type: "boolean" },
      ]}
    />
  );
}