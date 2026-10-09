import { useSyncExternalStore, useCallback, useEffect, useState, useRef } from "react";

type Theme = "dark" | "light";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem("ph_theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

let theme: Theme = getInitialTheme();
const listeners = new Set<() => void>();

function setTheme(next: Theme) {
  theme = next;
  try {
    window.localStorage.setItem("ph_theme", next);
  } catch {
    // ignore storage failures
  }
  listeners.forEach((l) => l());
}

function useThemeSnapshot(): Theme {
  return useSyncExternalStore(
    useCallback((onStoreChange) => {
      listeners.add(onStoreChange);
      return () => listeners.delete(onStoreChange);
    }, []),
    () => theme
  );
}

export function useTheme() {
  const current = useThemeSnapshot();
  const toggle = useCallback(() => setTheme(current === "dark" ? "light" : "dark"), [current]);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", current);
  }, [current]);
  return { theme: current, toggle };
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const classes = visible ? "reveal is-visible" : "reveal";
  return { ref, classes, visible };
}