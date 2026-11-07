import { readErrorMessage } from "./apiError";
import { authHeaders } from "./authApi";
import { API_BASE_URL } from "./apiConfig";

export interface Evaluation {
  id: string;
  subjectId: string;
  name: string;
  /** Peso en la nota final: mayor que 0 y hasta 100. */
  percentage: number;
  /** 0 a 5; null mientras no se conoce. */
  grade: number | null;
}

export interface EvaluationInput {
  name: string;
  percentage: number;
  grade: number | null;
}

export const MAX_PERCENTAGE = 100;

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
