import { useSyncExternalStore } from "react";
import { BottomSheet } from "./shared";
import { getConnectionState, subscribeConnection } from "../services/connection";
import { discardOp, getOutboxSnapshot, retryOp, subscribeOutbox, type OutboxKind } from "../services/outbox";
import { IconRefresh } from "./icons";

const VERB: Record<OutboxKind, string> = {
  createTask: "Crear tarea",
  updateTask: "Editar tarea",
  setTaskDone: "Marcar tarea",
  deleteTask: "Borrar tarea",
};

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

/**
 * Franja bajo el aviso de conexión: dice cuántos cambios hechos sin conexión esperan envío y, si el servidor rechazó
 * alguno, lo avisa con un botón para verlo. No aparece cuando todo está al día.
 */
export function PendingChangesBar({ onOpen }: { onOpen: () => void }) {
  const { pending, failed } = useSyncExternalStore(subscribeOutbox, getOutboxSnapshot, getOutboxSnapshot);
  const connection = useSyncExternalStore(subscribeConnection, getConnectionState, () => "online" as const);
  if (pending === 0 && failed.length === 0) return null;
  const waiting = connection === "offline" || connection === "unreachable";

  if (failed.length > 0) {
    return (
      <div role="status" className="orbit-fade flex min-h-[44px] flex-shrink-0 items-center gap-3 border-b border-amber bg-amber-wash px-4 text-amber-ink">
        <p className="min-w-0 flex-1 py-2 text-[14px] leading-snug">
          <strong className="font-semibold">{failed.length} {plural(failed.length, "cambio no se pudo enviar", "cambios no se pudieron enviar")}.</strong>
        </p>
        <button type="button" onClick={onOpen} className="-mr-2 flex min-h-[44px] flex-shrink-0 items-center rounded-md px-3 text-[14px] font-semibold underline underline-offset-4 active:opacity-70">Ver</button>
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite" className="orbit-fade flex min-h-[44px] flex-shrink-0 items-center border-b border-line bg-wash px-4 text-ink-2">
      <p className="min-w-0 flex-1 py-2 text-[14px] leading-snug">
        {waiting
          ? <><strong className="font-semibold text-ink">{pending} {plural(pending, "cambio guardado", "cambios guardados")} en este teléfono.</strong> Se {plural(pending, "enviará", "enviarán")} al volver la conexión.</>
          : <><strong className="font-semibold text-ink">Enviando {pending} {plural(pending, "cambio", "cambios")}…</strong></>}
      </p>
    </div>
  );
}

/** Lista los cambios que el servidor rechazó, con el motivo, para reintentarlos o descartarlos. */
export function PendingChangesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { failed } = useSyncExternalStore(subscribeOutbox, getOutboxSnapshot, getOutboxSnapshot);
  return (
    <BottomSheet open={open} onClose={onClose} title="Cambios sin enviar">
      <p className="mb-4 text-[14px] leading-relaxed text-ink-2">El servidor no aceptó estos cambios hechos sin conexión. Lo que ves en pantalla ya es lo que tiene el servidor.</p>
      {failed.length === 0 ? (
        <p className="py-4 text-[15px] text-ink-2">No queda nada pendiente.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {failed.map((op) => (
            <li key={op.seq} className="rounded-md bg-wash px-3 py-3">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-3">{VERB[op.kind]}</p>
              <p className="mt-0.5 break-words text-[16px] font-semibold text-ink">{op.label}</p>
              <p className="mt-1 text-[14px] leading-snug text-danger">{op.error}</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => op.seq !== undefined && retryOp(op.seq)} className="min-h-[44px] flex-1 rounded-md border border-line-control text-[14px] font-semibold text-ink active:scale-[0.97] transition-transform">Reintentar</button>
                <button type="button" onClick={() => op.seq !== undefined && discardOp(op.seq)} className="min-h-[44px] flex-1 rounded-md text-[14px] font-semibold text-danger active:scale-[0.97] transition-transform">Descartar</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={onClose} className="mt-4 min-h-[44px] w-full text-[14px] font-semibold text-ink-2">Cerrar</button>
    </BottomSheet>
  );
}
