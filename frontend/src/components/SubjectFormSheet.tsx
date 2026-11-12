import { useEffect, useState } from "react";
import { BottomSheet, CATEGORY_PALETTE } from "./shared";
import { createSubject, currentSemester, semesterOptions, updateSubject, type Subject } from "../services/subjectsApi";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Materia a editar; null crea una nueva. */
  subject: Subject | null;
  /** Semestres ya usados, para ofrecerlos además de los cercanos al año actual. */
  knownSemesters: string[];
  /** Semestre preseleccionado al crear. */
  defaultSemester?: string;
  onSaved: (subject: Subject) => void;
}

const MAX_NAME = 100;

export default function SubjectFormSheet({ open, onClose, subject, knownSemesters, defaultSemester, onSaved }: Props) {
  const [name, setName] = useState("");
  const [credits, setCredits] = useState("3");
  const [semester, setSemester] = useState(currentSemester());
  const [color, setColor] = useState(CATEGORY_PALETTE[0]);
  const [defaultCuts, setDefaultCuts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // El formulario se precarga cada vez que se abre.
  useEffect(() => {
    if (!open) return;
    setName(subject?.name ?? "");
    setCredits(String(subject?.credits ?? 3));
    setSemester(subject?.semester ?? defaultSemester ?? currentSemester());
    setColor(subject?.color ?? CATEGORY_PALETTE[0]);
    setDefaultCuts(true);
    setError(null);
  }, [open, subject, defaultSemester]);

  const creditsNumber = Number(credits);
  const creditsValid = Number.isInteger(creditsNumber) && creditsNumber >= 1 && creditsNumber <= 20;
  const canSubmit = name.trim().length > 0 && creditsValid && !saving;

  function close() {
    if (!saving) onClose();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    try {
      setSaving(true);
      setError(null);
      const input = { name: name.trim(), credits: creditsNumber, semester, color, ...(subject ? {} : { defaultCuts }) };
      const saved = subject ? await updateSubject(subject.id, input) : await createSubject(input);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar la materia");
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={close} title={subject ? "Editar materia" : "Nueva materia"}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[14px] font-semibold text-ink">Nombre</span>
          <span className="flex items-center rounded-md border border-line bg-card px-3 py-3 transition-colors focus-within:border-coral">
            <input autoFocus value={name} maxLength={MAX_NAME} onChange={(e) => setName(e.target.value)} placeholder="Ej. Análisis Numérico" className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none" />
          </span>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[14px] font-semibold text-ink">Créditos</span>
            <span className={`flex items-center rounded-md border bg-card px-3 py-3 transition-colors focus-within:border-coral ${creditsValid || credits === "" ? "border-line" : "border-danger-line"}`}>
              <input value={credits} inputMode="numeric" onChange={(e) => setCredits(e.target.value.replace(/\D/g, "").slice(0, 2))} aria-invalid={!creditsValid} className="num min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none" />
            </span>
            <span className="text-[13px] text-ink-3">Entre 1 y 20</span>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[14px] font-semibold text-ink">Semestre</span>
            <select value={semester} onChange={(e) => setSemester(e.target.value)} className="num rounded-md border border-line bg-card px-3 py-3 text-[16px] text-ink outline-none focus:border-coral">
              {semesterOptions([...knownSemesters, semester]).map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>

        <div>
          <p className="mb-1 text-[14px] font-semibold text-ink">Color de la línea</p>
          <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Color de la materia">
            {CATEGORY_PALETTE.map((option) => (
              <button key={option} type="button" role="radio" aria-checked={color === option} aria-label={option} onClick={() => setColor(option)} className="flex h-11 w-11 items-center justify-center">
                <span className="h-7 w-7 rounded-[4px] border-2" style={{ background: option, borderColor: color === option ? "var(--color-ink)" : "transparent" }} />
              </button>
            ))}
          </div>
        </div>

        {!subject && (
          <label className="flex min-h-[44px] items-center gap-3">
            <input type="checkbox" checked={defaultCuts} onChange={(e) => setDefaultCuts(e.target.checked)} className="h-5 w-5 flex-shrink-0" style={{ accentColor: "var(--color-coral)" }} />
            <span className="text-[15px] text-ink">Crear 3 cortes (30 / 30 / 40 %)</span>
          </label>
        )}

        {error && <p role="alert" className="text-[14px] font-semibold text-danger">{error}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={close} disabled={saving} className="min-h-[48px] flex-1 rounded-md bg-wash text-[15px] font-semibold text-ink-2 disabled:opacity-50">Cancelar</button>
          <button type="submit" disabled={!canSubmit} className="min-h-[48px] flex-1 rounded-md bg-coral text-[15px] font-semibold text-night disabled:opacity-50">{saving ? "Guardando..." : subject ? "Guardar cambios" : "Crear materia"}</button>
        </div>
      </form>
    </BottomSheet>
  );
}
