import { readErrorMessage } from "./apiError";
import { authHeaders } from "./authApi";
import { API_BASE_URL } from "./apiConfig";

/** Parte de un corte; su porcentaje es sobre el corte, no sobre la materia. */
export interface EvaluationComponent {
  name: string;
  /** Mayor que 0 y hasta 100 (los de un corte suman como máximo 100). */
  percentage: number;
  /** 0 a 5; null mientras no se conoce. */
  grade: number | null;
}

export interface Evaluation {
  id: string;
  subjectId: string;
  name: string;
  /** Peso en la nota final: mayor que 0 y hasta 100. */
  percentage: number;
  /** Nota definitiva del corte (directa o promedio de sus componentes cuando está completo); null mientras no se conoce. */
  grade: number | null;
  /** Fecha y hora ISO sin zona (2026-11-20T08:00); null si no tiene. */
  due: string | null;
  /** Promedio de los componentes ya calificados aunque falten otros; igual a `grade` sin componentes. */
  provisionalGrade: number | null;
  /** Cuenta como calificado: nota directa, o todos los componentes con nota sumando 100 %. */
  complete: boolean;
  /** Vacío = el corte usa nota directa. */
  components: EvaluationComponent[];
}

export interface EvaluationInput {
  name: string;
  percentage: number;
  /** Con componentes no se envía nota directa. */
  grade: number | null;
  due: string | null;
  /** Ausente o vacío = nota directa. El PUT reemplaza: omitirlos los quita. */
  components?: EvaluationComponent[];
}

export const MAX_PERCENTAGE = 100;

/** Los tres cortes por defecto de una materia (30/30/40), igual que `defaultCuts` en el backend. */
export const DEFAULT_CUTS = [{ name: "Corte 1", percentage: 30 }, { name: "Corte 2", percentage: 30 }, { name: "Corte 3", percentage: 40 }];

/** Promedio ponderado de los componentes con nota (normalizado por su peso) y si el corte está completo. Solo para previsualizar. */
export function componentsAverage(components: { percentage: number; grade: number | null }[]): { average: number | null; complete: boolean } {
  const graded = components.filter((part) => part.grade !== null);
  const weight = graded.reduce((sum, part) => sum + part.percentage, 0);
  const total = components.reduce((sum, part) => sum + part.percentage, 0);
  const average = weight > 0 ? graded.reduce((sum, part) => sum + (part.grade as number) * part.percentage, 0) / weight : null;
  return { average, complete: components.length > 0 && graded.length === components.length && Math.abs(total - MAX_PERCENTAGE) < 1e-9 };
}

const base = (subjectId: string) => `${API_BASE_URL}/api/subjects/${subjectId}/evaluations`;
const JSON_HEADERS = () => ({ "Content-Type": "application/json", ...authHeaders() });

export async function fetchEvaluations(subjectId: string): Promise<Evaluation[]> {
  const response = await fetch(base(subjectId), { headers: authHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible cargar las evaluaciones"));
  return response.json();
}

export async function createEvaluation(subjectId: string, input: EvaluationInput): Promise<Evaluation> {
  const response = await fetch(base(subjectId), { method: "POST", headers: JSON_HEADERS(), body: JSON.stringify(input) });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible crear la evaluación"));
  return response.json();
}

/** PUT reemplaza la evaluación completa: `grade: null` borra la nota. */
export async function updateEvaluation(subjectId: string, id: string, input: EvaluationInput): Promise<Evaluation> {
  const response = await fetch(`${base(subjectId)}/${id}`, { method: "PUT", headers: JSON_HEADERS(), body: JSON.stringify(input) });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible editar la evaluación"));
  return response.json();
}

export async function deleteEvaluation(subjectId: string, id: string): Promise<void> {
  const response = await fetch(`${base(subjectId)}/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible eliminar la evaluación"));
}

/** Acepta "4,5" y "4.5"; devuelve null si está vacío o no es un número. */
export function parseDecimal(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (normalized === "") return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** Porcentaje sin ceros sobrantes: 30 → "30", 12.5 → "12,5". */
export function formatNumber(value: number): string {
  return value.toLocaleString("es", { maximumFractionDigits: 2 });
}
