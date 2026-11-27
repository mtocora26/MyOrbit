import { registerPlugin } from "@capacitor/core";
import { isNativeApp } from "../hooks/useNativeApp";
import { fetchAgendaEvaluations, fetchClasses } from "./academicApi";
import { fetchCategories } from "./categoriesApi";
import { coversDay, dayOfEvent, fetchEvents } from "./eventsApi";
import { fetchSubjects } from "./subjectsApi";
import { fetchTasks } from "./tasksApi";
import { addDaysInputValue, fromTaskDue, todayInputValue } from "./taskDue";

/**
 * Widget «Agenda de hoy» de la pantalla de inicio (solo en la app de Android). La web arma la agenda de los próximos
 * días y se la entrega al teléfono, que la guarda y la pinta sin abrir la app (`AgendaWidgetProvider.java`).
 */

/** Hoy y los seis días siguientes: lo que el widget puede mostrar sin que se vuelva a abrir la app. */
const DAYS_AHEAD = 6;
/** Un evento de un solo día con hora de inicio y sin hora de fin se da por terminado una hora después. */
const EVENT_DEFAULT_MS = 60 * 60_000;
/** Una evaluación con hora sigue a la vista mientras se presenta. */
const EVALUATION_VISIBLE_MS = 2 * 60 * 60_000;

export type WidgetItemKind = "class" | "event" | "evaluation" | "task";

export interface WidgetItem {
  /** AAAA-MM-DD en que se muestra. */
  date: string;
  /** HH:mm; vacío si ocupa todo el día. */
  time: string;
  kind: WidgetItemKind;
  title: string;
  detail: string;
  /** Color hexadecimal de la materia o categoría; vacío usa el coral de la app. */
  color: string;
  /** Momento (ms) a partir del cual deja de mostrarse. */
  expiresAt: number;
}

interface AgendaWidgetPlugin {
  save(options: { data: string }): Promise<void>;
  clear(): Promise<void>;
  status(): Promise<AgendaWidgetStatus>;
  pin(): Promise<{ requested: boolean }>;
}

export interface AgendaWidgetStatus {
  /** El lanzador permite agregar el widget desde la app. */
  canPin: boolean;
  /** Ya hay al menos un widget en la pantalla de inicio. */
  added: boolean;
}

const AgendaWidget = registerPlugin<AgendaWidgetPlugin>("AgendaWidget");

const endOfDay = (day: string) => new Date(`${day}T23:59:59`).getTime();
const at = (day: string, time: string) => new Date(`${day}T${time}`).getTime();
const hexColor = (color: string | undefined) => (color?.startsWith("#") ? color : "");

async function buildItems(from: string, to: string): Promise<WidgetItem[]> {
  const [classes, events, tasks, evaluations, subjects, categories] = await Promise.all([
    fetchClasses(from, to),
    fetchEvents(from, to),
    fetchTasks({ done: false }),
    fetchAgendaEvaluations(),
    // Materias y categorías solo aportan el color y el nombre: sin ellas el widget se pinta igual.
    fetchSubjects().catch(() => []),
    fetchCategories().catch(() => []),
  ]);
  const subjectOf = (id: string | null | undefined) => subjects.find((subject) => subject.id === id);
  const categoryOf = (id: string | null | undefined) => categories.find((category) => category.id === id);
  const days = Array.from({ length: DAYS_AHEAD + 1 }, (_, index) => addDaysInputValue(index));
  const items: WidgetItem[] = [];

  for (const occurrence of classes) {
    items.push({
      date: occurrence.date,
      time: occurrence.start,
      kind: "class",
      title: occurrence.subjectName,
      detail: occurrence.room ?? "Clase",
      color: hexColor(occurrence.subjectColor),
      expiresAt: at(occurrence.date, occurrence.end),
    });
  }

  for (const event of events) {
    const color = hexColor(subjectOf(event.subjectId)?.color ?? categoryOf(event.categoryId)?.color);
    for (const day of days) {
      if (!coversDay(event, day)) continue;
      // La hora de inicio solo vale el primer día y la de fin solo el último; el resto es «todo el día».
      const time = day === event.startDate ? event.startTime ?? "" : "";
      let expiresAt = endOfDay(day);
      if (day === event.endDate && event.endTime) expiresAt = at(day, event.endTime);
      else if (!event.multiDay && time) expiresAt = at(day, time) + EVENT_DEFAULT_MS;
      items.push({ date: day, time, kind: "event", title: event.title, detail: dayOfEvent(event, day) ?? "Evento", color, expiresAt });
    }
  }

  for (const evaluation of evaluations) {
    if (evaluation.grade !== null) continue;
    const { date, time } = fromTaskDue(evaluation.due);
    if (!date) continue;
    const timed = time !== "" && time !== "00:00";
    items.push({
      date,
      time: timed ? time : "",
      kind: "evaluation",
      title: evaluation.name,
      detail: evaluation.subjectName,
      color: hexColor(evaluation.subjectColor),
      expiresAt: timed ? at(date, time) + EVALUATION_VISIBLE_MS : endOfDay(date),
    });
  }

  for (const task of tasks) {
    const { date, time } = fromTaskDue(task.due ?? "");
    if (!date) continue;
    const subject = subjectOf(task.subjectId);
    // Una tarea pendiente sigue a la vista hasta que termina el día, aunque ya haya pasado su hora.
    items.push({
      date,
      time,
      kind: "task",
      title: task.title,
      detail: subject?.name ?? categoryOf(task.categoryId)?.name ?? "Tarea",
      color: hexColor(subject?.color ?? categoryOf(task.categoryId)?.color),
      expiresAt: endOfDay(date),
    });
  }

  return items
    .filter((item) => item.date >= from && item.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}

let syncing: Promise<void> | null = null;
let again = false;
/** Cambia al cerrar sesión: una sincronización que venía en camino ya no debe guardar datos de esa cuenta. */
let generation = 0;

async function runSync(): Promise<void> {
  const startedIn = generation;
  const from = todayInputValue();
  const to = addDaysInputValue(DAYS_AHEAD);
  try {
    const items = await buildItems(from, to);
    if (startedIn !== generation) return;
    await AgendaWidget.save({ data: JSON.stringify({ from, to, items }) });
  } catch {
    // Sin conexión o sin el plugin: el widget conserva lo último que se guardó.
  }
}

/** Actualiza el widget con lo que viene. Las llamadas seguidas se agrupan en una sola vuelta extra. */
export function syncAgendaWidget(): Promise<void> {
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

/** Sin sesión el widget no debe mostrar nada de la cuenta anterior. */
export async function clearAgendaWidget(): Promise<void> {
  if (!isNativeApp) return;
  generation += 1;
  again = false;
  try {
    await AgendaWidget.clear();
  } catch {
    // Nada que limpiar.
  }
}

export async function agendaWidgetStatus(): Promise<AgendaWidgetStatus> {
  if (!isNativeApp) return { canPin: false, added: false };
  try {
    return await AgendaWidget.status();
  } catch {
    return { canPin: false, added: false };
  }
}

/** Pide al lanzador agregar el widget; el teléfono muestra su propia confirmación. */
export async function pinAgendaWidget(): Promise<boolean> {
  if (!isNativeApp) return false;
  try {
    return (await AgendaWidget.pin()).requested;
  } catch {
    return false;
  }
}
