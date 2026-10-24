import { useEffect, useMemo, useState } from "react";
import { fetchTasks, toUiTask, updateTaskStatus, type UiTask } from "../services/tasksApi";
import { fetchCategories, type Category } from "../services/categoriesApi";
import { fromTaskDue } from "../services/taskDue";
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
    return () => { ignore = true; };
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

  const dayTasks = byDay.get(selected) ?? [];
  const colorOf = (task: UiTask) => categories.find((category) => category.name === task.tag)?.color ?? "#FF6B4A";

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
            const pending = (byDay.get(key) ?? []).filter((task) => !task.done).length;
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

          {error && <p role="alert" className="mb-3 rounded-md border border-danger-line bg-danger-wash px-3 py-2 text-[14px] font-medium text-danger">{error}</p>}

          {loading ? (
            <div className="flex flex-col gap-2" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-[60px] animate-pulse rounded-md bg-wash" />)}</div>
          ) : dayTasks.length === 0 ? (
            <EmptyState title="Día libre" sub="No hay entregas para esta fecha." />
          ) : (
            <ol>
              {dayTasks.map((task, index) => {
                const color = colorOf(task);
                const last = index === dayTasks.length - 1;
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
                        <div className="mt-1"><CategoryBadge name={task.tag} color={color} /></div>
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
