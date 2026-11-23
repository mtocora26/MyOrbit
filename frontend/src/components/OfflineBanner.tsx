import { useState, useSyncExternalStore } from "react";
import OrbitLoader from "./OrbitLoader";
import { lastSyncedAt } from "../services/offlineStore";
import { getConnectionState, retryConnection, subscribeConnection } from "../services/connection";
import { IconCheck, IconServer, IconWifiOff } from "./icons";

const MESSAGES = {
  offline: { title: "Sin conexión", detail: "Lo que ves puede estar desactualizado." },
  unreachable: { title: "Servidor inalcanzable", detail: "Hay red, pero MyOrbit no responde. Lo que ves puede estar desactualizado." },
  recovered: { title: "Conexión recuperada", detail: "Actualizamos tus datos." },
} as const;

/** «Mostrando lo guardado el sáb 21, 2:40 p. m.»: dice de cuándo son los datos que se ven sin conexión. */
function savedLabel(): string | null {
  const date = lastSyncedAt();
  if (!date) return null;
  const day = date.toLocaleDateString("es-CO", { weekday: "short", day: "numeric" });
  const time = date.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
  return `Mostrando lo guardado el ${day}, ${time}`;
}


/** Aviso no bloqueante arriba: dice qué pasa con palabras e icono (nunca solo color) y ofrece «Reintentar». */
export default function OfflineBanner() {
  const state = useSyncExternalStore(subscribeConnection, getConnectionState, () => "online" as const);
  const [retrying, setRetrying] = useState(false);
  if (state === "online") return null;
  const message = MESSAGES[state];
  const saved = state === "recovered" ? null : savedLabel();
  const tone = state === "recovered" ? "bg-green-wash text-green-ink border-green" : state === "unreachable" ? "bg-amber-wash text-amber-ink border-amber" : "bg-strong text-on-strong border-line-strong";
  return (
    <div role="status" aria-live="polite" className={`orbit-fade flex min-h-[44px] flex-shrink-0 items-center gap-3 border-b px-4 pt-[env(safe-area-inset-top)] ${tone}`}>
      {state === "offline" && <IconWifiOff size={20} />}
      {state === "unreachable" && <IconServer size={20} />}
      {state === "recovered" && <IconCheck size={20} />}
      <p className="min-w-0 flex-1 py-2 text-[14px] leading-snug"><strong className="font-semibold">{message.title}.</strong> {message.detail}{saved && <span className="block">{saved}</span>}</p>
      {state !== "recovered" && (
        <button type="button" disabled={retrying} onClick={() => { setRetrying(true); void retryConnection().finally(() => setRetrying(false)); }} className="-mr-2 flex min-h-[44px] flex-shrink-0 items-center gap-2 rounded-md px-3 text-[14px] font-semibold underline underline-offset-4 active:opacity-70">
          {retrying && <OrbitLoader size={20} className="flex-shrink-0 rounded-[4px]" />}
          {retrying ? "Reintentando" : "Reintentar"}
        </button>
      )}
    </div>
  );
}
