import { clearCache } from "./cache";

/**
 * Eliminar con «Deshacer»: la lista se actualiza al instante y la eliminación real se manda al servidor
 * al vencer el plazo, al empezar otra eliminación o al salir de la pantalla. Un solo aviso a la vez.
 */
export const UNDO_WINDOW_MS = 5000;
const ERROR_WINDOW_MS = 8000;

export interface UndoableAction {
  /** «Tarea eliminada»: lo que se lee en el aviso. */
  message: string;
  /** Quita el elemento de la pantalla (optimista). */
  apply: () => void;
  /** Lo devuelve a su sitio (al pulsar «Deshacer» o si el servidor falla). */
  restore: () => void;
  /** La eliminación real. */
  commit: () => Promise<unknown>;
}

export interface ToastState {
  kind: "undo" | "error";
  message: string;
  actionLabel: string;
  onAction: () => void;
}

let pending: { action: UndoableAction; timer: ReturnType<typeof setTimeout> } | null = null;
let errorTimer: ReturnType<typeof setTimeout> | null = null;
let toast: ToastState | null = null;
const listeners = new Set<() => void>();

function setToast(next: ToastState | null) {
  toast = next;
  listeners.forEach((listener) => listener());
}

export function subscribeToast(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getToast(): ToastState | null {
  return toast;
}

export function dismissToast() {
  if (errorTimer) { clearTimeout(errorTimer); errorTimer = null; }
  setToast(null);
}

/** Aplica la eliminación en pantalla y abre el plazo para deshacerla. */
export function runUndoable(action: UndoableAction) {
  flushPending();
  dismissToast();
  action.apply();
  pending = { action, timer: setTimeout(flushPending, UNDO_WINDOW_MS) };
  setToast({ kind: "undo", message: action.message, actionLabel: "Deshacer", onAction: undoPending });
}

function undoPending() {
  if (!pending) return;
  clearTimeout(pending.timer);
  const { action } = pending;
  pending = null;
  action.restore();
  setToast(null);
}

/** Manda ya al servidor lo que esté esperando (plazo vencido, otra eliminación o salida de la pantalla). */
export function flushPending() {
  if (!pending) return;
  clearTimeout(pending.timer);
  const { action } = pending;
  pending = null;
  setToast(null);
  action.commit().then(() => clearCache()).catch((err: unknown) => {
    action.restore();
    setToast({
      kind: "error",
      message: err instanceof Error ? err.message : "No fue posible eliminar",
      actionLabel: "Reintentar",
      onAction: () => runUndoable(action),
    });
    errorTimer = setTimeout(dismissToast, ERROR_WINDOW_MS);
  });
}

// Al ocultar la app (cambio de app, pantalla apagada) lo pendiente se confirma: no se pierde ni queda a medias.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flushPending(); });
}
