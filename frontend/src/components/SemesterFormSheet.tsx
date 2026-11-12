import { useEffect, useState } from "react";
import { BottomSheet } from "./shared";
import { createSemester, deleteSemester, updateSemester, type Semester } from "../services/semestersApi";
import { currentSemester, semesterOptions } from "../services/subjectsApi";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Semestre a editar; null crea uno nuevo. */
  semester: Semester | null;
  /** Nombres que el usuario ya tiene (no se ofrecen al crear). */
  existingNames: string[];
  onSaved: (semester: Semester) => void;
  onDeleted: (semester: Semester) => void;
}

export default function SemesterFormSheet({ open, onClose, semester, existingNames, onSaved, onDeleted }: Props) {
  const [name, setName] = useState(currentSemester());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const available = semesterOptions([]).filter((option) => !existingNames.includes(option));

  // El formulario se precarga cada vez que se abre.
  useEffect(() => {
    if (!open) return;
    setName(semester?.name ?? available[0] ?? currentSemester());
    setStartDate(semester?.startDate ?? "");
    setEndDate(semester?.endDate ?? "");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, semester]);

  const orderInvalid = startDate !== "" && endDate !== "" && endDate < startDate;
  const canSubmit = !orderInvalid && !saving && (semester !== null || available.includes(name));

  function close() {
    if (!saving) onClose();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    try {
      setSaving(true);
      setError(null);
      const input = { name, startDate: startDate || null, endDate: endDate || null };
      const saved = semester ? await updateSemester(semester.id, input) : await createSemester(input);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar el semestre");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!semester || saving) return;
    try {
      setSaving(true);
      setError(null);
      await deleteSemester(semester.id);
      onDeleted(semester);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible eliminar el semestre");
    } finally {
      setSaving(false);
    }
  }

  const nameOptions = semester ? [...new Set([semester.name, ...available])].sort().reverse() : available;

  return (
    <BottomSheet open={open} onClose={close} title={semester ? "Editar semestre" : "Nuevo semestre"}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[14px] font-semibold text-ink">Semestre</span>
          <select value={name} onChange={(e) => setName(e.target.value)} className="num rounded-md border border-line bg-card px-3 py-3 text-[16px] text-ink outline-none focus:border-coral">
            {nameOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[14px] font-semibold text-ink">Inicio</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="num rounded-md border border-line bg-card px-3 py-3 text-[16px] text-ink outline-none focus:border-coral" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[14px] font-semibold text-ink">Fin</span>
            <input type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} aria-invalid={orderInvalid} className={`num rounded-md border bg-card px-3 py-3 text-[16px] text-ink outline-none focus:border-coral ${orderInvalid ? "border-danger-line" : "border-line"}`} />
          </label>
        </div>
        <p className="-mt-2 text-[13px] text-ink-3">Con las fechas completas, la app sabe cuál es tu semestre actual.</p>

        {orderInvalid && <p role="alert" className="text-[14px] font-semibold text-danger">La fecha de fin no puede ser anterior a la de inicio</p>}
        {error && <p role="alert" className="text-[14px] font-semibold text-danger">{error}</p>}

        <div className="flex gap-2">
          <button type="button" onClick={close} disabled={saving} className="min-h-[48px] flex-1 rounded-md bg-wash text-[15px] font-semibold text-ink-2 disabled:opacity-50">Cancelar</button>
          <button type="submit" disabled={!canSubmit} className="min-h-[48px] flex-1 rounded-md bg-coral text-[15px] font-semibold text-night disabled:opacity-50">{saving ? "Guardando..." : semester ? "Guardar cambios" : "Crear semestre"}</button>
        </div>
        {semester && (
          <button type="button" onClick={remove} disabled={saving} className="min-h-[44px] text-[14px] font-semibold text-danger disabled:opacity-50">Eliminar semestre</button>
        )}
      </form>
    </BottomSheet>
  );
}
