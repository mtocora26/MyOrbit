import { readErrorMessage } from "./apiError";
import { authHeaders } from "./authApi";
import { API_BASE_URL } from "./apiConfig";

export interface Semester {
  id: string;
  /** Formato AAAA-1 o AAAA-2. Las materias lo referencian por este nombre. */
  name: string;
  /** Fechas ISO (AAAA-MM-DD); null mientras el usuario no las complete. */
  startDate: string | null;
  endDate: string | null;
  /** Hoy (en la zona del usuario) cae dentro de sus fechas. */
  current: boolean;
  /** Falta el inicio o el fin. */
  missingDates: boolean;
  /** Meta de promedio del semestre; null = sin meta propia. */
  targetAverage: number | null;
}

export interface SemesterInput {
  name: string;
  startDate: string | null;
  endDate: string | null;
  targetAverage?: number | null;
}

const JSON_HEADERS = () => ({ "Content-Type": "application/json", ...authHeaders() });

export async function fetchSemesters(): Promise<Semester[]> {
  const response = await fetch(`${API_BASE_URL}/api/semesters`, { headers: authHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible cargar los semestres"));
  return response.json();
}

export async function createSemester(input: SemesterInput): Promise<Semester> {
  const response = await fetch(`${API_BASE_URL}/api/semesters`, { method: "POST", headers: JSON_HEADERS(), body: JSON.stringify(input) });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible crear el semestre"));
  return response.json();
}

export async function updateSemester(id: string, input: SemesterInput): Promise<Semester> {
  const response = await fetch(`${API_BASE_URL}/api/semesters/${id}`, { method: "PUT", headers: JSON_HEADERS(), body: JSON.stringify(input) });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible editar el semestre"));
  return response.json();
}

export async function deleteSemester(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/semesters/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible eliminar el semestre"));
}
