import type { Subject } from "../services/subjectsApi";

interface Props {
  subjects: Subject[];
  /** Id de la materia elegida; "" = ninguna. */
  value: string;
  onChange: (subjectId: string) => void;
  className?: string;
}

/** Selector de la materia a la que pertenece una tarea. No se muestra si el usuario aún no tiene materias. */
export default function SubjectPicker({ subjects, value, onChange, className = "" }: Props) {
  if (subjects.length === 0 && !value) return null;
  const known = subjects.some((subject) => subject.id === value);
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[13px] font-semibold text-ink-2">Materia (opcional)</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Materia de la tarea" className="min-h-[44px] rounded-md border border-line bg-card px-3 py-2.5 text-[14px] text-ink outline-none focus:border-coral">
        <option value="">Sin materia</option>
        {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name} · {subject.semester}</option>)}
        {value && !known && <option value={value}>Materia</option>}
      </select>
    </label>
  );
}
