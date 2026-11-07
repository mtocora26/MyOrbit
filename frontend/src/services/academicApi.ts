import { readErrorMessage } from "./apiError";
import { authHeaders } from "./authApi";
import { API_BASE_URL } from "./apiConfig";

export const MAX_GRADE = 5;

export interface GradeSummary {
  /** Promedio ponderado de lo ya calificado; null si no hay notas. */
  currentGrade: number | null;
  /** Puntos ganados sobre la nota final (nota × porcentaje / 100). */
  accumulatedPoints: number;
  gradedPercentage: number;
  remainingPercentage: number;
  targetGrade: number;
  /** Promedio necesario en lo pendiente (0 = ya alcanzada); null si no queda nada por calificar. */
  requiredGrade: number | null;
  achievable: boolean;
}

export interface SubjectStanding {
  subjectId: string;
  name: string;
  credits: number;
  semester: string;
  grades: GradeSummary;
  atRisk: boolean;
}

export interface AcademicSummary {
  /** Promedio por créditos de las materias con notas; null si ninguna. */
  weightedAverage: number | null;
  totalCredits: number;
  gradedCredits: number;
  targetGrade: number;
  subjects: SubjectStanding[];
  atRisk: SubjectStanding[];
}

export async function fetchGradeSummary(subjectId: string): Promise<GradeSummary> {
  const response = await fetch(`${API_BASE_URL}/api/subjects/${subjectId}/evaluations/summary`, { headers: authHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible calcular las notas"));
  return response.json();
}

export async function fetchAcademicSummary(semester?: string): Promise<AcademicSummary> {
  const query = semester ? `?semester=${encodeURIComponent(semester)}` : "";
  const response = await fetch(`${API_BASE_URL}/api/academic/summary${query}`, { headers: authHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible cargar el resumen académico"));
  return response.json();
}

/** Nota con hasta dos decimales y coma decimal: 3.6 → "3,6", 3.667 → "3,67". */
export function formatGrade(value: number): string {
  return value.toLocaleString("es", { maximumFractionDigits: 2 });
}

export type GradeTone = "ok" | "need" | "risk" | "idle";

export interface GradeStatus {
  tone: GradeTone;
  /** Texto corto para listas. */
  short: string;
  /** Frase completa para el detalle. */
  long: string;
}

/** Traduce el resumen del backend a una frase: qué falta para llegar a la meta. */
export function gradeStatus(summary: GradeSummary): GradeStatus {
  const target = formatGrade(summary.targetGrade);
  const left = `${formatGrade(summary.remainingPercentage)}%`;
  const { requiredGrade } = summary;

  if (requiredGrade === null) {
    return summary.achievable
      ? { tone: "ok", short: "Meta lograda", long: `Materia completa: alcanzaste la meta de ${target}.` }
      : { tone: "risk", short: "Meta no alcanzada", long: `Materia completa: no se llegó a la meta de ${target}.` };
  }
  if (requiredGrade === 0) {
    return { tone: "ok", short: "Meta lograda", long: `Ya alcanzaste la meta de ${target}; lo que falta (${left}) no la pone en riesgo.` };
  }
  if (!summary.achievable) {
    return { tone: "risk", short: `Necesitas ${formatGrade(requiredGrade)} (>5)`, long: `Con el ${left} que queda no llegas a la meta de ${target}: necesitarías ${formatGrade(requiredGrade)}, y el máximo es ${MAX_GRADE}.` };
  }
  return {
    tone: summary.currentGrade === null ? "idle" : "need",
    short: `Necesitas ${formatGrade(requiredGrade)}`,
    long: `Necesitas ${formatGrade(requiredGrade)} de promedio en el ${left} restante para llegar a la meta de ${target}.`,
  };
}

/** Nota final si en lo pendiente se obtiene `expected` de promedio. */
export function projectedFinal(summary: GradeSummary, expected: number): number {
  return summary.accumulatedPoints + (expected * summary.remainingPercentage) / 100;
}
