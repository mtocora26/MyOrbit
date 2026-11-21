import { LocalNotifications, type LocalNotificationSchema } from "@capacitor/local-notifications";
import { isNativeApp } from "../hooks/useNativeApp";
import { fetchAgendaEvaluations, fetchClasses } from "./academicApi";
import { fetchEvents } from "./eventsApi";
import { fetchNotificationPreferences } from "./notificationsApi";
import { fetchReminders } from "./remindersApi";
import { fetchTasks } from "./tasksApi";
import { addDaysInputValue, todayInputValue } from "./taskDue";

/**
 * Avisos que el propio teléfono programa (clases, eventos con hora, recordatorios y fechas límite): Android los
 * dispara sin internet y sin que la app esté abierta. Solo existen en la app de Android; en la web no hacen nada.
 * Se recalculan cada vez que cambian los datos: se cancela lo programado y se vuelve a programar lo que viene.
 */

/** Cuántos días hacia adelante se programan. */
const HORIZON_DAYS = 7;
/** Android limita las alarmas pendientes por app (unas 500 en algunos fabricantes): se programan las más próximas. */
const MAX_SCHEDULED = 60;
const CLASS_LEAD_MS = 30 * 60_000;
const DEADLINE_LEADS = [
  { ms: 24 * 60 * 60_000, label: "mañana" },
  { ms: 60 * 60_000, label: "en una hora" },
];
/** Parciales y presentaciones: un día antes, una hora antes y a la hora exacta. */
const EXAM_LEADS = [
  { ms: 24 * 60 * 60_000, label: "mañana" },
  { ms: 60 * 60_000, label: "en una hora" },
  { ms: 0, label: "ahora" },
];
/** Canal creado en MainActivity.java con sonido, vibración y prioridad alta. */
const CHANNEL_ID = "avisos";
const STORAGE_KEY = "myorbit.localReminders";

interface PlannedReminder {
  key: string;
  at: Date;
  title: string;
  body: string;
}

/** Hora local de `AAAA-MM-DDTHH:mm[:ss]` o de una fecha `AAAA-MM-DD` con hora `HH:mm`. */
function localDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Id numérico estable a partir de una clave: el mismo aviso siempre cae en el mismo id. */
function notificationId(key: string): number {
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) hash = (Math.imul(hash, 31) + key.charCodeAt(index)) | 0;
  return Math.abs(hash) % 2_000_000_000 + 1;
}

/** El usuario puede apagarlos desde el Perfil. Por defecto están encendidos (si el permiso está concedido). */
export function localRemindersEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setLocalRemindersEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Sin almacenamiento el ajuste no se recuerda; la app sigue funcionando.
  }
}

export type LocalReminderPermission = "granted" | "denied" | "prompt" | "unavailable";

export async function localReminderPermission(): Promise<LocalReminderPermission> {
  if (!isNativeApp) return "unavailable";
  try {
    const { display } = await LocalNotifications.checkPermissions();
    return display === "granted" ? "granted" : display === "denied" ? "denied" : "prompt";
  } catch {
    return "unavailable";
  }
}

/** Pide el permiso del sistema. Llámalo cuando el usuario hace algo que lo justifica, nunca al abrir la app. */
export async function requestLocalReminderPermission(): Promise<LocalReminderPermission> {
  if (!isNativeApp) return "unavailable";
  try {
    const { display } = await LocalNotifications.requestPermissions();
    return display === "granted" ? "granted" : "denied";
  } catch {
    return "unavailable";
  }
}

/**
 * Android 12+ solo dispara a la hora exacta si el usuario permite «Alarmas y recordatorios»; sin eso el sistema
 * puede retrasar el aviso varios minutos. En versiones anteriores siempre es true.
 */
export async function exactAlarmsAllowed(): Promise<boolean> {
  if (!isNativeApp) return false;
  try {
    return (await LocalNotifications.checkExactNotificationSetting()).exact_alarm === "granted";
  } catch {
    return false;
  }
}

/** Abre el ajuste del sistema para permitir alarmas exactas. Llámalo desde un toque del usuario. */
export async function requestExactAlarms(): Promise<boolean> {
  if (!isNativeApp) return false;
  try {
    return (await LocalNotifications.changeExactNotificationSetting()).exact_alarm === "granted";
  } catch {
    return false;
  }
}

