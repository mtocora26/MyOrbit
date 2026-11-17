import { useEffect, useMemo, useRef, useState } from "react";
import { ErrorBanner, ProgressBar, ScreenHeader, Skeleton, DeleteButton } from "../components/shared";
import { IconBook, IconMeditate, IconNoPhone, IconPencil, IconReadingBook, IconRun, IconTarget } from "../components/icons";
import { cacheKeys, peek } from "../services/cache";
import { createHabit, deleteHabit, fetchHabitSummaries, fetchHabits, toLocalKey, todayKey, updateHabit, updateHabitCompletion, completeLabel, type Habit, type HabitType, type HabitStats, type HabitSummary, type MonthlyGoal } from "../services/habitsApi";

interface Props { onBack: () => void; refreshTick: number; }

const DAYS = ["L", "M", "X", "J", "V", "S", "D"];
const STATS_WINDOWS = [7, 30, 90] as const;
const COLORS = ["#7A5AF8", "#FF6B4A", "#2E90FA", "#12B76A", "#F79009"];
const ICONS = { book: IconBook, run: IconRun, reading: IconReadingBook, meditate: IconMeditate, phone: IconNoPhone, target: IconTarget };

function summariesFromCache(days: number): Record<string, HabitSummary> {
  const list = peek<HabitSummary[]>(cacheKeys.habitSummaries(days, 6)) ?? [];
  return Object.fromEntries(list.map((summary) => [summary.habitId, summary]));
}

