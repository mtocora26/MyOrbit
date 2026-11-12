import { readErrorMessage } from "./apiError";
import { authHeaders } from "./authApi";
import { API_BASE_URL } from "./apiConfig";

/** Franja semanal de una materia: se repite cada semana mientras dura el semestre. */
export interface ClassSlot {
  /** 1 = lunes ... 7 = domingo. */
  dayOfWeek: number;
  /** HH:mm (24 h). */
  start: string;
  end: string;
  room: string | null;
}

export const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export function formatSlot(slot: ClassSlot): string {
  return `${DAY_NAMES[slot.dayOfWeek - 1]} ${slot.start}–${slot.end}${slot.room ? ` · ${slot.room}` : ""}`;
}

/** Por día de la semana y luego por hora de inicio. */
export function sortSlots<T extends { dayOfWeek: number; start: string }>(slots: T[]): T[] {
  return [...slots].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.start.localeCompare(b.start));
}

export interface Subject {
  id: string;
  name: string;
  credits: number;
  /** Formato AAAA-1 o AAAA-2. */
  semester: string;
  color: string;
  /** Meta propia de la materia; null = la del semestre, el Perfil o 3,0. */
  targetGrade: number | null;
  /** Nota mínima para aprobar; null = 3,0. */
  passingGrade: number | null;
  /** Horario semanal; vacío si no tiene. */
  schedule: ClassSlot[];
}

export interface SubjectInput {
  name: string;
  credits: number;
  semester: string;
  color?: string;
  /** null quita la meta propia (el PUT reemplaza). */
  targetGrade?: number | null;
  passingGrade?: number | null;
  /** El PUT reemplaza: omitirlo quita el horario. */
  schedule?: ClassSlot[];
  /** Solo al crear: genera «Corte 1/2/3» con 30/30/40 %. */
  defaultCuts?: boolean;
}

const JSON_HEADERS = () => ({ "Content-Type": "application/json", ...authHeaders() });

export async function fetchSubjects(): Promise<Subject[]> {
  const response = await fetch(`${API_BASE_URL}/api/subjects`, { headers: authHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible cargar las materias"));
  return response.json();
}

export async function createSubject(input: SubjectInput): Promise<Subject> {
  const response = await fetch(`${API_BASE_URL}/api/subjects`, { method: "POST", headers: JSON_HEADERS(), body: JSON.stringify(input) });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible crear la materia"));
  return response.json();
}

export async function updateSubject(id: string, input: SubjectInput): Promise<Subject> {
  const response = await fetch(`${API_BASE_URL}/api/subjects/${id}`, { method: "PUT", headers: JSON_HEADERS(), body: JSON.stringify(input) });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible editar la materia"));
  return response.json();
}

export async function deleteSubject(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/subjects/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible eliminar la materia"));
}

/** Semestre sugerido para una materia nueva: ene-jun = 1, jul-dic = 2. */
export function currentSemester(now = new Date()): string {
  return `${now.getFullYear()}-${now.getMonth() < 6 ? 1 : 2}`;
}

/** Opciones de semestre: año anterior, actual y siguiente, más los que ya usan las materias. */
export function semesterOptions(existing: string[], now = new Date()): string[] {
  const year = now.getFullYear();
  const generated = [year - 1, year, year + 1].flatMap((y) => [`${y}-1`, `${y}-2`]);
  return [...new Set([...generated, ...existing])].sort().reverse();
}
