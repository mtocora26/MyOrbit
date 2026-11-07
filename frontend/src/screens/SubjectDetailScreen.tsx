import { useEffect, useState } from "react";
import { BottomSheet, EmptyState, ProgressBar, ProgressRing, ScreenHeader } from "../components/shared";
import GradeStatusLine from "../components/GradeStatusLine";
import { fetchGradeSummary, formatGrade, gradeStatus, MAX_GRADE, type GradeSummary } from "../services/academicApi";
import { IconPencil } from "../components/icons";
import SubjectFormSheet from "../components/SubjectFormSheet";
import EvaluationFormSheet from "../components/EvaluationFormSheet";
import { fetchEvaluations, formatNumber, MAX_PERCENTAGE, type Evaluation } from "../services/evaluationsApi";
import { deleteSubject, type Subject } from "../services/subjectsApi";

interface Props {
  subject: Subject;
  onBack: () => void;
  /** Se llama tras eliminar la materia para salir de su detalle. */
  onDeleted: () => void;
  onGrades: () => void;
}

export default function SubjectDetailScreen({ subject: initial, onBack, onDeleted, onGrades }: Props) {
  const [subject, setSubject] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loadingEvals, setLoadingEvals] = useState(true);
  const [evalsError, setEvalsError] = useState<string | null>(null);
  // La hoja de evaluación conserva su contenido mientras anima la salida.
  const [summary, setSummary] = useState<GradeSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [editingEval, setEditingEval] = useState<Evaluation | null>(null);
  const [evalSheetOpen, setEvalSheetOpen] = useState(false);

  async function loadEvaluations() {
    try {
      setLoadingEvals(true);
      setEvalsError(null);
      setEvaluations(await fetchEvaluations(subject.id));
    } catch (err) {
      setEvalsError(err instanceof Error ? err.message : "No fue posible cargar las evaluaciones");
    } finally {
      setLoadingEvals(false);
    }
  }

  useEffect(() => { loadEvaluations(); }, [subject.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // La nota actual y la necesaria dependen de cada evaluación: se recalculan cuando cambian.
  const evaluationsKey = evaluations.map((evaluation) => `${evaluation.id}:${evaluation.percentage}:${evaluation.grade ?? ""}`).join("|");
  useEffect(() => {
    let cancelled = false;
    fetchGradeSummary(subject.id)
      .then((value) => { if (!cancelled) { setSummary(value); setSummaryError(null); } })
      .catch((err) => { if (!cancelled) setSummaryError(err instanceof Error ? err.message : "No fue posible calcular las notas"); });
    return () => { cancelled = true; };
  }, [subject.id, evaluationsKey]);

  const status = summary ? gradeStatus(summary) : null;
  const assigned = evaluations.reduce((sum, evaluation) => sum + evaluation.percentage, 0);
  const remaining = Math.max(0, MAX_PERCENTAGE - assigned);

  function openEvalSheet(evaluation: Evaluation | null) {
    setEditingEval(evaluation);
    setEvalSheetOpen(true);
  }

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

        {summary && status && (
          <section aria-label="Notas de la materia" className="rounded-md border border-line bg-card p-4">
            <div className="flex items-center gap-4">
              <ProgressRing value={((summary.currentGrade ?? 0) / MAX_GRADE) * 100} size={72} stroke={6} color={subject.color}>
                <span className="num text-[22px] font-semibold leading-none text-ink">{summary.currentGrade === null ? "–" : formatGrade(summary.currentGrade)}</span>
              </ProgressRing>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-ink">{summary.currentGrade === null ? "Sin notas aún" : "Nota actual"}</p>
                <p className="num text-[14px] text-ink-2">Meta {formatGrade(summary.targetGrade)} · {formatNumber(summary.gradedPercentage)}% calificado</p>
              </div>
            </div>
            <div className="mt-3"><GradeStatusLine tone={status.tone}>{status.long}</GradeStatusLine></div>
            <button onClick={onGrades} className="mt-3 min-h-[44px] w-full rounded-md bg-wash text-[15px] font-semibold text-ink">Ver notas y proyección</button>
          </section>
        )}
        {summaryError && !summary && <p role="alert" className="text-[14px] font-semibold text-danger">{summaryError}</p>}

        <section aria-labelledby="evals-title" className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 id="evals-title" className="font-display text-[20px] font-semibold leading-none tracking-tight text-ink">Evaluaciones</h2>
            {evaluations.length > 0 && <button onClick={() => openEvalSheet(null)} className="-mr-2 flex min-h-[44px] items-center px-2 text-[14px] font-semibold text-coral-ink">Agregar</button>}
          </div>

          {evalsError && (
            <div role="alert" className="flex items-center justify-between gap-3 rounded-md border border-danger-line bg-danger-wash px-3 py-2">
              <p className="text-[14px] font-semibold text-danger">{evalsError}</p>
              <button onClick={loadEvaluations} className="min-h-[44px] flex-shrink-0 px-2 text-[14px] font-semibold text-coral-ink">Reintentar</button>
            </div>
          )}

          {loadingEvals ? (
            <p className="text-[14px] text-ink-2">Cargando evaluaciones...</p>
          ) : evaluations.length === 0 && !evalsError ? (
            <div className="rounded-md border border-dashed border-line-strong">
              <EmptyState title="Aún no hay evaluaciones" sub="Agrega parciales, talleres y finales con su porcentaje para ver cómo va la materia." action="Agregar evaluación" onAction={() => openEvalSheet(null)} />
            </div>
          ) : evaluations.length > 0 && (
            <>
              <div className="rounded-md border border-line bg-card p-3">
                <p className="flex items-baseline justify-between text-[14px] text-ink-2">
                  <span>Porcentaje repartido</span>
                  <span className="num text-[18px] font-semibold text-ink">{formatNumber(assigned)}%<span className="text-[14px] font-normal text-ink-3"> de {MAX_PERCENTAGE}%</span></span>
                </p>
                <div className="mt-2"><ProgressBar value={Math.min(assigned, MAX_PERCENTAGE)} color={subject.color} height={4} /></div>
                {remaining > 0 && <p className="num mt-1.5 text-[13px] text-ink-2">Falta repartir {formatNumber(remaining)}%</p>}
              </div>
              <ul className="overflow-hidden rounded-md border border-line bg-card">
                {evaluations.map((evaluation, index) => {
                  const graded = evaluation.grade !== null;
                  return (
                    <li key={evaluation.id} className={index > 0 ? "border-t border-line" : ""}>
                      <button onClick={() => openEvalSheet(evaluation)} aria-label={`Editar evaluación ${evaluation.name}`} className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-wash">
                        {/* Estación: llena = ya tiene nota, hueca = pendiente */}
                        <span className="h-[18px] w-[18px] flex-shrink-0 rounded-full border-[3px]" style={{ borderColor: subject.color, background: graded ? subject.color : "var(--color-card)" }} aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[16px] font-semibold text-ink">{evaluation.name}</span>
                          <span className="num block text-[13px] text-ink-2">{formatNumber(evaluation.percentage)}% de la nota</span>
                        </span>
                        {graded
                          ? <span className="num text-[26px] font-semibold leading-none text-ink">{formatNumber(evaluation.grade as number)}</span>
                          : <span className="rounded-[3px] bg-wash px-1.5 py-[3px] text-[13px] font-semibold leading-none text-ink-2">Pendiente</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      </div>

      <EvaluationFormSheet
        open={evalSheetOpen}
        onClose={() => setEvalSheetOpen(false)}
        subjectId={subject.id}
        evaluation={editingEval}
        availablePercentage={Math.max(0, MAX_PERCENTAGE - evaluations.filter((evaluation) => evaluation.id !== editingEval?.id).reduce((sum, evaluation) => sum + evaluation.percentage, 0))}
        onSaved={(saved) => setEvaluations((current) => current.some((item) => item.id === saved.id) ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved])}
        onDeleted={(id) => setEvaluations((current) => current.filter((item) => item.id !== id))}
      />

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
