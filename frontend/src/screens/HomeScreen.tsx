import { useEffect, useMemo, useState } from "react";
import ThemeToggle from "../components/ThemeToggle";
import { Badge, CategoryBadge, PriorityDot, ProgressBar, SectionTitle, Station } from "../components/shared";
import { fetchTasks, toUiTask, updateTaskStatus, type UiTask } from "../services/tasksApi";
import { fetchUserProfile, type UserProfile } from "../services/profileApi";
import { fetchCategories, type Category } from "../services/categoriesApi";
import { currentStreak, fetchHabits, todayKey, updateHabitCompletion, type Habit } from "../services/habitsApi";
import { fromTaskDue, isOverdue } from "../services/taskDue";

interface Props {
  userName: string;
  onTaskTap: (taskId: string) => void;
  onHabits: () => void;
  onFab: () => void;
  onViewTasks: () => void;
  onConfigureProfile: () => void;
  onAgenda: () => void;
  refreshTick: number;
}

const MAX_STATIONS = 5;

function currentDateLabel(): string {
  const formatted = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  return formatted.charAt(0).toUpperCase() + formatted.slice(1).replace(" de ", " · ");
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

function dueTimestamp(task: UiTask): number {
  const { date, time } = fromTaskDue(task.rawDue);
  return date ? new Date(`${date}T${time || "23:59"}`).getTime() : Number.MAX_SAFE_INTEGER;
}

export default function HomeScreen({ userName, onTaskTap, onHabits, onFab, onViewTasks, onConfigureProfile, onAgenda, refreshTick }: Props) {
  const [tasks, setTasks] = useState<UiTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  // Estaciones recién completadas: se quedan un instante, tachadas, antes de salir de la línea.
  const [leaving, setLeaving] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadTasks() {
      try {
        const apiTasks = await fetchTasks();
        if (!ignore) {
          setTasks(apiTasks.map(toUiTask));
          setTaskError(null);
        }
      } catch (err) {
        if (!ignore) setTaskError(err instanceof Error ? err.message : "No fue posible cargar las tareas");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadTasks();
    fetchUserProfile().then((data) => { if (!ignore) setProfile(data); }).catch(() => { if (!ignore) setProfile(null); });
    fetchHabits().then((data) => { if (!ignore) setHabits(data); }).catch(() => { if (!ignore) setHabits([]); });
    return () => { ignore = true; };
  }, [refreshTick]);

  const stations = useMemo(
    () => tasks.filter((task) => !task.done || leaving.has(task.id)).sort((a, b) => dueTimestamp(a) - dueTimestamp(b)).slice(0, MAX_STATIONS),
    [tasks, leaving],
  );
  const overdueCount = useMemo(() => tasks.filter((task) => !task.done && isOverdue(task.rawDue)).length, [tasks]);

  const completedTasks = tasks.filter((task) => task.done).length;
  const pendingTasks = tasks.length - completedTasks;
  const taskProgress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const weekday = (new Date().getDay() + 6) % 7 + 1;
  const todayHabits = habits.filter((habit) => habit.daysOfWeek.includes(weekday));
  const habitsDone = todayHabits.filter((habit) => habit.completedDates.includes(todayKey())).length;

  async function toggleTask(task: UiTask) {
    const previousTasks = tasks;
    setTasks(tasks.map((item) => item.id === task.id ? { ...item, done: !item.done } : item));
    if (!task.done) {
      navigator.vibrate?.(8);
      setLeaving((current) => new Set(current).add(task.id));
      setTimeout(() => setLeaving((current) => { const next = new Set(current); next.delete(task.id); return next; }), 900);
    } else {
      setLeaving((current) => { const next = new Set(current); next.delete(task.id); return next; });
    }

    try {
      await updateTaskStatus(task.id, !task.done);
    } catch (err) {
      setTasks(previousTasks);
      setTaskError(err instanceof Error ? err.message : "No fue posible actualizar la tarea");
    }
  }

  async function toggleHabit(habit: Habit) {
    const completed = habit.completedDates.includes(todayKey());
    const previous = habits;
    setHabits(habits.map((item) => item.id === habit.id
      ? { ...item, completedDates: completed ? item.completedDates.filter((d) => d !== todayKey()) : [...item.completedDates, todayKey()] }
      : item));
    try {
      const updated = await updateHabitCompletion(habit.id, !completed);
      setHabits((current) => current.map((item) => item.id === habit.id ? updated : item));
    } catch {
      setHabits(previous);
    }
  }

  const colorOf = (task: UiTask) => categories.find((category) => category.name === task.tag)?.color ?? "#FF6B4A";

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-paper">
      <header className="px-4 pt-3 pb-3 lg:px-8 lg:pt-8 lg:pb-6">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="truncate font-display text-[30px] font-semibold leading-[1.05] tracking-tight text-ink lg:text-[44px]">
              {greeting()}, {userName.split(" ")[0]}
            </h1>
            <p className="mt-0.5 text-[14px] text-ink-2">{currentDateLabel()}</p>
          </div>
          <ThemeToggle className="-mr-2 flex-shrink-0 lg:hidden" />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1"><ProgressBar value={taskProgress} height={4} /></div>
          <p className="num whitespace-nowrap text-[15px] font-medium text-ink-2">{completedTasks}/{tasks.length}</p>
        </div>
        <p className="mt-1.5 text-[14px] text-ink-2">
          {tasks.length === 0
            ? "Sin tareas todavía."
            : overdueCount > 0
              ? `${overdueCount} ${overdueCount === 1 ? "vencida" : "vencidas"} · ${pendingTasks - overdueCount} por llegar`
              : `${pendingTasks} por llegar · vas a tiempo`}
        </p>
      </header>

      <div className="flex flex-col gap-5 px-4 pb-6 lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start lg:gap-10 lg:px-8 lg:pb-12">
        {/* Línea del día */}
        <section aria-label="Próximas entregas">
          <SectionTitle label="Próximas estaciones" action="Ver todas" onAction={onViewTasks} />

          {taskError && <p role="alert" className="rounded-md border border-danger-line bg-danger-wash px-3 py-2 text-[14px] font-medium text-danger">{taskError}</p>}

          {loading && !taskError ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              {[0, 1, 2].map((i) => <div key={i} className="h-[68px] animate-pulse rounded-md bg-wash" />)}
            </div>
          ) : !taskError && stations.length === 0 ? (
            <div className="rounded-md border border-dashed border-line-strong px-4 py-6 text-center">
              <p className="font-display text-[22px] font-semibold leading-none text-ink">Línea despejada</p>
              <p className="mt-2 text-[14px] text-ink-2">No hay entregas pendientes. Planea tu semana o agrega algo nuevo.</p>
              <div className="mt-4 flex justify-center gap-2">
                <button onClick={onFab} className="rounded-md bg-coral px-4 py-2.5 text-[14px] font-semibold text-night transition-transform duration-150 ease-out active:scale-[0.97]">Nueva tarea</button>
                <button onClick={onAgenda} className="rounded-md border border-line-strong px-4 py-2.5 text-[14px] font-semibold text-ink transition-transform duration-150 ease-out active:scale-[0.97]">Abrir agenda</button>
              </div>
            </div>
          ) : (
            <ol className="relative">
              <NowMarker />
              {stations.map((task, index) => {
                const overdue = isOverdue(task.rawDue);
                const color = colorOf(task);
                const last = index === stations.length - 1;
                return (
                  <li key={task.id} className={`orbit-rise relative flex gap-3 transition-opacity duration-300 ease-out ${task.done ? "opacity-50" : ""}`} style={{ ["--i" as string]: index + 1 }}>
                    {/* Riel: segmento de la línea de esta categoría; discontinuo si está vencida */}
                    <div className="relative flex w-7 flex-shrink-0 justify-center">
                      {!last && <span className="absolute left-1/2 top-[30px] bottom-0 w-0 -translate-x-1/2" style={{ borderLeft: `3px ${overdue ? "dashed" : "solid"} ${color}` }} />}
                      <Station color={color} done={task.done} overdue={overdue} onToggle={() => toggleTask(task)} label={`Marcar “${task.label}” como hecha`} />
                    </div>

                    <button
                      onClick={() => onTaskTap(task.id)}
                      className="mb-1 flex min-w-0 flex-1 items-start gap-3 rounded-md px-1 py-2 text-left transition-colors duration-150 active:bg-wash"
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`text-[16px] font-semibold leading-snug ${task.done ? "text-ink-3 line-through" : "text-ink"}`}>{task.label}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <CategoryBadge name={task.tag} color={color} />
                          {overdue && <Badge label="Vencida" color="coral" />}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-2 pt-0.5">
                        <span className={`num text-[17px] font-semibold leading-none ${overdue ? "text-danger" : "text-ink"}`}>{task.due}</span>
                        <PriorityDot level={task.priority} />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <div className="flex flex-col gap-5">
        {/* Línea paralela de hábitos */}
        <section aria-label="Hábitos de hoy">
          <SectionTitle label="Hábitos de hoy" action={habits.length ? "Ver todos" : "Crear"} onAction={onHabits} />
          {todayHabits.length === 0 ? (
            <button onClick={onHabits} className="w-full rounded-md border border-dashed border-line-strong px-4 py-4 text-left transition-colors duration-150 active:bg-wash">
              <p className="text-[16px] font-semibold text-ink">{habits.length ? "Hoy no toca ningún hábito" : "Todavía no hay hábitos"}</p>
              <p className="mt-0.5 text-[14px] text-ink-2">{habits.length ? "Descansa o revisa tu plan semanal." : "Crea uno pequeño y corre junto a tus entregas."}</p>
            </button>
          ) : (
            <div className="rounded-md border border-line bg-card px-3 pt-3 pb-3">
              <div className="relative">
                <span className="absolute left-4 right-4 top-[22px] h-[3px] -translate-y-1/2 bg-line-strong" />
                <ul className="relative flex gap-1 overflow-x-auto no-scrollbar">
                  {todayHabits.map((habit) => {
                    const done = habit.completedDates.includes(todayKey());
                    return (
                      <li key={habit.id} className="flex w-[76px] flex-shrink-0 flex-col items-center">
                        <button
                          onClick={() => toggleHabit(habit)}
                          role="checkbox"
                          aria-checked={done}
                          aria-label={`${habit.title}: ${done ? "desmarcar" : "completar"} hoy`}
                          className="flex h-11 w-11 items-center justify-center"
                        >
                          <span
                            className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-[3px] transition-[background-color,transform] duration-150 ease-out active:scale-75"
                            style={{ borderColor: habit.color, background: done ? habit.color : "var(--color-card)" }}
                          >
                            {done && <svg width="11" height="9" viewBox="0 0 9 7" fill="none" aria-hidden="true"><path d="M1 3.5L3.5 6 8 1" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                          </span>
                        </button>
                        <span className="mt-1 line-clamp-2 text-center text-[13px] font-medium leading-tight text-ink">{habit.title}</span>
                        <span className="num mt-0.5 text-[13px] text-ink-3">{currentStreak(habit.completedDates)} d</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <p className="num mt-2 border-t border-line pt-2 text-[14px] text-ink-2">{habitsDone} de {todayHabits.length} hoy</p>
            </div>
          )}
        </section>

        {/* Resumen académico */}
        <section aria-label="Resumen académico" className="border-t border-line pt-4">
          {profile?.program ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-[20px] font-semibold leading-none text-ink">Resumen académico</h2>
                  <p className="mt-2 text-[15px] text-ink-2">{profile.program}</p>
                </div>
                <span className="num text-[15px] font-semibold text-ink-2">{profile.semester || "Configurado"}</span>
              </div>
              <dl className="mt-4 flex gap-8">
                <Metric label="Meta" value={profile.gradeTarget || "-"} />
                <Metric label="Código" value={profile.studentCode || "-"} />
              </dl>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-[16px] font-semibold text-ink">Crea tu resumen académico</h2>
                <p className="mt-0.5 text-[14px] text-ink-2">Añade programa, semestre y una meta cuando quieras.</p>
              </div>
              <button onClick={onConfigureProfile} className="flex h-11 items-center rounded-md border border-line-strong px-4 text-[14px] font-semibold text-ink transition-transform duration-150 ease-out active:scale-[0.97]">Configurar</button>
            </div>
          )}
        </section>
        </div>
      </div>
    </div>
  );
}

/** Marcador "ahora": la cabecera de la línea, con pulso discreto. */
function NowMarker() {
  const time = new Date().toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
  return (
    <div className="flex items-center gap-3" aria-label={`Ahora, ${time}`}>
      <div className="relative flex h-8 w-7 flex-shrink-0 items-center justify-center">
        <span className="absolute left-1/2 top-1/2 bottom-0 w-0 -translate-x-1/2 border-l-[3px] border-coral" />
        <span className="orbit-pulse absolute h-3 w-3 rounded-full bg-coral" />
        <span className="relative h-3 w-3 rounded-full bg-coral" />
      </div>
      <p className="font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-coral-ink">Ahora</p>
      <span className="num text-[15px] text-ink-2">{time}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[13px] font-medium text-ink-2">{label}</dt>
      <dd className="num mt-0.5 text-[24px] font-semibold leading-none text-ink">{value}</dd>
    </div>
  );
}
