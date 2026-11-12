import { readErrorMessage } from "./apiError";
import { authHeaders } from "./authApi";
import { API_BASE_URL } from "./apiConfig";

/** Actividad de uno o varios días («semana de parciales»). No se repite como una clase ni es una fecha límite como una tarea. */
export interface CalendarEvent {
  id: string;
  title: string;
  /** AAAA-MM-DD. */
  startDate: string;
  /** Último día (incluido); igual a `startDate` si dura uno solo. */
  endDate: string;
  /** HH:mm del primer día; null si no tiene hora. */
  startTime: string | null;
  /** HH:mm del último día; solo con hora de inicio. */
  endTime: string | null;
  subjectId: string | null;
  categoryId: string | null;
  multiDay: boolean;
}

/** El PUT reemplaza todo: un campo opcional en null lo quita. */
export interface EventInput {
  title: string;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  subjectId: string | null;
  categoryId: string | null;
}

const JSON_HEADERS = () => ({ "Content-Type": "application/json", ...authHeaders() });

/** Eventos que ocupan al menos un día entre dos fechas (AAAA-MM-DD, ambas incluidas). */
export async function fetchEvents(from: string, to: string): Promise<CalendarEvent[]> {
  const response = await fetch(`${API_BASE_URL}/api/events?from=${from}&to=${to}`, { headers: authHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible cargar los eventos"));
  return response.json();
}

export async function createEvent(input: EventInput): Promise<CalendarEvent> {
  const response = await fetch(`${API_BASE_URL}/api/events`, { method: "POST", headers: JSON_HEADERS(), body: JSON.stringify(input) });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible crear el evento"));
  return response.json();
}

export async function updateEvent(id: string, input: EventInput): Promise<CalendarEvent> {
  const response = await fetch(`${API_BASE_URL}/api/events/${id}`, { method: "PUT", headers: JSON_HEADERS(), body: JSON.stringify(input) });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible editar el evento"));
  return response.json();
}

export async function deleteEvent(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/events/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible eliminar el evento"));
}

/** Días entre dos fechas AAAA-MM-DD (positivo si `b` es posterior a `a`), sin depender de la zona ni del horario de verano. */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/** El evento cubre ese día (AAAA-MM-DD). */
export function coversDay(event: CalendarEvent, day: string): boolean {
  return event.startDate <= day && day <= event.endDate;
}

/** «Día 2 de 5» para un evento de varios días en una fecha que cubre; null si dura uno solo. */
export function dayOfEvent(event: CalendarEvent, day: string): string | null {
  return event.multiDay ? `Día ${daysBetween(event.startDate, day) + 1} de ${daysBetween(event.startDate, event.endDate) + 1}` : null;
}
