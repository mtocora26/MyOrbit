import { readErrorMessage } from "./apiError";
import { authHeaders } from "./authApi";
import { API_BASE_URL } from "./apiConfig";

export type NotificationType = "DEADLINE" | "EVENT" | "HABIT";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  /** Id de la tarea u hábito de origen. */
  referenceId: string;
  createdAt: string;
  read: boolean;
}

export async function fetchNotifications(unreadOnly = false): Promise<AppNotification[]> {
  const response = await fetch(`${API_BASE_URL}/api/notifications${unreadOnly ? "?unread=true" : ""}`, { headers: authHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible cargar las notificaciones"));
  return response.json();
}

export async function fetchUnreadCount(): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, { headers: authHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible cargar las notificaciones"));
  return (await response.json()).count;
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  const response = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, { method: "PATCH", headers: authHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible marcar la notificación"));
  return response.json();
}

export async function markAllNotificationsRead(): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, { method: "PATCH", headers: authHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible marcar las notificaciones"));
  return (await response.json()).updated;
}

export interface NotificationPreferences {
  /** Fechas límite: al crear una tarea con fecha y el recordatorio de 24 h. */
  deadline: boolean;
  /** Tareas completadas. */
  event: boolean;
  /** Hábitos pendientes del día. */
  habit: boolean;
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  const response = await fetch(`${API_BASE_URL}/api/notifications/preferences`, { headers: authHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible cargar tus preferencias"));
  return response.json();
}

export async function updateNotificationPreferences(preferences: NotificationPreferences): Promise<NotificationPreferences> {
  const response = await fetch(`${API_BASE_URL}/api/notifications/preferences`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(preferences),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible guardar tus preferencias"));
  return response.json();
}
