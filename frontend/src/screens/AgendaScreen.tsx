import { useEffect, useMemo, useState } from "react";
import { fetchTasks, toUiTask, updateTaskStatus, type UiTask } from "../services/tasksApi";
import { fetchCategories, type Category } from "../services/categoriesApi";
import { fromTaskDue } from "../services/taskDue";
import { describeClassNow, fetchAgendaEvaluations, fetchClasses, fetchClassesNow, formatGrade, type AgendaEvaluation, type ClassNow, type ClassOccurrence } from "../services/academicApi";
import { CategoryBadge, EmptyState, PriorityDot, Station } from "../components/shared";

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

  const dayTasks = byDay.get(selected) ?? [];
  // Tareas y evaluaciones del día en un solo orden por hora.
  type DayItem = { kind: "task"; task: UiTask; time: string } | { kind: "evaluation"; evaluation: AgendaEvaluation; time: string } | { kind: "class"; occurrence: ClassOccurrence; time: string };
  const dayItems: DayItem[] = [
    ...dayTasks.map((task): DayItem => ({ kind: "task", task, time: fromTaskDue(task.rawDue).time })),
    ...(evaluationsByDay.get(selected) ?? []).map((evaluation): DayItem => ({ kind: "evaluation", evaluation, time: fromTaskDue(evaluation.due).time })),
    ...(classesByDay.get(selected) ?? []).map((occurrence): DayItem => ({ kind: "class", occurrence, time: occurrence.start })),
  ].sort((a, b) => a.time.localeCompare(b.time));
  const colorOf = (task: UiTask) => categories.find((category) => category.id === task.categoryId)?.color ?? "#FF6B4A";
  const nameOf = (task: UiTask) => categories.find((category) => category.id === task.categoryId)?.name ?? (task.categoryId ? "Categoría" : "Sin categoría");

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
          <div className="-mr-2 flex">
            <WeekButton label="Semana anterior" onClick={() => shiftWeek(-1)} path="M15 18l-6-6 6-6" />
            <WeekButton label="Semana siguiente" onClick={() => shiftWeek(1)} path="M9 18l6-6-6-6" />
          </div>
        </div>

        <div className="flex gap-1 px-3 pb-3 lg:max-w-[760px] lg:px-8" role="group" aria-label="Días de la semana">
          {week.map((date, i) => {
            const key = dayKey(date);
            const isSelected = key === selected;
            const isToday = key === todayKey;
            const pending = (byDay.get(key) ?? []).filter((task) => !task.done).length + (evaluationsByDay.get(key) ?? []).filter((evaluation) => evaluation.grade === null).length + (classesByDay.get(key) ?? []).length;
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
            <EmptyState title="Día libre" sub="No hay clases, entregas ni evaluaciones para esta fecha." />
          ) : (
            <ol>
              {dayItems.map((item, index) => {
                const last = index === dayItems.length - 1;
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