async function planReminders(): Promise<PlannedReminder[] | null> {
  const from = todayInputValue();
  const to = addDaysInputValue(HORIZON_DAYS);
  const [preferences, classes, events, reminders, tasks, evaluations] = await Promise.all([
    fetchNotificationPreferences(),
    fetchClasses(from, to),
    fetchEvents(from, to),
    fetchReminders(),
    fetchTasks({ done: false }),
    fetchAgendaEvaluations(),
  ]);

  const planned: PlannedReminder[] = [];
  if (preferences.classReminder) {
    for (const occurrence of classes) {
      const start = localDate(occurrence.startsAt);
      if (!start) continue;
      planned.push({
        key: `class:${occurrence.subjectId}:${occurrence.startsAt}`,
        at: new Date(start.getTime() - CLASS_LEAD_MS),
        title: "En tu agenda",
        body: `Tienes clase de ${occurrence.subjectName} a las ${occurrence.start}${occurrence.room ? ` · ${occurrence.room}` : ""}`,
      });
    }
    for (const event of events) {
      if (!event.startTime) continue;
      const start = localDate(`${event.startDate}T${event.startTime}`);
      if (!start) continue;
      planned.push({
        key: `event:${event.id}:${event.startDate}`,
        at: start,
        title: "En tu agenda",
        body: `Tienes el evento "${event.title}" a las ${event.startTime}`,
      });
    }
  }
  if (preferences.reminder) {
    for (const reminder of reminders) {
      const at = localDate(reminder.remindAt);
      if (at) planned.push({ key: `reminder:${reminder.id}`, at, title: "Recordatorio", body: reminder.text });
    }
  }
  if (preferences.deadline) {
    for (const task of tasks) {
      const due = task.due ? localDate(task.due) : null;
      if (!due) continue;
      for (const lead of DEADLINE_LEADS) {
        planned.push({
          key: `task:${task.id}:${lead.ms}`,
          at: new Date(due.getTime() - lead.ms),
          title: "Fecha límite",
          body: `La tarea "${task.title}" vence ${lead.label}`,
        });
      }
    }
  }

  if (preferences.exam) {
    for (const evaluation of evaluations) {
      const due = localDate(evaluation.due);
      if (!due) continue;
      const hasTime = evaluation.due.includes("T") && !evaluation.due.includes("T00:00");
      const label = `${evaluation.name} (${evaluation.subjectName})`;
      for (const lead of EXAM_LEADS) {
        // Sin hora definida solo tiene sentido avisar con un día de antelación.
        if (!hasTime && lead.ms < 24 * 60 * 60_000) continue;
        planned.push({
          key: `exam:${evaluation.id}:${lead.ms}`,
          at: new Date(due.getTime() - lead.ms),
          title: lead.ms === 0 ? "Es ahora" : "Parcial próximo",
          body: lead.ms === 0 ? `Empieza ${label}` : `${label} es ${lead.label}`,
        });
      }
    }
  }

  const now = Date.now();
  return planned
    .filter((item) => item.at.getTime() > now)
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, MAX_SCHEDULED);
}

async function cancelPending(): Promise<void> {
  const { notifications } = await LocalNotifications.getPending();
  if (notifications.length) await LocalNotifications.cancel({ notifications: notifications.map(({ id }) => ({ id })) });
}

let syncing: Promise<void> | null = null;
let again = false;

/**
 * Deja programado en el teléfono lo que viene en los próximos días. Si el servidor no responde se conserva lo ya
 * programado (mejor un aviso viejo que ninguno). Llamadas seguidas se agrupan en una sola vuelta extra.
 */
export function syncLocalReminders(): Promise<void> {
  if (!isNativeApp) return Promise.resolve();
  if (syncing) {
    again = true;
    return syncing;
  }
  syncing = (async () => {
    try {
      do {
        again = false;
        await runSync();
      } while (again);
    } finally {
      syncing = null;
    }
  })();
  return syncing;
}

async function runSync(): Promise<void> {
  try {
    if (!localRemindersEnabled() || (await localReminderPermission()) !== "granted") {
      await cancelPending();
      return;
    }
    const planned = await planReminders();
    if (!planned) return;
    await cancelPending();
    if (!planned.length) return;
    const notifications: LocalNotificationSchema[] = planned.map((item) => ({
      id: notificationId(item.key),
      title: item.title,
      body: item.body,
      channelId: CHANNEL_ID,
      schedule: { at: item.at, allowWhileIdle: true },
    }));
    await LocalNotifications.schedule({ notifications });
  } catch {
    // Sin conexión o sin permiso: se conserva lo programado y se reintenta en la próxima sincronización.
  }
}

/** Al cerrar sesión no deben quedar avisos de la cuenta anterior. */
export async function clearLocalReminders(): Promise<void> {
  if (!isNativeApp) return;
  try {
    await cancelPending();
  } catch {
    // Nada que limpiar.
  }
}
