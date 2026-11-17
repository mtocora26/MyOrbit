import { readErrorMessage } from "./apiError";
import { authHeaders } from "./authApi";
import { API_BASE_URL } from "./apiConfig";

/** Recordatorio personal pendiente: llega a Notificaciones a su hora. */
export interface PersonalReminder {
  id: string;
  text: string;
  /** Fecha y hora local del usuario, sin zona (`2026-11-20T08:30:00`). */
  remindAt: string;
}

export const REMINDER_MAX_LENGTH = 140;

export async function fetchReminders(): Promise<PersonalReminder[]> {
  const response = await fetch(`${API_BASE_URL}/api/reminders`, { headers: authHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible cargar tus recordatorios"));
  return response.json();
}

/** @param date `YYYY-MM-DD` y @param time `HH:mm`, tal como salen de los selectores nativos. */
export async function createReminder(text: string, date: string, time: string): Promise<PersonalReminder> {
  const response = await fetch(`${API_BASE_URL}/api/reminders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ text, remindAt: `${date}T${time}:00` }),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible crear el recordatorio"));
  return response.json();
}

export async function deleteReminder(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/reminders/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible quitar el recordatorio"));
}
