import { useState } from "react";
import { BottomSheet, ScreenHeader } from "../components/shared";
import { IconPencil } from "../components/icons";
import SubjectFormSheet from "../components/SubjectFormSheet";
import { deleteSubject, type Subject } from "../services/subjectsApi";

interface Props {
  subject: Subject;
  onBack: () => void;
  /** Se llama tras eliminar la materia para salir de su detalle. */
  onDeleted: () => void;
}

export default function SubjectDetailScreen({ subject: initial, onBack, onDeleted }: Props) {
  const [subject, setSubject] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (deleting) return;
    try {
      setDeleting(true);
      setError(null);
      await deleteSubject(subject.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible eliminar la materia");
      setDeleting(false);
    }
  }

  return (
    <div className="relative flex h-full flex-col bg-paper">
      <ScreenHeader
        title={subject.name}
        subtitle={`${subject.credits} ${subject.credits === 1 ? "crédito" : "créditos"} · Semestre ${subject.semester}`}
        onBack={onBack}
        right={
          <div className="-mr-2 flex items-center">
            <button onClick={() => setEditing(true)} aria-label={`Editar materia ${subject.name}`} className="flex h-11 w-11 items-center justify-center rounded-md text-ink-2 transition-colors active:bg-wash"><IconPencil size={18} /></button>
            <button onClick={() => { setError(null); setConfirmingDelete(true); }} aria-label={`Eliminar materia ${subject.name}`} className="flex h-11 w-11 items-center justify-center rounded-md text-ink-2 transition-colors active:bg-wash">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 7h12M9 7V5h6v2M9 10v7M12 10v7M15 10v7M7 7l1 12h8l1-12" /></svg>
            </button>
          </div>
        }
      />

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pt-3 pb-8 lg:max-w-[760px] lg:px-8 lg:pt-6">
        <div className="flex items-center gap-3 rounded-md border border-line bg-card p-4">
          <span className="h-10 w-3 flex-shrink-0 rounded-[3px]" style={{ background: subject.color }} aria-hidden="true" />
          <dl className="grid flex-1 grid-cols-2 gap-3">
            <div><dt className="text-[13px] text-ink-2">Créditos</dt><dd className="num mt-0.5 text-[26px] font-semibold leading-none text-ink">{subject.credits}</dd></div>
            <div><dt className="text-[13px] text-ink-2">Semestre</dt><dd className="num mt-0.5 text-[26px] font-semibold leading-none text-ink">{subject.semester}</dd></div>
          </dl>
        </div>
      </div>

      <SubjectFormSheet open={editing} onClose={() => setEditing(false)} subject={subject} knownSemesters={[subject.semester]} onSaved={setSubject} />

      <BottomSheet open={confirmingDelete} onClose={() => { if (!deleting) setConfirmingDelete(false); }} title="Eliminar materia">
        <div className="flex flex-col gap-4">
          <p className="text-[15px] leading-snug text-ink">
            ¿Eliminar <strong className="font-semibold">{subject.name}</strong>? Se borrarán también todas sus evaluaciones. Esta acción no se puede deshacer.
          </p>
          {error && <p role="alert" className="text-[14px] font-semibold text-danger">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirmingDelete(false)} disabled={deleting} className="min-h-[48px] flex-1 rounded-md bg-wash text-[15px] font-semibold text-ink-2 disabled:opacity-50">Cancelar</button>
            <button type="button" onClick={remove} disabled={deleting} className="min-h-[48px] flex-1 rounded-md bg-danger text-[15px] font-semibold text-white disabled:opacity-50">{deleting ? "Eliminando..." : "Eliminar"}</button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
