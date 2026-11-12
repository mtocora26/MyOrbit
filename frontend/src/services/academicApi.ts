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
  /** Nota mínima para aprobar (distinta de la meta). */
  passingGrade: number;
  /** Igual que `requiredGrade`, pero para aprobar. */
  requiredToPass: number | null;
  /** Igual que `achievable`, pero para aprobar: false si ya no alcanza para aprobar. */
  canPass: boolean;
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

/** Evaluación con fecha, junto a su materia, lista para la Agenda. */
export interface AgendaEvaluation {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  name: string;
  percentage: number;
  grade: number | null;
  due: string;
}

export async function fetchAgendaEvaluations(): Promise<AgendaEvaluation[]> {
  const response = await fetch(`${API_BASE_URL}/api/academic/evaluations`, { headers: authHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible cargar las evaluaciones"));
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

/** Estado de la aprobación: se mide contra la nota mínima para aprobar, no contra la meta. */
export function passStatus(summary: GradeSummary): GradeStatus {
  const pass = formatGrade(summary.passingGrade);
  const left = `${formatGrade(summary.remainingPercentage)}%`;
  const { requiredToPass } = summary;

  if (requiredToPass === null) {
    return summary.canPass
      ? { tone: "ok", short: "Aprobada", long: `Materia completa: aprobaste (mínimo ${pass}).` }
      : { tone: "risk", short: "Reprobada", long: `Materia completa: no se llegó a la nota para aprobar (${pass}).` };
  }
  if (requiredToPass === 0) {
    return { tone: "ok", short: "Aprobada", long: `Ya aprobaste (mínimo ${pass}); lo que falta (${left}) no lo cambia.` };
  }
  if (!summary.canPass) {
    return { tone: "risk", short: "No alcanza para aprobar", long: `Con el ${left} que queda no llegas a aprobar (${pass}): necesitarías ${formatGrade(requiredToPass)}, y el máximo es ${MAX_GRADE}.` };
  }
  return { tone: "need", short: `Para aprobar ${formatGrade(requiredToPass)}`, long: `Para aprobar (${pass}) necesitas ${formatGrade(requiredToPass)} de promedio en el ${left} restante.` };
}

/** Nota final si en lo pendiente se obtiene `expected` de promedio. */
export function projectedFinal(summary: GradeSummary, expected: number): number {
  return summary.accumulatedPoints + (expected * summary.remainingPercentage) / 100;
}
