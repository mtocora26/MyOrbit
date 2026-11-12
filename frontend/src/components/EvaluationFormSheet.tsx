import { useEffect, useState } from "react";
import { BottomSheet } from "./shared";
import { fromTaskDue } from "../services/taskDue";
import { componentsAverage, createEvaluation, deleteEvaluation, formatNumber, MAX_PERCENTAGE, parseDecimal, updateEvaluation, type Evaluation } from "../services/evaluationsApi";
import { formatGrade } from "../services/academicApi";

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

interface PartDraft { name: string; percentage: string; grade: string; }

const decimalInput = (value: string) => value.replace(/[^\d.,]/g, "").slice(0, 6);

export default function EvaluationFormSheet({ open, onClose, subjectId, evaluation, availablePercentage, onSaved, onDeleted }: Props) {
  const [name, setName] = useState("");
  const [percentage, setPercentage] = useState("");
  const [grade, setGrade] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("08:00");
  const [parts, setParts] = useState<PartDraft[]>([]);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(evaluation?.name ?? "");
    setPercentage(evaluation ? formatNumber(evaluation.percentage) : "");
    setGrade(evaluation?.grade != null ? formatNumber(evaluation.grade) : "");
    const due = evaluation?.due ? fromTaskDue(evaluation.due) : { date: "", time: "" };
    setDate(due.date);
    setTime(due.time || "08:00");
    setParts((evaluation?.components ?? []).map((part) => ({ name: part.name, percentage: formatNumber(part.percentage), grade: part.grade !== null ? formatNumber(part.grade) : "" })));
    setConfirmingDelete(false);
    setError(null);
  }, [open, evaluation]);

  const percentageValue = parseDecimal(percentage);
  const gradeValue = parseDecimal(grade);
  const percentageError = percentage !== "" && (percentageValue === null || percentageValue <= 0 || percentageValue > availablePercentage + 1e-9)
    ? percentageValue !== null && percentageValue > 0 ? `Solo quedan ${formatNumber(availablePercentage)}% por repartir` : "Debe ser mayor que 0"
    : null;
  const gradeError = grade !== "" && (gradeValue === null || gradeValue < 0 || gradeValue > 5) ? "La nota va de 0 a 5" : null;
  const parsedParts = parts.map((part) => ({ name: part.name.trim(), percentage: parseDecimal(part.percentage), grade: parseDecimal(part.grade), rawGrade: part.grade }));
  const partsTotal = parsedParts.reduce((sum, part) => sum + (part.percentage ?? 0), 0);
  const partsInvalid = parsedParts.some((part) => part.name === "" || part.percentage === null || part.percentage <= 0 || (part.rawGrade !== "" && (part.grade === null || part.grade < 0 || part.grade > 5)));
  const partsOver = partsTotal > MAX_PERCENTAGE + 1e-9;
  const preview = parts.length > 0 && !partsInvalid ? componentsAverage(parsedParts.map((part) => ({ percentage: part.percentage as number, grade: part.grade }))) : null;
  const canSubmit = name.trim() !== "" && percentageValue !== null && !percentageError && !gradeError && !partsInvalid && !partsOver && !busy;

  function setPart(index: number, patch: Partial<PartDraft>) {
    setParts((current) => current.map((part, position) => position === index ? { ...part, ...patch } : part));
  }
  function addPart() {
    const free = Math.max(0, MAX_PERCENTAGE - partsTotal);
    setParts((current) => [...current, { name: "", percentage: current.length === 0 ? "100" : free > 0 ? formatNumber(free) : "", grade: "" }]);
  }

  function close() {
    if (!busy) onClose();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || percentageValue === null) return;
    try {
      setBusy(true);
      setError(null);
      const input = {
        name: name.trim(), percentage: percentageValue, due: date ? `${date}T${time || "08:00"}` : null,
        grade: parts.length > 0 ? null : gradeValue,
        components: parsedParts.map((part) => ({ name: part.name, percentage: part.percentage as number, grade: part.grade })),
      };
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
            {parts.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-[14px] font-semibold text-ink">Nota del corte</span>
                <span className="num flex min-h-[50px] items-center rounded-md border border-line bg-wash px-3 text-[16px] text-ink">
                  {preview?.average != null ? `${formatGrade(preview.average)}${preview.complete ? "" : " (provisional)"}` : "—"}
                </span>
                <span className="text-[13px] text-ink-3">Sale de sus componentes</span>
              </div>
            ) : (
            <label className="flex flex-col gap-1.5">
              <span className="text-[14px] font-semibold text-ink">Nota (opcional)</span>
              <span className={`flex items-center gap-1 rounded-md border bg-card px-3 py-3 transition-colors focus-within:border-coral ${gradeError ? "border-danger-line" : "border-line"}`}>
                <input value={grade} inputMode="decimal" onChange={(e) => setGrade(decimalInput(e.target.value))} aria-invalid={!!gradeError} placeholder="—" className="num min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none" />
                <span className="text-[14px] text-ink-3">/5</span>
              </span>
              <span className={`text-[13px] ${gradeError ? "font-semibold text-danger" : "text-ink-3"}`}>{gradeError ?? "Déjala vacía si aún no la tienes"}</span>
            </label>
            )}
          </div>

          <section aria-label="Componentes del corte" className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-semibold text-ink">Componentes (opcional)</p>
              <button type="button" onClick={addPart} disabled={parts.length >= 20} className="-mr-2 min-h-[44px] px-2 text-[14px] font-semibold text-coral-ink disabled:opacity-50">+ Componente</button>
            </div>
            {parts.length === 0 ? (
              <p className="text-[13px] text-ink-3">Divide el corte en partes (parcial, actividades…) con su peso dentro del corte.</p>
            ) : (
              <>
                <ul className="flex flex-col gap-2">
                  {parts.map((part, index) => (
                    <li key={index} className="flex flex-col gap-2 rounded-md border border-line bg-card p-2">
                      <div className="flex items-center gap-2">
                        <input value={part.name} maxLength={100} onChange={(e) => setPart(index, { name: e.target.value })} aria-label={`Nombre del componente ${index + 1}`} placeholder="Ej. Parcial" className="min-h-[44px] min-w-0 flex-1 rounded-md border border-line bg-card px-3 text-[16px] text-ink outline-none focus:border-coral" />
                        <button type="button" onClick={() => setParts((current) => current.filter((_, position) => position !== index))} aria-label={`Quitar componente ${index + 1}`} className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md text-ink-2 active:bg-wash"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="flex items-center gap-1 rounded-md border border-line bg-card px-3 py-2.5 focus-within:border-coral">
                          <input value={part.percentage} inputMode="decimal" onChange={(e) => setPart(index, { percentage: decimalInput(e.target.value) })} aria-label={`Porcentaje del componente ${index + 1}`} placeholder="50" className="num min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none" />
                          <span className="text-[14px] text-ink-3">% del corte</span>
                        </span>
                        <span className="flex items-center gap-1 rounded-md border border-line bg-card px-3 py-2.5 focus-within:border-coral">
                          <input value={part.grade} inputMode="decimal" onChange={(e) => setPart(index, { grade: decimalInput(e.target.value) })} aria-label={`Nota del componente ${index + 1}`} placeholder="—" className="num min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none" />
                          <span className="text-[14px] text-ink-3">/5</span>
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className={`num text-[13px] ${partsOver || partsInvalid ? "font-semibold text-danger" : "text-ink-3"}`}>
                  {partsOver ? `Los componentes suman ${formatNumber(partsTotal)}%: no pueden pasar de 100%` : partsInvalid ? "Cada componente necesita nombre, porcentaje mayor que 0 y una nota de 0 a 5 (opcional)" : partsTotal < MAX_PERCENTAGE - 1e-9 ? `Falta repartir ${formatNumber(MAX_PERCENTAGE - partsTotal)}% del corte; hasta completarlo la nota es provisional` : "Componentes completos"}
                </p>
              </>
            )}
          </section>

          <div>
            <p className="mb-1.5 text-[14px] font-semibold text-ink">Fecha (opcional)</p>
            <div className="flex items-center gap-2">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Fecha de la evaluación" className="num min-w-0 flex-1 rounded-md border border-line bg-card px-3 py-3 text-[16px] text-ink outline-none focus:border-coral" />
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={!date} aria-label="Hora de la evaluación" className="num w-[120px] rounded-md border border-line bg-card px-3 py-3 text-[16px] text-ink outline-none focus:border-coral disabled:opacity-50" />
              {date && <button type="button" onClick={() => setDate("")} aria-label="Quitar fecha" className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md text-ink-2 active:bg-wash"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>}
            </div>
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
