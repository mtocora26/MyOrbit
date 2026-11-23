import { useSyncExternalStore } from "react";
import { dismissToast, getToast, subscribeToast } from "../services/undo";
import { IconClose } from "./icons";

/** Aviso breve con acción («Tarea eliminada · Deshacer»). No bloquea la pantalla y se anuncia a lectores de pantalla. */
export default function UndoToast() {
  const toast = useSyncExternalStore(subscribeToast, getToast);
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-40 flex justify-center px-4 lg:justify-start lg:px-8" role="status" aria-live="polite">
      {toast && (
        <div key={toast.message + toast.kind} className={`orbit-fade pointer-events-auto flex min-h-[52px] w-full max-w-[420px] items-center gap-2 rounded-md border py-1 pl-4 pr-1 ${toast.kind === "error" ? "border-danger-line bg-danger-wash text-danger" : "border-line-strong bg-strong text-on-strong"}`}>
          <p className="min-w-0 flex-1 text-[15px] font-semibold leading-snug">{toast.message}</p>
          <button type="button" onClick={() => { toast.onAction(); }} className={`min-h-[44px] flex-shrink-0 rounded-md px-4 text-[15px] font-semibold ${toast.kind === "error" ? "text-danger active:bg-danger/10" : "bg-coral text-night"}`}>{toast.actionLabel}</button>
          {toast.kind === "error" && <button type="button" onClick={dismissToast} aria-label="Cerrar aviso" className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md text-danger active:bg-wash/20"><IconClose size={16} /></button>}
        </div>
      )}
    </div>
  );
}
