import { useState, useSyncExternalStore } from "react";
import OrbitLoader from "./OrbitLoader";
import { getConnectionState, retryConnection, subscribeConnection } from "../services/connection";

const MESSAGES = {
  offline: { title: "Sin conexión", detail: "Lo que ves puede estar desactualizado." },
  unreachable: { title: "Servidor inalcanzable", detail: "Hay red, pero MyOrbit no responde. Lo que ves puede estar desactualizado." },
  recovered: { title: "Conexión recuperada", detail: "Actualizamos tus datos." },
} as const;

const ICON_PROPS = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

/** Aviso no bloqueante arriba: dice qué pasa con palabras e icono (nunca solo color) y ofrece «Reintentar». */
export default function OfflineBanner() {
  const state = useSyncExternalStore(subscribeConnection, getConnectionState, () => "online" as const);
  const [retrying, setRetrying] = useState(false);
  if (state === "online") return null;
  const message = MESSAGES[state];
  const tone = state === "recovered" ? "bg-green-wash text-green-ink border-green" : state === "unreachable" ? "bg-amber-wash text-amber-ink border-amber" : "bg-strong text-on-strong border-line-strong";
  return (
    <div role="status" aria-live="polite" className={`orbit-fade flex min-h-[44px] flex-shrink-0 items-center gap-3 border-b px-4 pt-[env(safe-area-inset-top)] ${tone}`}>
      {state === "offline" && <svg {...ICON_PROPS}><path d="M2 8.8a15 15 0 0 1 4-2.4M22 8.8a15 15 0 0 0-9-3.7M5 12.9a10 10 0 0 1 3.4-1.9M19 12.9a10 10 0 0 0-3-1.8M8.5 16.4a5 5 0 0 1 7 0M12 20h.01M3 3l18 18" /></svg>}
      {state === "unreachable" && <svg {...ICON_PROPS}><rect x="3" y="4" width="18" height="6" rx="1.5" /><rect x="3" y="14" width="18" height="6" rx="1.5" /><path d="M7 7h.01M7 17h.01M17 11v2" /></svg>}
      {state === "recovered" && <svg {...ICON_PROPS}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
      <p className="min-w-0 flex-1 py-2 text-[14px] leading-snug"><strong className="font-semibold">{message.title}.</strong> {message.detail}</p>
      {state !== "recovered" && (
        <button type="button" disabled={retrying} onClick={() => { setRetrying(true); void retryConnection().finally(() => setRetrying(false)); }} className="-mr-2 flex min-h-[44px] flex-shrink-0 items-center gap-2 rounded-md px-3 text-[14px] font-semibold underline underline-offset-4 active:opacity-70">
          {retrying && <OrbitLoader size={20} className="flex-shrink-0 rounded-[4px]" />}
          {retrying ? "Reintentando" : "Reintentar"}
        </button>
      )}
    </div>
  );
}
