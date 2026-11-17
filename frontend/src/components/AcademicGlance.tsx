import { useEffect, useState } from "react";
import { Skeleton } from "./shared";
import { fetchAcademicSummary, fetchAgendaEvaluations, formatGrade, type AcademicSummary, type AgendaEvaluation } from "../services/academicApi";

interface Props {
  /** Lleva a Universidad. */
  onOpen: () => void;
  /** Se recarga cuando cambian los datos de Inicio. */
  refreshTick: number;
}

/** La próxima evaluación sin calificar que aún no pasó. */
function nextEvaluation(list: AgendaEvaluation[], now = Date.now()): AgendaEvaluation | null {
  return list
    .filter((item) => item.grade === null && new Date(item.due).getTime() >= now)
    .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())[0] ?? null;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" });
}

/**
 * Una línea tocable de Inicio con lo accionable de la universidad: promedio frente a la meta, materias en riesgo y el
 * próximo parcial con su fecha. Sin materias no ocupa espacio; si no carga, ofrece reintentar sin tapar el resto.
 */
export default function AcademicGlance({ onOpen, refreshTick }: Props) {
  const [summary, setSummary] = useState<AcademicSummary | null>(null);
  const [next, setNext] = useState<AgendaEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    let ignore = false;
    setFailed(false);
    Promise.all([fetchAcademicSummary(), fetchAgendaEvaluations().catch(() => [] as AgendaEvaluation[])])
      .then(([academic, evaluations]) => {
        if (ignore) return;
        setSummary(academic);
        setNext(nextEvaluation(evaluations));
      })
      .catch(() => { if (!ignore) setFailed(true); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [refreshTick, retryTick]);

  if (loading) return <Skeleton className="h-[72px] w-full" />;

  if (failed) {
    return (
      <section aria-label="Universidad" role="alert" className="flex items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-[14px] text-ink-2">No pudimos cargar tu resumen de la universidad.</p>
        <button type="button" onClick={() => { setLoading(true); setRetryTick((tick) => tick + 1); }} className="min-h-[44px] flex-shrink-0 px-2 text-[14px] font-semibold text-coral-ink">Reintentar</button>
      </section>
    );
  }

  // Sin materias no hay nada que resumir: no se ocupa espacio ni se pide configurar nada.
  if (!summary || summary.subjects.length === 0) return null;

  const atRisk = summary.atRisk.length;
  const average = summary.weightedAverage === null ? "Sin notas" : formatGrade(summary.weightedAverage);
  const detail = atRisk > 0
    ? { text: `${atRisk} ${atRisk === 1 ? "materia en riesgo" : "materias en riesgo"}`, risk: true }
    : next
      ? { text: `${next.name} · ${next.subjectName} · ${shortDate(next.due)}`, risk: false }
      : null;

  return (
    <section aria-label="Universidad" className="border-t border-line pt-4">
      <button type="button" onClick={onOpen} className="flex min-h-[56px] w-full items-center gap-3 rounded-md text-left transition-transform duration-150 ease-out active:scale-[0.99]">
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[20px] font-semibold leading-none text-ink">Universidad</span>
          <span className="num mt-2 block text-[15px] text-ink-2">
            Promedio <span className="font-semibold text-ink">{average}</span> · meta {formatGrade(summary.targetGrade)}
          </span>
          {detail && <span className={`mt-0.5 block text-[14px] ${detail.risk ? "font-semibold text-danger" : "text-ink-2"}`}>{detail.text}</span>}
        </span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-ink-3" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
      </button>
    </section>
  );
}
