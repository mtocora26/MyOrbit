import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
const KEY = "myorbit.theme";
const EVENT = "myorbit:theme";

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function stored(): Theme | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

function current(): Theme {
  return stored() ?? systemTheme();
}

function apply(theme: Theme | null) {
  const root = document.documentElement;
  if (theme) root.dataset.theme = theme;
  else delete root.dataset.theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", (theme ?? systemTheme()) === "dark" ? "#0a111f" : "#eef1f6");
}

// Aplica el tema guardado antes del primer render para evitar el destello.
export function initTheme() {
  apply(stored());
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener(EVENT, onChange);
  media.addEventListener("change", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    media.removeEventListener("change", onChange);
  };
}

/** Estado global del tema: todos los interruptores (barra lateral, Home, Perfil) se mantienen sincronizados. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, current, () => "light" as Theme);

  const setTheme = useCallback((next: Theme) => {
    try { localStorage.setItem(KEY, next); } catch { /* sin almacenamiento: solo esta sesión */ }
    apply(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}
