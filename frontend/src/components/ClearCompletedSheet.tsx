import { useEffect, useState, useSyncExternalStore } from "react";
import { getConnectionState, subscribeConnection } from "../services/connection";
import { getOutboxSnapshot, subscribeOutbox } from "../services/outbox";
import { deleteCompletedTasks, fetchTasks } from "../services/tasksApi";
import { flushPending } from "../services/undo";
import { DetailSheet, ErrorBanner } from "./shared";

const plural = (count: number) => (count === 1 ? "1 tarea completada" : `${count} tareas completadas`);

/** Confirmación para eliminar todas las completadas: dice cuántas son (sin importar los filtros) y exige conexión. */
export default function ClearCompletedSheet({ open, onClose, onDeleted }: { open: boolean; onClose: () => void; onDeleted: () => void }) {
  const [count, setCount] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const offline = useSyncExternalStore(subscribeConnection, getConnectionState) === "offline";
  const unsent = useSyncExternalStore(subscribeOutbox, getOutboxSnapshot).pending > 0;

  useEffect(() => {
    if (!open) return;
    let ignore = false;
    setCount(null);
    setError(null);
    setDeleting(false);
    // Lo que espera «Deshacer» se confirma antes de contar.
    flushPending();
    fetchTasks({ done: true })
      .then((tasks) => { if (!ignore) setCount(tasks.length); })
      .catch((err: unknown) => { if (!ignore) setError(err instanceof Error ? err.message : "No fue posible contar las tareas"); });
    return () => { ignore = true; };
  }, [open, attempt]);

  async function handleDelete() {
    if (deleting || offline || unsent || !count) return;
    try {
      setDeleting(true);
      setError(null);
      await deleteCompletedTasks();
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible eliminar las tareas");
      setDeleting(false);
    }
  }

  return (
    <DetailSheet open={open} onClose={onClose} title="Eliminar completadas" doneLabel="Cancelar">
      <p className="text-[14px] leading-relaxed text-ink-2" aria-live="polite">
        {count === null
          ? (error ? "No se pudo consultar cuántas son." : "Contando tus tareas completadas...")
          : <>Se eliminarán <strong className="font-semibold text-ink">{plural(count)}</strong>, aunque los filtros muestren menos. No se puede deshacer.</>}
      </p>
      {offline && <p role="status" className="text-[14px] font-semibold text-ink">Necesitas internet para eliminarlas.</p>}
      {!offline && unsent && <p role="status" className="text-[14px] font-semibold text-ink">Espera a que se envíen tus cambios pendientes.</p>}
      {error && <ErrorBanner message={error} onRetry={() => setAttempt((value) => value + 1)} />}
      <button type="button" onClick={handleDelete} disabled={deleting || offline || unsent || !count} className="min-h-[44px] rounded-md border border-danger-line bg-danger-wash px-4 text-[14px] font-bold text-danger transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50">
        {deleting ? "Eliminando..." : "Eliminar definitivamente"}
      </button>
    </DetailSheet>
  );
}
