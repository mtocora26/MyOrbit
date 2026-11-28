import { useEffect, useState, useSyncExternalStore } from "react";
import { deleteAccount } from "../services/authApi";
import { getConnectionState, subscribeConnection } from "../services/connection";
import { DetailSheet } from "./shared";

/** Confirmación de borrado: dice qué se pierde y exige la contraseña. No se puede hacer sin conexión. */
export default function DeleteAccountSheet({ open, onClose, onDeleted }: { open: boolean; onClose: () => void; onDeleted: () => void }) {
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const offline = useSyncExternalStore(subscribeConnection, getConnectionState) === "offline";

  useEffect(() => {
    if (!open) return;
    setPassword("");
    setError(null);
  }, [open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (deleting || offline || !password) return;
    try {
      setDeleting(true);
      setError(null);
      await deleteAccount(password);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible eliminar tu cuenta");
      setDeleting(false);
    }
  }

  return (
    <DetailSheet open={open} onClose={onClose} title="Eliminar mi cuenta" doneLabel="Cancelar">
      <p className="text-[14px] leading-relaxed text-ink-2">
        Se borran para siempre tu perfil, tareas, materias y notas, hábitos, eventos, recordatorios y notificaciones.
        <strong className="font-semibold text-ink"> No se puede deshacer.</strong>
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[13px] font-bold text-ink-2">Escribe tu contraseña para confirmar</span>
          <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-[44px] rounded-md border border-line-control bg-paper px-3 py-2 text-[16px] text-ink outline-none focus:border-coral" />
        </label>
        {offline && <p role="status" className="text-[14px] font-semibold text-ink">Necesitas internet para eliminar tu cuenta.</p>}
        {error && <p role="alert" className="text-[14px] font-semibold text-danger">{error}</p>}
        <button type="submit" disabled={deleting || offline || !password} className="min-h-[44px] rounded-md border border-danger-line bg-danger-wash px-4 text-[14px] font-bold text-danger transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50">
          {deleting ? "Eliminando..." : "Eliminar definitivamente"}
        </button>
      </form>
    </DetailSheet>
  );
}
