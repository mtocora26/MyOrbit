import { useEffect, useMemo, useState } from "react";
import { fetchTasks, toUiTask, updateTaskStatus, type UiTask } from "../services/tasksApi";
import { categoryLabel, fetchCategories, type Category } from "../services/categoriesApi";
import { fromTaskDue } from "../services/taskDue";
import { describeClassNow, fetchAgendaEvaluations, fetchClasses, fetchClassesNow, formatGrade, type AgendaEvaluation, type ClassNow, type ClassOccurrence } from "../services/academicApi";
import { CategoryBadge, EmptyState, PriorityDot, Station } from "../components/shared";
import EventFormSheet from "../components/EventFormSheet";
import { coversDay, dayOfEvent, daysBetween, fetchEvents, type CalendarEvent } from "../services/eventsApi";
import { fetchSubjects, type Subject } from "../services/subjectsApi";

const DAYS = ["L", "M", "X", "J", "V", "S", "D"];

const dayKey = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

function mondayOf(date: Date): Date {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export default function AgendaScreen({ refreshTick = 0 }: { onFab?: () => void; refreshTick?: number }) {
  const [tasks, setTasks] = useState<UiTask[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [evaluations, setEvaluations] = useState<AgendaEvaluation[]>([]);
  const [classes, setClasses] = useState<ClassOccurrence[]>([]);
  const [classNow, setClassNow] = useState<ClassNow | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  // La hoja conserva su contenido mientras anima la salida: se cierra con `eventSheetOpen`, no vaciando `editingEvent`.
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventSheetOpen, setEventSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [selected, setSelected] = useState(() => dayKey(new Date()));

  useEffect(() => {
    let ignore = false;
    fetchTasks()
      .then((data) => { if (!ignore) { setTasks(data.map(toUiTask)); setError(null); } })
      .catch((err) => { if (!ignore) setError(err instanceof Error ? err.message : "No fue posible cargar tu agenda"); })
      .finally(() => { if (!ignore) setLoading(false); });
    fetchCategories().then((data) => { if (!ignore) setCategories(data); }).catch(() => undefined);
    // Las evaluaciones son informativas: si no cargan, la agenda sigue mostrando las tareas.
    fetchAgendaEvaluations().then((data) => { if (!ignore) setEvaluations(data); }).catch(() => undefined);
    return () => { ignore = true; };
  }, [refreshTick]);

  // Las clases de la semana que se ve. Son informativas: si no cargan, la agenda sigue mostrando lo demás.
  useEffect(() => {
    let ignore = false;
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    fetchClasses(dayKey(weekStart), dayKey(end)).then((data) => { if (!ignore) setClasses(data); }).catch(() => { if (!ignore) setClasses([]); });
    return () => { ignore = true; };
  }, [weekStart, refreshTick]);

  // Los eventos que tocan la semana que se ve (los de varios días aparecen en todas las semanas que cubren). Son informativos.
  useEffect(() => {
    let ignore = false;
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    fetchEvents(dayKey(weekStart), dayKey(end)).then((data) => { if (!ignore) setEvents(data); }).catch(() => { if (!ignore) setEvents([]); });
    return () => { ignore = true; };
  }, [weekStart, refreshTick]);

  useEffect(() => {
    let ignore = false;
    fetchSubjects().then((data) => { if (!ignore) setSubjects(data); }).catch(() => undefined);
    return () => { ignore = true; };
  }, [refreshTick]);

  // «Estás en clase» / próxima clase: según la hora local de la cuenta, se refresca cada minuto.
  useEffect(() => {
    let ignore = false;
    const load = () => fetchClassesNow().then((data) => { if (!ignore) setClassNow(data); }).catch(() => undefined);
    load();
    const timer = setInterval(load, 60_000);
    return () => { ignore = true; clearInterval(timer); };
  }, [refreshTick]);

  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d; }), [weekStart]);
  const todayKey = dayKey(new Date());

  // Tareas agrupadas por día de entrega (las "Sin fecha" no aparecen en la agenda).
  const byDay = useMemo(() => {
    const map = new Map<string, UiTask[]>();
    tasks.forEach((task) => {
      const { date } = fromTaskDue(task.rawDue);
      if (date) map.set(date, [...(map.get(date) ?? []), task]);
    });
    map.forEach((list) => list.sort((a, b) => fromTaskDue(a.rawDue).time.localeCompare(fromTaskDue(b.rawDue).time)));
    return map;
  }, [tasks]);

  const evaluationsByDay = useMemo(() => {
    const map = new Map<string, AgendaEvaluation[]>();
    evaluations.forEach((evaluation) => {
      const { date } = fromTaskDue(evaluation.due);
      if (date) map.set(date, [...(map.get(date) ?? []), evaluation]);
    });
    return map;
  }, [evaluations]);

  const classesByDay = useMemo(() => {
    const map = new Map<string, ClassOccurrence[]>();
    classes.forEach((occurrence) => map.set(occurrence.date, [...(map.get(occurrence.date) ?? []), occurrence]));
    return map;
  }, [classes]);

  const eventColor = (event: CalendarEvent) =>
    subjects.find((subject) => subject.id === event.subjectId)?.color ?? categories.find((category) => category.id === event.categoryId)?.color ?? "#FF6B4A";

  // Franjas de la semana: cada evento cubre desde su primer hasta su último día visible; se apilan en filas sin cruzarse.
  const weekKey = dayKey(weekStart);
  const bands = useMemo(() => {
    const placed: { event: CalendarEvent; from: number; to: number; lane: number }[] = [];
    [...events].sort((a, b) => a.startDate.localeCompare(b.startDate) || b.endDate.localeCompare(a.endDate)).forEach((event) => {
      const from = Math.max(0, daysBetween(weekKey, event.startDate));
      const to = Math.min(6, daysBetween(weekKey, event.endDate));
      let lane = 0;
      while (placed.some((band) => band.lane === lane && band.from <= to && from <= band.to)) lane += 1;
      placed.push({ event, from, to, lane });
    });
    return placed;
  }, [events, weekKey]);
  const MAX_LANES = 3;
  const hiddenBands = bands.filter((band) => band.lane >= MAX_LANES).length;

  function openEventSheet(event: CalendarEvent | null) {
    setEditingEvent(event);
    setEventSheetOpen(true);
  }

  const dayTasks = byDay.get(selected) ?? [];
  // Tareas y evaluaciones del día en un solo orden por hora.
  type DayItem = { kind: "task"; task: UiTask; time: string } | { kind: "evaluation"; evaluation: AgendaEvaluation; time: string } | { kind: "class"; occurrence: ClassOccurrence; time: string } | { kind: "event"; event: CalendarEvent; time: string };
  const dayItems: DayItem[] = [
    ...dayTasks.map((task): DayItem => ({ kind: "task", task, time: fromTaskDue(task.rawDue).time })),
    ...(evaluationsByDay.get(selected) ?? []).map((evaluation): DayItem => ({ kind: "evaluation", evaluation, time: fromTaskDue(evaluation.due).time })),
    ...(classesByDay.get(selected) ?? []).map((occurrence): DayItem => ({ kind: "class", occurrence, time: occurrence.start })),
    // Un evento con hora la muestra solo el primer día; el resto de sus días (y los sin hora) cuentan como «todo el día» y van primero.
    ...events.filter((event) => coversDay(event, selected)).map((event): DayItem => ({ kind: "event", event, time: event.startDate === selected ? event.startTime ?? "" : "" })),
  ].sort((a, b) => a.time.localeCompare(b.time));
  const colorOf = (task: UiTask) => categories.find((category) => category.id === task.categoryId)?.color ?? "#FF6B4A";
  const nameOf = (task: UiTask) => {
    const category = categories.find((item) => item.id === task.categoryId);
    return category ? categoryLabel(category, categories) : task.categoryId ? "Categoría" : "Sin categoría";
  };

  function shiftWeek(delta: number) {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + delta * 7);
    setWeekStart(next);
    // Si la semana incluye hoy se vuelve a hoy; si no, al lunes.
    setSelected(dayKey(mondayOf(new Date())) === dayKey(next) ? todayKey : dayKey(next));
  }

  async function toggle(task: UiTask) {
    const previous = tasks;
    setTasks(tasks.map((item) => item.id === task.id ? { ...item, done: !item.done } : item));
    try {
      await updateTaskStatus(task.id, !task.done);
    } catch (err) {
      setTasks(previous);
      setError(err instanceof Error ? err.message : "No fue posible actualizar la tarea");
    }
  }

  const tomorrowKey = (() => { const next = new Date(); next.setDate(next.getDate() + 1); return dayKey(next); })();
  const classBanner = classNow ? describeClassNow(classNow, todayKey, tomorrowKey) : null;

  const monthLabel = capitalize(week[3].toLocaleDateString("es-CO", { month: "long", year: "numeric" }));
  const selectedDate = new Date(`${selected}T00:00`);
  const dayLabel = capitalize(selectedDate.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" }));

  return (
    <div className="flex h-full flex-col bg-paper">
      <div className="flex-shrink-0 border-b border-line">
        <div className="flex items-center justify-between px-4 pt-3 pb-1 lg:px-8 lg:pt-8">
          <h1 className="font-display text-[30px] font-semibold leading-none tracking-tight text-ink lg:text-[44px]">{monthLabel}</h1>
          <div className="-mr-2 flex items-center">
            <button onClick={() => openEventSheet(null)} className="mr-1 min-h-[44px] px-2 text-[14px] font-semibold text-coral-ink">+ Evento</button>
            <WeekButton label="Semana anterior" onClick={() => shiftWeek(-1)} path="M15 18l-6-6 6-6" />
            <WeekButton label="Semana siguiente" onClick={() => shiftWeek(1)} path="M9 18l6-6-6-6" />
          </div>
        </div>

        <div className="flex gap-1 px-3 pb-3 lg:max-w-[760px] lg:px-8" role="group" aria-label="Días de la semana">
          {week.map((date, i) => {
            const key = dayKey(date);
            const isSelected = key === selected;
            const isToday = key === todayKey;
            const pending = (byDay.get(key) ?? []).filter((task) => !task.done).length + (evaluationsByDay.get(key) ?? []).filter((evaluation) => evaluation.grade === null).length + (classesByDay.get(key) ?? []).length + events.filter((event) => coversDay(event, key)).length;
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                aria-pressed={isSelected}
                aria-label={date.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
                className={`flex min-h-[56px] flex-1 flex-col items-center justify-center rounded-md ${isSelected ? "bg-strong text-on-strong" : isToday ? "bg-coral-wash text-coral-ink" : "text-ink"}`}
              >
                <span className={`text-[13px] font-semibold ${isSelected ? "opacity-70" : "text-ink-3"}`}>{DAYS[i]}</span>
                <span className="num text-[18px] font-semibold leading-none">{date.getDate()}</span>
                <span className="mt-1 h-1 w-1 rounded-full" style={{ background: pending ? (isSelected ? "currentColor" : "var(--color-coral)") : "transparent" }} aria-hidden="true" />
              </button>
            );
          })}
        </div>

        {bands.length > 0 && (
          <div className="px-3 pb-3 lg:max-w-[760px] lg:px-8" role="group" aria-label="Eventos de la semana">
            <div className="grid gap-y-1" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))", columnGap: 4 }}>
              {bands.filter((band) => band.lane < MAX_LANES).map(({ event, from, to, lane }) => {
                const color = eventColor(event);
                return (
                  <button
                    key={event.id}
                    onClick={() => openEventSheet(event)}
                    aria-label={`Editar evento ${event.title}`}
                    className="min-h-[28px] truncate rounded-[4px] px-2 text-left text-[13px] font-semibold leading-tight text-ink"
                    style={{ gridColumn: `${from + 1} / ${to + 2}`, gridRow: lane + 1, background: `color-mix(in srgb, ${color} 22%, transparent)`, borderLeft: `3px solid ${color}` }}
                  >
                    {event.title}
                  </button>
                );
              })}
            </div>
            {hiddenBands > 0 && <p className="num mt-1 text-[13px] text-ink-3">+{hiddenBands} {hiddenBands === 1 ? "evento más" : "eventos más"} esta semana</p>}
          </div>
        )}
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pt-3 pb-24 lg:px-8">
        <div className="lg:max-w-[760px]">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-display text-[20px] font-semibold leading-none text-ink">{dayLabel}</h2>
            {dayTasks.length > 0 && <span className="num text-[14px] text-ink-2">{dayTasks.filter((t) => t.done).length}/{dayTasks.length}</span>}
          </div>

          {classBanner && (
            <p className="mb-3 inline-flex items-center gap-2 rounded-[4px] px-2 py-1.5 text-[14px] font-semibold" style={{ background: "var(--color-blue-wash)", color: "var(--color-blue-ink)" }}>
              <span aria-hidden="true" className="num">{classNow?.current ? "●" : "→"}</span>
              <span>{classBanner}{classNow?.current ? ` · ${classNow.current.subjectName}${classNow.current.room ? ` · ${classNow.current.room}` : ""}` : classNow?.next ? ` · ${classNow.next.subjectName}${classNow.next.room ? ` · ${classNow.next.room}` : ""}` : ""}</span>
            </p>
          )}

          {error && <p role="alert" className="mb-3 rounded-md border border-danger-line bg-danger-wash px-3 py-2 text-[14px] font-medium text-danger">{error}</p>}

          {loading ? (
            <div className="flex flex-col gap-2" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-[60px] animate-pulse rounded-md bg-wash" />)}</div>
          ) : dayItems.length === 0 ? (
            <EmptyState title="Día libre" sub="No hay clases, eventos, entregas ni evaluaciones para esta fecha." />
          ) : (
            <ol>
              {dayItems.map((item, index) => {
                const last = index === dayItems.length - 1;
                if (item.kind === "event") {
                  const { event } = item;
                  const color = eventColor(event);
                  const progress = dayOfEvent(event, selected);
                  return (
                    <li key={`event-${event.id}`} className="orbit-rise flex gap-3" style={{ ["--i" as string]: index }}>
                      <span className="num w-11 flex-shrink-0 pt-3 text-right text-[16px] font-semibold leading-none text-ink">{item.time || "Día"}</span>
                      <div className="relative flex w-7 flex-shrink-0 justify-center">
                        {!last && <span className="absolute left-1/2 top-[30px] bottom-0 w-0 -translate-x-1/2" style={{ borderLeft: `3px solid ${color}` }} />}
                        {/* Evento: cápsula (tarea = círculo, evaluación = cuadrado, clase = rombo) */}
                        <span className="mt-2.5 h-[14px] w-[22px] rounded-full border-[3px]" style={{ borderColor: color, background: `color-mix(in srgb, ${color} 35%, transparent)` }} aria-hidden="true" />
                      </div>
                      <button onClick={() => openEventSheet(event)} aria-label={`Editar evento ${event.title}`} className="mb-1 flex min-w-0 flex-1 items-start justify-between gap-2 rounded-md py-2 text-left active:bg-wash">
                        <div className="min-w-0">
                          <p className="text-[16px] font-semibold leading-snug text-ink">{event.title}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <CategoryBadge name="Evento" color={color} />
                            <span className="num text-[13px] text-ink-2">
                              {[progress, event.startTime && event.startDate === selected ? `${event.startTime}${event.endTime && !event.multiDay ? `–${event.endTime}` : ""}` : null, event.endTime && event.endDate === selected && event.multiDay ? `hasta ${event.endTime}` : null].filter(Boolean).join(" · ") || "Todo el día"}
                            </span>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                }
                if (item.kind === "class") {
                  const { occurrence } = item;
                  const inProgress = classNow?.current?.subjectId === occurrence.subjectId && classNow.current.startsAt === occurrence.startsAt;
                  return (
                    <li key={`class-${occurrence.subjectId}-${occurrence.startsAt}`} className="orbit-rise flex gap-3" style={{ ["--i" as string]: index }}>
                      <span className="num w-11 flex-shrink-0 pt-3 text-right text-[16px] font-semibold leading-none text-ink">{item.time}</span>
                      <div className="relative flex w-7 flex-shrink-0 justify-center">
                        {!last && <span className="absolute left-1/2 top-[30px] bottom-0 w-0 -translate-x-1/2" style={{ borderLeft: `3px solid ${occurrence.subjectColor}` }} />}
                        {/* Clase: rombo (las tareas son círculos y las evaluaciones cuadrados); lleno = en curso */}
                        <span className="mt-3 h-[16px] w-[16px] rotate-45 rounded-[3px] border-[3px]" style={{ borderColor: occurrence.subjectColor, background: inProgress ? occurrence.subjectColor : "var(--color-card)" }} aria-hidden="true" />
                      </div>
                      <div className="mb-1 flex min-w-0 flex-1 items-start justify-between gap-2 py-2">
                        <div className="min-w-0">
                          <p className="text-[16px] font-semibold leading-snug text-ink">{occurrence.subjectName}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1"><CategoryBadge name="Clase" color={occurrence.subjectColor} /><span className="num text-[13px] text-ink-2">{occurrence.start}–{occurrence.end}{occurrence.room ? ` · ${occurrence.room}` : ""}</span></div>
                        </div>
                        {inProgress && <span className="rounded-[3px] bg-blue-wash px-1.5 py-[3px] text-[12px] font-semibold leading-none text-blue-ink">En curso</span>}
                      </div>
                    </li>
                  );
                }
                if (item.kind === "evaluation") {
                  const { evaluation } = item;
                  const graded = evaluation.grade !== null;
                  return (
                    <li key={`eval-${evaluation.id}`} className="orbit-rise flex gap-3" style={{ ["--i" as string]: index }}>
                      <span className="num w-11 flex-shrink-0 pt-3 text-right text-[16px] font-semibold leading-none text-ink">{item.time}</span>
                      <div className="relative flex w-7 flex-shrink-0 justify-center">
                        {!last && <span className="absolute left-1/2 top-[30px] bottom-0 w-0 -translate-x-1/2" style={{ borderLeft: `3px solid ${evaluation.subjectColor}` }} />}
                        {/* Evaluación: marca cuadrada (las tareas son círculos); llena = ya tiene nota */}
                        <span className="mt-2.5 h-[20px] w-[20px] rounded-[4px] border-[3px]" style={{ borderColor: evaluation.subjectColor, background: graded ? evaluation.subjectColor : "var(--color-card)" }} aria-hidden="true" />
                      </div>
                      <div className="mb-1 flex min-w-0 flex-1 items-start justify-between gap-2 py-2">
                        <div className="min-w-0">
                          <p className="text-[16px] font-semibold leading-snug text-ink">{evaluation.name}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1"><CategoryBadge name={evaluation.subjectName} color={evaluation.subjectColor} /><span className="num text-[13px] text-ink-2">Evaluación · {formatGrade(evaluation.percentage)}%</span></div>
                        </div>
                        {graded && <span className="num text-[22px] font-semibold leading-none text-ink">{formatGrade(evaluation.grade as number)}</span>}
                      </div>
                    </li>
                  );
                }
                const { task } = item;
                const color = colorOf(task);
                const { time } = fromTaskDue(task.rawDue);
                return (
                  <li key={task.id} className={`orbit-rise flex gap-3 ${task.done ? "opacity-50" : ""}`} style={{ ["--i" as string]: index }}>
                    <span className="num w-11 flex-shrink-0 pt-3 text-right text-[16px] font-semibold leading-none text-ink">{time}</span>
                    <div className="relative flex w-7 flex-shrink-0 justify-center">
                      {!last && <span className="absolute left-1/2 top-[30px] bottom-0 w-0 -translate-x-1/2" style={{ borderLeft: `3px solid ${color}` }} />}
                      <Station color={color} done={task.done} onToggle={() => toggle(task)} label={`Marcar “${task.label}” como hecha`} />
                    </div>
                    <div className="mb-1 flex min-w-0 flex-1 items-start justify-between gap-2 py-2">
                      <div className="min-w-0">
                        <p className={`text-[16px] font-semibold leading-snug ${task.done ? "text-ink-3 line-through" : "text-ink"}`}>{task.label}</p>
                        <div className="mt-1"><CategoryBadge name={nameOf(task)} color={color} /></div>
                      </div>
                      <PriorityDot level={task.priority} />
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
      <EventFormSheet
        open={eventSheetOpen}
        onClose={() => setEventSheetOpen(false)}
        event={editingEvent}
        defaultDate={selected}
        subjects={subjects}
        categories={categories}
        onSaved={(saved) => setEvents((current) => (current.some((item) => item.id === saved.id) ? current.map((item) => (item.id === saved.id ? saved : item)) : [...current, saved]))}
        onDeleted={(id) => setEvents((current) => current.filter((item) => item.id !== id))}
      />
    </div>
  );
}

function WeekButton({ label, onClick, path }: { label: string; onClick: () => void; path: string }) {
  return (
    <button onClick={onClick} aria-label={label} className="flex h-11 w-11 items-center justify-center rounded-md text-ink-2 active:bg-wash">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={path} /></svg>
    </button>
  );
}
