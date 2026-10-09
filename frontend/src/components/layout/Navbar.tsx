import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import type { ReactNode } from "react";
import { ThemeToggle } from "../ThemeToggle";
import { Button } from "../Button";
import { CloseIcon, MenuIcon } from "../icons";

const links: { to: string; label: string }[] = [
  { to: "/", label: "Home" },
  { to: "/projects", label: "Projects" },
  { to: "/resume", label: "Resume" },
  { to: "/#contact", label: "Contact" },
];

export function Navbar({ brand = "Lenox" }: { brand?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  const renderLink = (to: string, label: string, onNavigate?: () => void): ReactNode => {
    if (to.startsWith("/#")) {
      return (
        <a href={to} onClick={onNavigate} className="nav__link">
          {label}
        </a>
      );
    }
    return (
      <NavLink
        to={to}
        end={to === "/"}
        onClick={onNavigate}
        className={({ isActive }) => `nav__link${isActive ? " is-active" : ""}`}
      >
        {label}
      </NavLink>
    );
  };

  return (
    <header className="navbar" role="banner">
      <div className="container navbar__inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)} aria-label="Lenox Okoth home">
          <span className="brand__mark" aria-hidden="true">
            L
          </span>
          <span className="brand__text">{brand}</span>
        </Link>

        <nav className={`nav${open ? " is-open" : ""}`} aria-label="Primary">
          <div className="nav__list">
            {links.map((l) => (
              <div key={l.to}>{renderLink(l.to, l.label, () => setOpen(false))}</div>
            ))}
          </div>
          <div className="nav__actions">
            <ThemeToggle />
            <Button href="/#contact" kind="primary" size="sm">
              Let&apos;s talk
            </Button>
          </div>
        </nav>

        <div className="navbar__right">
          <ThemeToggle />
          <button
            className="icon-btn navbar__toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            type="button"
          >
            {open ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}