import { useEffect, useRef, useState } from "react";

const MIN_VISIBLE_MS = 500;
const MAX_VISIBLE_MS = 3000;

/**
 * Detecta el regreso a la app tras `awayMs` o más en segundo plano y ejecuta `revalidate` (sesión y datos).
 * Devuelve true mientras tanto, para cubrir la espera con la animación de arranque: nunca menos de 0,5 s (no
 * parpadea) ni más de 3 s (no retiene la app si el servidor tarda).
 */
export function useResume(awayMs: number, revalidate: () => Promise<void>): boolean {
  const [resuming, setResuming] = useState(false);
  const latest = useRef(revalidate);
  latest.current = revalidate;

  useEffect(() => {
    let hiddenAt: number | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    function onChange() {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        return;
      }
      const away = hiddenAt === null ? 0 : Date.now() - hiddenAt;
      hiddenAt = null;
      if (away < awayMs) return;
      const startedAt = Date.now();
      let finished = false;
      setResuming(true);
      const finish = () => {
        if (finished) return;
        finished = true;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => setResuming(false), Math.max(0, MIN_VISIBLE_MS - (Date.now() - startedAt)));
      };
      const cap = setTimeout(finish, MAX_VISIBLE_MS);
      latest.current().catch(() => undefined).finally(() => { clearTimeout(cap); finish(); });
    }
    document.addEventListener("visibilitychange", onChange);
    return () => {
      document.removeEventListener("visibilitychange", onChange);
      if (timer) clearTimeout(timer);
    };
  }, [awayMs]);

  return resuming;
}
