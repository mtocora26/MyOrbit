import { useEffect, useState } from "react";
import { ProgressBar, ScreenHeader } from "../components/shared";
import GradeStatusLine from "../components/GradeStatusLine";
import { fetchGradeSummary, formatGrade, gradeStatus, MAX_GRADE, projectedFinal, type GradeSummary } from "../services/academicApi";
import { fetchEvaluations, formatNumber, type Evaluation } from "../services/evaluationsApi";
import type { Subject } from "../services/subjectsApi";

interface Props { subject: Subject; onBack: () => void; }

export default function GradesScreen({ subject, onBack }: Props) {
  const [summary, setSummary] = useState<GradeSummary | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expected, setExpected] = useState(MAX_GRADE / 2);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const [loadedSummary, loadedEvaluations] = await Promise.all([fetchGradeSummary(subject.id), fetchEvaluations(subject.id)]);
      setSummary(loadedSummary);
      setEvaluations(loadedEvaluations);
      // El simulador arranca en lo que hay que sacar para llegar a la meta (o en la meta si ya no importa).
      const start = loadedSummary.requiredGrade ?? loadedSummary.targetGrade;
      setExpected(Math.min(MAX_GRADE, Math.max(0, Math.round((start || loadedSummary.targetGrade) * 10) / 10)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar las notas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [subject.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const status = summary ? gradeStatus(summary) : null;
  const projected = summary ? projectedFinal(summary, expected) : 0;
  const reaches = summary ? projected >= summary.targetGrade - 1e-9 : false;
  const hasPending = !!summary && summary.remainingPercentage > 0;

  return (
    <div className="flex h-full min-h-0 flex-col bg-paper">
      <ScreenHeader title="Notas y metas" subtitle={subject.name} onBack={onBack} />

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pt-3 pb-8 lg:max-w-[760px] lg:px-8 lg:pt-6">
        {error && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-md border border-danger-line bg-danger-wash px-3 py-2">
            <p className="text-[14px] font-semibold text-danger">{error}</p>
            <button onClick={load} className="min-h-[44px] flex-shrink-0 px-2 text-[14px] font-semibold text-coral-ink">Reintentar</button>
          </div>
        )}
        {loading && <p className="text-[14px] text-ink-2">Calculando notas...</p>}

        {summary && status && (
          <>
            <section aria-label="Resumen" className="rounded-md border border-line bg-card p-4">
              <dl className="grid grid-cols-3 divide-x divide-line">
                <Figure label="Actual" value={summary.currentGrade === null ? "–" : formatGrade(summary.currentGrade)} />
                <Figure label="Meta" value={formatGrade(summary.targetGrade)} accent />
                <Figure label="Puntos" value={formatGrade(summary.accumulatedPoints)} sub={`de ${MAX_GRADE}`} />
              </dl>
              <div className="mt-4">
                <ProgressBar value={Math.min(summary.gradedPercentage, 100)} color={subject.color} height={4} />
                <p className="num mt-1.5 text-[13px] text-ink-2">{formatNumber(summary.gradedPercentage)}% calificado · {formatNumber(summary.remainingPercentage)}% por calificar</p>
              </div>
              <div className="mt-3"><GradeStatusLine tone={status.tone}>{status.long}</GradeStatusLine></div>
            </section>

            {hasPending && (
              <section aria-labelledby="sim-title" className="rounded-md border border-line bg-card p-4">
                <h2 id="sim-title" className="font-display text-[20px] font-semibold leading-none tracking-tight text-ink">Simulador</h2>
                <p className="mt-1 text-[14px] text-ink-2">¿Qué promedio sacarías en el {formatNumber(summary.remainingPercentage)}% restante?</p>
                <div className="mt-3 flex items-center gap-3">
                  <input type="range" min={0} max={MAX_GRADE} step={0.1} value={expected} onChange={(e) => setExpected(Number(e.target.value))} aria-label="Promedio esperado en lo que falta" className="h-11 min-w-0 flex-1" style={{ accentColor: "var(--color-coral)" }} />
                  <span className="num w-12 text-right text-[26px] font-semibold leading-none text-ink">{formatGrade(expected)}</span>
                </div>
                <p className="num mt-3 flex items-baseline justify-between text-[14px] text-ink-2">
                  <span>Nota final proyectada</span>
                  <span className="text-[26px] font-semibold leading-none text-ink">{formatGrade(projected)}</span>
                </p>
                <div className="mt-2">
                  <GradeStatusLine tone={reaches ? "ok" : "risk"}>
                    {reaches ? `Llegas a la meta de ${formatGrade(summary.targetGrade)}.` : `Te faltarían ${formatGrade(summary.targetGrade - projected)} puntos para la meta de ${formatGrade(summary.targetGrade)}.`}
                  </GradeStatusLine>
                </div>
              </section>
            )}

            <section aria-labelledby="evals-grades-title" className="flex flex-col gap-2">
              <h2 id="evals-grades-title" className="font-display text-[20px] font-semibold leading-none tracking-tight text-ink">Notas por evaluación</h2>
              {evaluations.length === 0 ? (
                <p className="rounded-md border border-dashed border-line-strong px-4 py-6 text-center text-[14px] text-ink-2">Agrega evaluaciones en el detalle de la materia para ver tus notas.</p>
              ) : (
                <ul className="overflow-hidden rounded-md border border-line bg-card">
                  {evaluations.map((evaluation, index) => {
                    const graded = evaluation.grade !== null;
                    const points = graded ? ((evaluation.grade as number) * evaluation.percentage) / 100 : null;
                    return (
                      <li key={evaluation.id} className={`flex items-center gap-3 px-4 py-3 ${index > 0 ? "border-t border-line" : ""}`}>
                        <span className="h-[18px] w-[18px] flex-shrink-0 rounded-full border-[3px]" style={{ borderColor: subject.color, background: graded ? subject.color : "var(--color-card)" }} aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[16px] font-semibold text-ink">{evaluation.name}</span>
                          <span className="num block text-[13px] text-ink-2">{formatNumber(evaluation.percentage)}%{points !== null ? ` · aporta ${formatGrade(points)}` : ""}</span>
                        </span>
                        {graded
                          ? <span className="num text-[26px] font-semibold leading-none text-ink">{formatGrade(evaluation.grade as number)}</span>
                          : <span className="num text-right text-[13px] font-semibold text-ink-2">{summary.requiredGrade !== null && summary.requiredGrade > 0 ? `Necesitas ${formatGrade(summary.requiredGrade)}` : "Pendiente"}</span>}
                      </li>
                    );
                  })}
                </ul>
              )}
              {summary.requiredGrade !== null && summary.requiredGrade > 0 && evaluations.some((evaluation) => evaluation.grade === null) && (
                <p className="text-[13px] text-ink-3">«Necesitas» es el promedio mínimo que debes sacar en conjunto en lo pendiente para llegar a la meta.</p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function Figure({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="px-3 first:pl-0">
      <dt className="text-[13px] font-medium text-ink-2">{label}</dt>
      <dd className="mt-1 flex items-baseline gap-1">
        <span className={`num text-[32px] font-semibold leading-none ${accent ? "text-coral-ink" : "text-ink"}`}>{value}</span>
        {sub && <span className="num text-[13px] text-ink-3">{sub}</span>}
      </dd>
    </div>
  );
}
