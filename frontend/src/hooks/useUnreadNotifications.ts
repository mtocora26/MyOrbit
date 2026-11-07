import { useCallback, useEffect, useState } from "react";
import { fetchUnreadCount } from "../services/notificationsApi";

const POLL_MS = 60_000;

/**
 * Contador de notificaciones sin leer. Se consulta al entrar, cada minuto y al volver a la pestaña;
 * un fallo (sin red) conserva el último valor. `setCount` deja que la bandeja lo actualice al instante.
 */
export function useUnreadNotifications(enabled: boolean) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    fetchUnreadCount().then(setCount).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!enabled) { setCount(0); return; }
    refresh();
    const timer = window.setInterval(refresh, POLL_MS);
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, refresh]);

  return { count, setCount, refresh };
}