export default function HabitsScreen({ onBack, refreshTick }: Props) {
  const [habits, setHabits] = useState<Habit[]>(() => peek<Habit[]>(cacheKeys.habits) ?? []);
  const [loading, setLoading] = useState(() => peek<Habit[]>(cacheKeys.habits) === undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  // Id del hábito en edición; null = el formulario crea uno nuevo.
  const [editingId, setEditingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [statsWindow, setStatsWindow] = useState<(typeof STATS_WINDOWS)[number]>(30);
  // Estadísticas y meta mensual de todos los hábitos, de una sola petición. Mientras no llegan, las tarjetas
  // muestran esqueletos (nunca «0 días» ni «–» inventados); al recalcular se conservan los valores anteriores.
  const [summaries, setSummaries] = useState<Record<string, HabitSummary>>(() => summariesFromCache(30));
  const [summaryFailed, setSummaryFailed] = useState(false);
  const [summaryTick, setSummaryTick] = useState(0);
  const [monthlyGoal, setMonthlyGoal] = useState("");
  const [type, setType] = useState<HabitType>("BUILD");
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState<"diaria" | "personalizada">("diaria");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState<keyof typeof ICONS>("target");

  async function loadHabits() {
    try {
      if (peek(cacheKeys.habits) === undefined) setLoading(true);
      setError(null);
      setHabits(await fetchHabits());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar los habitos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadHabits(); }, [refreshTick]);

  // Las estadísticas y la meta dependen del historial, del horario y de la meta de cada hábito: se recalculan
  // cuando cambian, cuando cambia la ventana o cuando el usuario pulsa «Reintentar».
  const summaryKey = habits.map((habit) => `${habit.id}:${habit.frequency}:${habit.daysOfWeek.join("")}:${habit.monthlyGoal ?? ""}:${habit.completedDates.length}:${habit.completedDates.at(-1) ?? ""}`).join("|");
  useEffect(() => {
    if (habits.length === 0) return;
    let cancelled = false;
    fetchHabitSummaries(statsWindow).then((list) => {
      if (cancelled) return;
      setSummaries(Object.fromEntries(list.map((summary) => [summary.habitId, summary])));
      setSummaryFailed(false);
    }).catch(() => { if (!cancelled) setSummaryFailed(true); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summaryKey, statsWindow, summaryTick]);

  const doneToday = habits.filter((habit) => habit.completedDates.includes(todayKey())).length;
  // Sin la lista real no se afirma «0/0 hábitos hoy».
  const habitsKnown = !loading && !(error && habits.length === 0);
  const completion = habits.length ? Math.round((doneToday / habits.length) * 100) : 0;
  const weekDates = useMemo(() => {
    const today = new Date();
    const offset = today.getDay() === 0 ? -6 : 1 - today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() + offset);
    return DAYS.map((_, index) => { const date = new Date(monday); date.setDate(monday.getDate() + index); return date; });
  }, []);

  async function toggleHabit(habit: Habit) {
    const completed = habit.completedDates.includes(todayKey());
    try {
      setSaving(true);
      setError(null);
      const updated = await updateHabitCompletion(habit.id, !completed);
      setHabits(habits.map((item) => item.id === habit.id ? updated : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible actualizar el habito");
    } finally {
      setSaving(false);
    }
  }

  async function submitHabit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || saving) return;
    try {
      setSaving(true);
      setError(null);
      const goal = Number.parseInt(monthlyGoal, 10);
      // Al editar, 0 quita la meta; al crear, null = sin meta.
      const input = { title: title.trim(), frequency, daysOfWeek: frequency === "diaria" ? [1, 2, 3, 4, 5, 6, 7] : daysOfWeek, color, icon, type, monthlyGoal: Number.isFinite(goal) && goal > 0 ? goal : editingId ? 0 : null };
      if (editingId) {
        const updated = await updateHabit(editingId, input);
        setHabits(habits.map((item) => item.id === updated.id ? updated : item));
      } else {
        setHabits([...habits, await createHabit(input)]);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : editingId ? "No fue posible editar el habito" : "No fue posible crear el habito");
    } finally {
      setSaving(false);
    }
  }

  async function removeHabit(habitId: string) {
    if (saving) return;
    try {
      setSaving(true);
      await deleteHabit(habitId);
      setHabits(habits.filter((habit) => habit.id !== habitId));
      if (editingId === habitId) resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible eliminar el habito");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setTitle("");
    setFrequency("diaria");
    setDaysOfWeek([1, 2, 3, 4, 5, 6, 7]);
    setColor(COLORS[0]);
    setIcon("target");
    setMonthlyGoal("");
    setType("BUILD");
    setEditingId(null);
    setCreating(false);
  }

  function startCreate() {
    if (creating && !editingId) { resetForm(); return; }
    resetForm();
    setError(null);
    setCreating(true);
  }

  function startEdit(habit: Habit) {
    setError(null);
    setEditingId(habit.id);
    setTitle(habit.title);
    setFrequency(habit.frequency);
    setDaysOfWeek(habit.daysOfWeek);
    setColor(habit.color);
    setIcon(habit.icon in ICONS ? (habit.icon as keyof typeof ICONS) : "target");
    setMonthlyGoal(habit.monthlyGoal ? String(habit.monthlyGoal) : "");
    setType(habit.type ?? "BUILD");
    setCreating(true);
    // El formulario vive arriba de la lista: se lleva a la vista al editar un hábito lejano.
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleDay(day: number) {
    setDaysOfWeek((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort());
  }

  return (
    <div className="h-full min-h-0 flex flex-col bg-paper">
      <ScreenHeader title="Hábitos" subtitle="Tu constancia, un día a la vez" onBack={onBack} right={<button onClick={startCreate} aria-label="Crear hábito" className="flex h-11 w-11 items-center justify-center rounded-md bg-coral text-[24px] font-semibold text-night">+</button>} />

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto no-scrollbar px-4 pt-3 pb-8 flex flex-col gap-4 lg:px-8 lg:pt-6 lg:max-w-[760px] [&>*]:shrink-0">
        <div className="rounded-md border border-line bg-card p-4">
          {habitsKnown
            ? <p className="num text-[44px] font-semibold leading-none text-ink">{doneToday}<span className="text-[24px] text-ink-3">/{habits.length}</span> <span className="text-[16px] font-medium text-ink-2">hábitos hoy</span></p>
            : loading ? <Skeleton className="h-[44px] w-44" /> : <p className="flex h-[44px] items-center text-[16px] font-medium text-ink-2">Hábitos de hoy no disponibles</p>}
          <div className="mt-3"><ProgressBar value={completion} height={4} /></div>
          {habits.length > 0 && (
            <div className="mt-4 flex items-center justify-between gap-3">
              <span id="stats-window-label" className="text-[13px] font-semibold text-ink-2">Estadísticas de los últimos</span>
              <div role="radiogroup" aria-labelledby="stats-window-label" className="flex flex-shrink-0 rounded-md bg-wash p-1">
                {STATS_WINDOWS.map((days) => (
                  <button key={days} type="button" role="radio" aria-checked={statsWindow === days} onClick={() => setStatsWindow(days)} className="num min-h-[44px] min-w-[44px] whitespace-nowrap rounded-[4px] px-2.5 text-[14px] font-semibold" style={{ background: statsWindow === days ? "var(--color-card)" : "transparent", color: statsWindow === days ? "var(--color-ink)" : "var(--color-ink-2)" }}>{days} d</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {creating && <form onSubmit={submitHabit} className="rounded-lg bg-card p-4 flex flex-col gap-3">{editingId && <p className="text-[13px] font-semibold text-ink-2">Editando hábito · tu historial de cumplimiento se conserva</p>}<div role="radiogroup" aria-label="Tipo de hábito" className="flex rounded-md bg-wash p-1">{(["BUILD", "QUIT"] as const).map((option) => <button key={option} type="button" role="radio" aria-checked={type === option} onClick={() => setType(option)} className="min-h-[44px] flex-1 rounded-lg py-2 text-[13px] font-bold" style={{ background: type === option ? "var(--color-card)" : "transparent" }}>{option === "BUILD" ? "Por construir" : "Para dejar"}</button>)}</div><input autoFocus aria-label="Nombre del hábito" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={type === "QUIT" ? "Ej. No fumar" : "Ej. Leer 20 minutos"} className="rounded-md border border-line bg-paper px-3 py-2.5 text-[14px] outline-none focus:border-violet" /><div className="flex rounded-md bg-wash p-1"><button type="button" onClick={() => { setFrequency("diaria"); setDaysOfWeek([1, 2, 3, 4, 5, 6, 7]); }} className="flex-1 rounded-lg py-2 text-[13px] font-bold" style={{ background: frequency === "diaria" ? "var(--color-card)" : "transparent" }}>Diario</button><button type="button" onClick={() => setFrequency("personalizada")} className="flex-1 rounded-lg py-2 text-[13px] font-bold" style={{ background: frequency === "personalizada" ? "var(--color-card)" : "transparent" }}>Días</button></div>{frequency === "personalizada" && <div className="flex justify-between">{DAYS.map((day, index) => <button key={day} type="button" onClick={() => toggleDay(index + 1)} className="h-11 min-w-0 max-w-11 flex-1 rounded-full text-[13px] font-bold" style={{ background: daysOfWeek.includes(index + 1) ? color : "var(--color-wash)", color: daysOfWeek.includes(index + 1) ? "white" : "var(--color-ink-2)" }}>{day}</button>)}</div>}<label className="flex items-center justify-between gap-3 text-[13px] font-semibold text-ink-2">Meta mensual (opcional)<span className="flex items-center gap-1"><input type="number" inputMode="numeric" min={1} max={100} aria-label="Meta mensual en porcentaje" value={monthlyGoal} onChange={(event) => setMonthlyGoal(event.target.value)} placeholder="80" className="num w-16 rounded-md border border-line bg-paper px-2 py-1.5 text-right text-[14px] outline-none focus:border-violet" /><span>%</span></span></label><div className="flex items-center justify-between"><div className="flex gap-2">{(COLORS.includes(color) ? COLORS : [...COLORS, color]).map((option) => <button key={option} type="button" aria-label={`Color ${option}`} onClick={() => setColor(option)} className="h-6 w-6 rounded-full border-2" style={{ background: option, borderColor: color === option ? "var(--color-night)" : "transparent" }} />)}</div><select value={icon} onChange={(event) => setIcon(event.target.value as keyof typeof ICONS)} className="rounded-md border border-line bg-paper px-2 py-1.5 text-[13px]"><option value="target">Meta</option><option value="book">Estudio</option><option value="run">Ejercicio</option><option value="reading">Lectura</option><option value="meditate">Calma</option><option value="phone">Sin redes</option></select></div><div className="flex gap-2"><button type="button" onClick={resetForm} className="rounded-md bg-wash px-3 py-2 text-[13px] font-bold text-ink-2">Cancelar</button><button disabled={!title.trim() || saving} className="rounded-md bg-violet px-3 py-2 text-[13px] font-bold text-white disabled:opacity-50">{saving ? (editingId ? "Guardando..." : "Creando...") : editingId ? "Guardar cambios" : "Crear hábito"}</button></div></form>}

        {error && <ErrorBanner message={error} onRetry={loadHabits} />}
        {loading ? <HabitListSkeleton /> : habits.length === 0 && error ? null : habits.length === 0 ? <div className="rounded-md border border-dashed border-line-strong px-5 py-10 text-center"><p className="font-display text-[22px] font-semibold leading-none text-ink">Tu primera rutina empieza aquí</p><p className="mt-1 text-[13px] leading-relaxed text-ink-2">Crea un hábito pequeño y marca tu avance cada día.</p><button onClick={startCreate} className="mt-4 min-h-[44px] rounded-md bg-coral px-5 text-[15px] font-semibold text-night">Crear hábito</button></div> : habits.map((habit) => <HabitCard key={habit.id} habit={habit} weekDates={weekDates} saving={saving} summary={summaries[habit.id]} summaryFailed={summaryFailed} onRetrySummary={() => setSummaryTick((tick) => tick + 1)} onToggle={() => toggleHabit(habit)} onEdit={() => startEdit(habit)} onDelete={() => removeHabit(habit.id)} />)}
      </div>
    </div>
  );
}

function HabitCard({ habit, weekDates, saving, summary, summaryFailed, onRetrySummary, onToggle, onEdit, onDelete }: { habit: Habit; weekDates: Date[]; saving: boolean; summary?: HabitSummary; summaryFailed: boolean; onRetrySummary: () => void; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  const doneToday = habit.completedDates.includes(todayKey());
  return (
    <div className="rounded-md border border-line bg-card px-4 pt-3 pb-4">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 flex-shrink-0 rounded-[3px]" style={{ background: habit.color }} aria-hidden="true" />
        <p className="min-w-0 flex-1 truncate text-[17px] font-semibold text-ink">{habit.title}</p>
        <button onClick={onEdit} disabled={saving} title="Editar hábito" aria-label={`Editar hábito ${habit.title}`} className="flex h-11 w-11 items-center justify-center rounded-md text-ink-3 transition-colors active:bg-wash disabled:opacity-50">
          <IconPencil size={16} />
        </button>
        <DeleteButton label={`hábito ${habit.title}`} onClick={onDelete} disabled={saving} className="mr-2" />
        <button
          onClick={onToggle}
          disabled={saving}
          role="checkbox"
          aria-checked={doneToday}
          aria-label={completeLabel(habit.type ?? "BUILD", doneToday)}
          className="-mr-2 flex h-11 w-11 items-center justify-center disabled:opacity-50"
        >
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-[3px] transition-[background-color,transform] duration-150 ease-out active:scale-75" style={{ borderColor: habit.color, background: doneToday ? habit.color : "var(--color-card)" }}>
            {doneToday && <svg width="11" height="9" viewBox="0 0 9 7" fill="none" aria-hidden="true"><path d="M1 3.5L3.5 6 8 1" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </span>
        </button>
      </div>
      <p className="mt-0.5 flex items-center gap-3 text-[14px] text-ink-2">
        <span>{habit.frequency === "diaria" ? "Diario" : "Personalizado"}</span>
        {habit.type === "QUIT" && <span className="font-semibold text-coral-ink">Para dejar · marca los días que lo evitas</span>}
      </p>
      <HabitStatsRow stats={summary?.stats} noHistory={habit.completedDates.length === 0} failed={summaryFailed && !summary} onRetry={onRetrySummary} />
      {summary?.monthlyGoal && <MonthlyGoalRow monthly={summary.monthlyGoal} color={habit.color} />}
      {habit.monthlyGoal && !summary && !summaryFailed && <Skeleton className="mt-3 h-[56px] w-full" />}
      {/* La semana como una línea: una estación por día */}
      <div className="relative mt-3">
        <span className="absolute left-3 right-3 top-[11px] h-[3px] bg-line-strong" />
        <ul className="relative flex justify-between">
          {weekDates.map((date, index) => {
            const key = toLocalKey(date);
            const planned = habit.daysOfWeek.includes(index + 1);
            const complete = habit.completedDates.includes(key);
            return (
              <li key={key} className="flex w-6 flex-col items-center gap-1" aria-label={`${DAYS[index]}: ${complete ? "hecho" : planned ? "pendiente" : "descanso"}`}>
                <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-[3px]" style={{ borderColor: planned ? habit.color : "var(--color-line-strong)", background: complete ? habit.color : "var(--color-card)", borderStyle: planned ? "solid" : "dashed" }}>
                  {complete && <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden="true"><path d="M1 3.5L3.5 6 8 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </span>
                <span className="text-[13px] font-medium text-ink-2">{DAYS[index]}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

const monthName = (month: string) => new Date(`${month}-01T12:00:00`).toLocaleDateString("es", { month: "long" });

/** Avance del mes frente a la meta: barra con el mínimo marcado, lo que falta y los meses anteriores aprobados o no. */
function MonthlyGoalRow({ monthly, color }: { monthly: MonthlyGoal; color: string }) {
  const { current, history, goal } = monthly;
  const fill = current.scheduledDays > 0 ? Math.min(100, (current.completedDays / current.scheduledDays) * 100) : 0;
  const marker = current.scheduledDays > 0 ? (current.requiredDays / current.scheduledDays) * 100 : goal;
  const status = current.approved
    ? "Meta del mes lograda"
    : current.reachable
      ? `Faltan ${current.remainingToGoal} ${current.remainingToGoal === 1 ? "día" : "días"} para llegar a la meta`
      : "La meta de este mes ya no es alcanzable";
  return (
    <div className="mt-3 border-t border-line pt-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[13px] text-ink-2">Meta de {monthName(current.month)} · {goal}%</p>
        <p className="num text-[13px] font-semibold text-ink">{current.completedDays}/{current.requiredDays} días</p>
      </div>
      <div className="relative mt-1.5 h-2 rounded-full bg-wash" role="progressbar" aria-valuemin={0} aria-valuemax={current.requiredDays} aria-valuenow={Math.min(current.completedDays, current.requiredDays)} aria-label={`Meta mensual del hábito: ${current.completedDays} de ${current.requiredDays} días`}>
        <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${fill}%`, background: color }} />
        <span className="absolute -top-0.5 h-3 w-[2px] bg-ink" style={{ left: `${marker}%` }} aria-hidden="true" />
      </div>
      <p className="mt-1.5 text-[13px] font-medium" style={{ color: current.approved ? "var(--color-green-ink)" : current.reachable ? "var(--color-ink-2)" : "var(--color-danger)" }}>{status}</p>
      {history.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Meses anteriores">
          {history.map((month) => (
            <li key={month.month} className="rounded-md px-2 py-1 text-[13px] font-medium" style={{ background: month.approved ? "var(--color-green-wash)" : "var(--color-wash)", color: month.approved ? "var(--color-green-ink)" : "var(--color-ink-2)" }}>
              {monthName(month.month)} {month.approved ? "✓" : `${Math.round(month.rate)}%`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const percent = (value: number) => `${value.toLocaleString("es", { maximumFractionDigits: 1 })}%`;

/** Racha actual, mejor racha y cumplimiento: tablero de salidas, cifras condensadas sobre etiquetas pequeñas. */
function HabitStatsRow({ stats, noHistory, failed, onRetry }: { stats?: HabitStats; noHistory: boolean; failed: boolean; onRetry: () => void }) {
  // Sin datos reales no se pinta ninguna cifra: esqueleto con la forma final (sin saltos) o error con reintento.
  if (!stats) {
    return (
      <div className="mt-3 border-t border-line pt-3" aria-busy={!failed}>
        {failed ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] text-ink-2">No se pudieron calcular las estadísticas.</p>
            <button type="button" onClick={onRetry} className="-mr-3 min-h-[44px] flex-shrink-0 px-3 text-[14px] font-semibold text-coral-ink">Reintentar</button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2" aria-hidden="true">
            {[0, 1, 2].map((index) => <div key={index}><Skeleton className="h-[13px] w-16" /><Skeleton className="mt-1.5 h-[26px] w-14" /></div>)}
          </div>
        )}
        {/* Se decide con el historial del hábito (ya conocido): reserva el alto de la pista para que no haya salto. */}
        {noHistory && !failed && <p className="invisible mt-2 text-[13px]" aria-hidden="true">Marca tu primer día para empezar la racha.</p>}
      </div>
    );
  }
  const days = (value: number) => (value === 1 ? "día" : "días");
  const cells = [
    { label: "Racha", value: String(stats.currentStreak), unit: days(stats.currentStreak) },
    { label: "Mejor racha", value: String(stats.bestStreak), unit: days(stats.bestStreak) },
    { label: `Cumplimiento ${stats.windowDays} d`, value: stats.scheduledDays > 0 ? percent(stats.completionRate) : "–", unit: stats.scheduledDays > 0 ? `${stats.completedDays}/${stats.scheduledDays}` : "" },
  ];
  return (
    <div className="mt-3 border-t border-line pt-3">
      <dl className="grid grid-cols-3 gap-2">
        {cells.map((cell) => (
          <div key={cell.label} className="min-w-0">
            <dt className="truncate text-[13px] text-ink-2">{cell.label}</dt>
            <dd className="num mt-0.5 flex items-baseline gap-1 text-ink"><span className="text-[26px] font-semibold leading-none">{cell.value}</span><span className="truncate text-[13px] text-ink-3">{cell.unit}</span></dd>
          </div>
        ))}
      </dl>
      {noHistory && <p className="mt-2 text-[13px] text-ink-2">Marca tu primer día para empezar la racha.</p>}
    </div>
  );
}

/** Tres tarjetas con la forma de una tarjeta de hábito: título, cifras y la línea de la semana. */
function HabitListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando hábitos">
      {[0, 1, 2].map((index) => (
        <div key={index} className="rounded-md border border-line bg-card px-4 pt-3 pb-4" aria-hidden="true">
          <div className="flex h-11 items-center gap-2"><Skeleton className="h-3 w-3" /><Skeleton className="h-[17px] w-40" /></div>
          <Skeleton className="mt-1 h-[14px] w-16" />
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3">
            {[0, 1, 2].map((cell) => <div key={cell}><Skeleton className="h-[13px] w-16" /><Skeleton className="mt-1.5 h-[26px] w-14" /></div>)}
          </div>
          <div className="mt-4 flex justify-between">{[0, 1, 2, 3, 4, 5, 6].map((day) => <Skeleton key={day} className="h-[26px] w-[26px] rounded-full" />)}</div>
        </div>
      ))}
    </div>
  );
}
