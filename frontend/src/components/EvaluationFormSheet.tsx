import { useEffect, useState } from "react";
import { BottomSheet } from "./shared";
import { createEvaluation, deleteEvaluation, formatNumber, parseDecimal, updateEvaluation, type Evaluation } from "../services/evaluationsApi";

interface Props {
  open: boolean;
  onClose: () => void;
  subjectId: string;
  /** Evaluación a editar; null crea una nueva. */
  evaluation: Evaluation | null;
  /** Porcentaje que todavía se puede repartir (sin contar la evaluación en edición). */
  availablePercentage: number;
  onSaved: (evaluation: Evaluation) => void;
  onDeleted: (id: string) => void;
}

const decimalInput = (value: string) => value.replace(/[^\d.,]/g, "").slice(0, 6);

export default function EvaluationFormSheet({ open, onClose, subjectId, evaluation, availablePercentage, onSaved, onDeleted }: Props) {
  const [name, setName] = useState("");
  const [percentage, setPercentage] = useState("");
  const [grade, setGrade] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(evaluation?.name ?? "");
    setPercentage(evaluation ? formatNumber(evaluation.percentage) : "");
    setGrade(evaluation?.grade != null ? formatNumber(evaluation.grade) : "");
    setConfirmingDelete(false);
    setError(null);
  }, [open, evaluation]);

  const percentageValue = parseDecimal(percentage);
  const gradeValue = parseDecimal(grade);
  const percentageError = percentage !== "" && (percentageValue === null || percentageValue <= 0 || percentageValue > availablePercentage + 1e-9)
    ? percentageValue !== null && percentageValue > 0 ? `Solo quedan ${formatNumber(availablePercentage)}% por repartir` : "Debe ser mayor que 0"
    : null;
  const gradeError = grade !== "" && (gradeValue === null || gradeValue < 0 || gradeValue > 5) ? "La nota va de 0 a 5" : null;
  const canSubmit = name.trim() !== "" && percentageValue !== null && !percentageError && !gradeError && !busy;

  function close() {
    if (!busy) onClose();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || percentageValue === null) return;
    try {
      setBusy(true);
      setError(null);
      const input = { name: name.trim(), percentage: percentageValue, grade: gradeValue };
      const saved = evaluation ? await updateEvaluation(subjectId, evaluation.id, input) : await createEvaluation(subjectId, input);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar la evaluación");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!evaluation || busy) return;
    try {
      setBusy(true);
      setError(null);
      await deleteEvaluation(subjectId, evaluation.id);
      onDeleted(evaluation.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible eliminar la evaluación");
    } finally {
      setBusy(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={close} title={confirmingDelete ? "Eliminar evaluación" : evaluation ? "Editar evaluación" : "Nueva evaluación"}>
      {confirmingDelete && evaluation ? (
        <div className="flex flex-col gap-4">
          <p className="text-[15px] leading-snug text-ink">¿Eliminar <strong className="font-semibold">{evaluation.name}</strong>? Su {formatNumber(evaluation.percentage)}% quedará libre para repartir.</p>
          {error && <p role="alert" className="text-[14px] font-semibold text-danger">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirmingDelete(false)} disabled={busy} className="min-h-[48px] flex-1 rounded-md bg-wash text-[15px] font-semibold text-ink-2 disabled:opacity-50">Cancelar</button>
            <button type="button" onClick={remove} disabled={busy} className="min-h-[48px] flex-1 rounded-md bg-danger text-[15px] font-semibold text-white disabled:opacity-50">{busy ? "Eliminando..." : "Eliminar"}</button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[14px] font-semibold text-ink">Nombre</span>
            <span className="flex items-center rounded-md border border-line bg-card px-3 py-3 transition-colors focus-within:border-coral">
              <input autoFocus value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder="Ej. Parcial 1" className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none" />
            </span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[14px] font-semibold text-ink">Porcentaje</span>
              <span className={`flex items-center gap-1 rounded-md border bg-card px-3 py-3 transition-colors focus-within:border-coral ${percentageError ? "border-danger-line" : "border-line"}`}>
                <input value={percentage} inputMode="decimal" onChange={(e) => setPercentage(decimalInput(e.target.value))} aria-invalid={!!percentageError} placeholder="30" className="num min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none" />
                <span className="text-[14px] text-ink-3">%</span>
              </span>
              <span className={`text-[13px] ${percentageError ? "font-semibold text-danger" : "text-ink-3"}`}>{percentageError ?? `Disponible: ${formatNumber(availablePercentage)}%`}</span>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[14px] font-semibold text-ink">Nota (opcional)</span>
              <span className={`flex items-center gap-1 rounded-md border bg-card px-3 py-3 transition-colors focus-within:border-coral ${gradeError ? "border-danger-line" : "border-line"}`}>
                <input value={grade} inputMode="decimal" onChange={(e) => setGrade(decimalInput(e.target.value))} aria-invalid={!!gradeError} placeholder="—" className="num min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none" />
                <span className="text-[14px] text-ink-3">/5</span>
              </span>
              <span className={`text-[13px] ${gradeError ? "font-semibold text-danger" : "text-ink-3"}`}>{gradeError ?? "Déjala vacía si aún no la tienes"}</span>
            </label>
          </div>

          {error && <p role="alert" className="text-[14px] font-semibold text-danger">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={close} disabled={busy} className="min-h-[48px] flex-1 rounded-md bg-wash text-[15px] font-semibold text-ink-2 disabled:opacity-50">Cancelar</button>
            <button type="submit" disabled={!canSubmit} className="min-h-[48px] flex-1 rounded-md bg-coral text-[15px] font-semibold text-night disabled:opacity-50">{busy ? "Guardando..." : evaluation ? "Guardar cambios" : "Agregar"}</button>
          </div>
          {evaluation && (
            <button type="button" onClick={() => { setError(null); setConfirmingDelete(true); }} disabled={busy} className="min-h-[44px] self-center px-3 text-[14px] font-semibold text-danger disabled:opacity-50">Eliminar evaluación</button>
          )}
        </form>
      )}
    </BottomSheet>
  );
}
