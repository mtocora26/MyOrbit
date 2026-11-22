import { useEffect, useState } from "react";
import { ChoiceChip, ErrorBanner, ProgressBar, ScreenHeader, Skeleton, DeleteButton, DetailSheet } from "../components/shared";
import { IconBook, IconMeditate, IconNoPhone, IconPencil, IconReadingBook, IconRun, IconTarget } from "../components/icons";
import { cacheKeys, peek } from "../services/cache";
import { flushPending, runUndoable } from "../services/undo";
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

  // Un día del calendario del mes: se ve al instante y se confirma al vencer el plazo de «Deshacer».
  function toggleHabitDay(habit: Habit, date: string, completed: boolean) {
    const withDay = (item: Habit) => item.id !== habit.id ? item : { ...item, completedDates: [...new Set([...item.completedDates, date])] };
    const withoutDay = (item: Habit) => item.id !== habit.id ? item : { ...item, completedDates: item.completedDates.filter((day) => day !== date) };
    const label = new Date(`${date}T12:00:00`).toLocaleDateString("es", { day: "numeric", month: "short" });
    runUndoable({
      message: completed ? `Marcado: ${label}` : `Desmarcado: ${label}`,
      apply: () => setHabits((current) => current.map(completed ? withDay : withoutDay)),
      restore: () => setHabits((current) => current.map(completed ? withoutDay : withDay)),
      commit: async () => {
        const updated = await updateHabitCompletion(habit.id, completed, date);
        setHabits((current) => current.map((item) => item.id === updated.id ? updated : item));
        setSummaryTick((tick) => tick + 1);
      },
    });
  }

  // Al salir de la pantalla lo que espera «Deshacer» se confirma en el servidor.
  useEffect(() => flushPending, []);

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
  }

  function toggleDay(day: number) {
    setDaysOfWeek((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort());
  }

  return (
    <div className="h-full min-h-0 flex flex-col bg-paper">
      <ScreenHeader title="Hábitos" onBack={onBack} />

      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar px-4 pt-3 pb-8 flex flex-col gap-4 lg:px-8 lg:pt-6 lg:max-w-[760px] [&>*]:shrink-0">
        <div>
          {habitsKnown
            ? <p className="num text-[18px] font-semibold text-ink">{doneToday} de {habits.length} hoy</p>
            : loading ? <Skeleton className="h-[24px] w-32" /> : <p className="flex h-[24px] items-center text-[16px] font-medium text-ink-2">Hábitos de hoy no disponibles</p>}
          <div className="mt-2"><ProgressBar value={completion} height={4} /></div>
          {habits.length > 0 && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <span id="stats-window-label" className="text-[13px] font-semibold text-ink-2">Estadísticas de los últimos</span>
              <div role="radiogroup" aria-labelledby="stats-window-label" className="flex flex-shrink-0 gap-1.5">
                {STATS_WINDOWS.map((days) => (
                  <ChoiceChip key={days} selected={statsWindow === days} onClick={() => setStatsWindow(days)} className="num min-w-[44px] whitespace-nowrap px-2.5">{days} d</ChoiceChip>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && <ErrorBanner message={error} onRetry={loadHabits} />}
        {loading ? <HabitListSkeleton /> : habits.length === 0 && error ? null : habits.length === 0 ? <div className="rounded-md border border-dashed border-line-strong px-5 py-10 text-center"><p className="font-display text-[22px] font-semibold leading-none text-ink">Tu primera rutina empieza aquí</p><p className="mt-1 text-[13px] leading-relaxed text-ink-2">Crea un hábito pequeño y marca tu avance cada día.</p><button onClick={startCreate} className="mt-4 min-h-[44px] rounded-md bg-coral px-5 text-[15px] font-semibold text-night">Crear hábito</button></div> : <div className="overflow-hidden rounded-md bg-card divide-y divide-line">{habits.map((habit) => <HabitCard key={habit.id} habit={habit} saving={saving} summary={summaries[habit.id]} summaryFailed={summaryFailed} onRetrySummary={() => setSummaryTick((tick) => tick + 1)} onToggle={() => toggleHabit(habit)} onToggleDay={(date, completed) => toggleHabitDay(habit, date, completed)} onEdit={() => startEdit(habit)} onDelete={() => removeHabit(habit.id)} />)}<button onClick={startCreate} className="flex min-h-[56px] w-full items-center px-4 text-left text-[15px] font-semibold text-coral-ink active:bg-wash">+ Nuevo hábito</button></div>}
      </div>
      <DetailSheet open={creating} onClose={resetForm} title={editingId ? "Editar hábito" : "Nuevo hábito"} doneLabel="Cancelar">
        <form onSubmit={submitHabit} className="flex flex-col gap-3">
            {editingId && <p className="text-[13px] font-semibold text-ink-2">Editando hábito · tu historial de cumplimiento se conserva</p>}
            <div role="radiogroup" aria-label="Tipo de hábito" className="flex gap-2">
              {(["BUILD", "QUIT"] as const).map((option) => (
                <ChoiceChip key={option} selected={type === option} onClick={() => setType(option)} className="flex-1">{option === "BUILD" ? "Por construir" : "Para dejar"}</ChoiceChip>
              ))}
            </div>
            <input autoFocus aria-label="Nombre del hábito" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={type === "QUIT" ? "Ej. No fumar" : "Ej. Leer 20 minutos"} className="min-h-[44px] rounded-md border border-line-control bg-paper px-3 text-[16px] text-ink outline-none focus:border-coral" />
            <div role="radiogroup" aria-label="Frecuencia" className="flex gap-2">
              <ChoiceChip selected={frequency === "diaria"} onClick={() => { setFrequency("diaria"); setDaysOfWeek([1, 2, 3, 4, 5, 6, 7]); }} className="flex-1">Diario</ChoiceChip>
              <ChoiceChip selected={frequency === "personalizada"} onClick={() => setFrequency("personalizada")} className="flex-1">Días</ChoiceChip>
            </div>
            {frequency === "personalizada" && (
              <div className="flex justify-between">
                {DAYS.map((day, index) => (
                  <button key={day} type="button" onClick={() => toggleDay(index + 1)} aria-pressed={daysOfWeek.includes(index + 1)} className="h-11 min-w-0 max-w-11 flex-1 rounded-full text-[13px] font-bold transition-transform duration-150 ease-out active:scale-95" style={{ background: daysOfWeek.includes(index + 1) ? color : "var(--color-wash)", color: daysOfWeek.includes(index + 1) ? "var(--color-night)" : "var(--color-ink-2)" }}>{day}</button>
                ))}
              </div>
            )}
            <label className="flex items-center justify-between gap-3 text-[13px] font-semibold text-ink-2">
              Meta mensual (opcional)
              <span className="flex items-center gap-1">
                <input type="number" inputMode="numeric" min={1} max={100} aria-label="Meta mensual en porcentaje" value={monthlyGoal} onChange={(event) => setMonthlyGoal(event.target.value)} placeholder="80" className="num w-20 min-h-[44px] rounded-md border border-line-control bg-paper px-3 text-[16px] text-ink outline-none focus:border-coral text-right" />
                <span>%</span>
              </span>
            </label>
            <div className="flex flex-wrap items-center justify-between gap-x-3">
              <div className="-ml-2 flex" role="radiogroup" aria-label="Color del hábito">
                {(COLORS.includes(color) ? COLORS : [...COLORS, color]).map((option) => (
                  <button key={option} type="button" role="radio" aria-checked={color === option} aria-label={`Color ${option}`} onClick={() => setColor(option)} className="flex h-11 w-11 items-center justify-center">
                    <span className="h-6 w-6 rounded-full border-2" style={{ background: option, borderColor: color === option ? "var(--color-ink)" : "transparent" }} />
                  </button>
                ))}
              </div>
              <select value={icon} onChange={(event) => setIcon(event.target.value as keyof typeof ICONS)} aria-label="Icono del hábito" className="min-h-[44px] max-w-full rounded-md border border-line-control bg-paper px-3 text-[14px] text-ink outline-none focus:border-coral">
                <option value="target">Meta</option>
                <option value="book">Estudio</option>
                <option value="run">Ejercicio</option>
                <option value="reading">Lectura</option>
                <option value="meditate">Calma</option>
                <option value="phone">Sin redes</option>
              </select>
            </div>
          <button disabled={!title.trim() || saving} className="min-h-[44px] rounded-md bg-coral px-4 text-[14px] font-bold text-night transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50">{saving ? (editingId ? "Guardando..." : "Creando...") : editingId ? "Guardar cambios" : "Crear hábito"}</button>
        </form>
      </DetailSheet>
    </div>
  );
}

function HabitCard({ habit, saving, summary, summaryFailed, onRetrySummary, onToggle, onToggleDay, onEdit, onDelete }: { habit: Habit; saving: boolean; summary?: HabitSummary; summaryFailed: boolean; onRetrySummary: () => void; onToggle: () => void; onToggleDay: (date: string, completed: boolean) => void; onEdit: () => void; onDelete: () => void }) {
  const doneToday = habit.completedDates.includes(todayKey());
  const [open, setOpen] = useState(false);
  const panelId = `habit-${habit.id}`;
  const goal = summary?.monthlyGoal?.current;
  // Lectura rápida con la tarjeta cerrada: frecuencia, racha y avance de la meta del mes.
  const quick = [
    habit.type === "QUIT" ? "Para dejar" : habit.frequency === "diaria" ? "Diario" : "Personalizado",
    summary ? `Racha ${summary.stats.currentStreak} ${summary.stats.currentStreak === 1 ? "día" : "días"}` : null,
    goal ? `Meta ${goal.completedDays}/${goal.requiredDays}` : null,
  ].filter(Boolean).join(" · ");
  return (
    <div>
      <div className="flex items-center gap-1 pl-4 pr-2">
        <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-controls={panelId} className="flex min-h-[64px] min-w-0 flex-1 items-center gap-3 rounded-md py-2 text-left active:bg-wash">
          <span className="h-3 w-3 flex-shrink-0 rounded-[3px]" style={{ background: habit.color }} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="line-clamp-2 text-[16px] font-semibold leading-snug text-ink">{habit.title}</span>
            <span className="num block truncate text-[13px] text-ink-2">{quick}</span>
          </span>
        </button>
        <button
          onClick={onToggle}
          disabled={saving}
          role="checkbox"
          aria-checked={doneToday}
          aria-label={completeLabel(habit.type ?? "BUILD", doneToday)}
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center disabled:opacity-50"
        >
          <span className="flex h-[28px] w-[28px] items-center justify-center rounded-full border-[3px] transition-[background-color,transform] duration-150 ease-out active:scale-75" style={{ borderColor: habit.color, background: doneToday ? habit.color : "var(--color-card)" }}>
            {doneToday && <svg width="12" height="10" viewBox="0 0 9 7" fill="none" aria-hidden="true"><path d="M1 3.5L3.5 6 8 1" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </span>
        </button>
      </div>
      <div id={panelId} className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`} inert={!open}>
        <div className="min-h-0 overflow-hidden">
          <div className="pb-3">
            <div className="px-4 pr-6">
            {habit.type === "QUIT" && <p className="mb-1 text-[13px] font-semibold text-coral-ink">Marca los días que lo evitas.</p>}
            <HabitStatsRow stats={summary?.stats} noHistory={habit.completedDates.length === 0} failed={summaryFailed && !summary} onRetry={onRetrySummary} />
            {summary?.monthlyGoal && <MonthlyGoalRow monthly={summary.monthlyGoal} color={habit.color} />}
            {habit.monthlyGoal && !summary && !summaryFailed && <Skeleton className="mt-3 h-[56px] w-full" />}
            </div>
            <HabitMonth habit={habit} onToggleDay={onToggleDay} />
            {/* Acciones fuera de la fila: lejos del botón de marcar, para no tocarlas por error. */}
            <div className="mx-4 mr-6 mt-3 flex items-center justify-between gap-2 border-t border-line pt-1">
              <button onClick={onEdit} disabled={saving} aria-label={`Editar hábito ${habit.title}`} className="flex min-h-[44px] items-center gap-2 rounded-md px-2 text-[14px] font-semibold text-ink-2 active:bg-wash disabled:opacity-50"><IconPencil size={16} />Editar</button>
              <DeleteButton label={`hábito ${habit.title}`} onClick={onDelete} disabled={saving} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const MAX_MONTHS_BACK = 24;
const monthTitle = (year: number, month: number) => {
  const text = new Date(year, month, 1).toLocaleDateString("es", { month: "long", year: "numeric" });
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/** El mes del hábito como una cuadrícula de estaciones: cada día se toca para marcar o desmarcar. */
function HabitMonth({ habit, onToggleDay }: { habit: Habit; onToggleDay: (date: string, completed: boolean) => void }) {
  const now = new Date();
  const [offset, setOffset] = useState(0);
  const shown = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  const year = shown.getFullYear();
  const month = shown.getMonth();
  const today = todayKey();
  const created = habit.createdDate;
  const firstKey = toLocalKey(shown);
  // Sin día de creación no hay límite inferior; con él, no se retrocede antes de su mes.
  const canGoBack = offset < MAX_MONTHS_BACK && (!created || created.slice(0, 7) < firstKey.slice(0, 7));
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (shown.getDay() + 6) % 7;
  const cells = [...Array.from({ length: leading }, () => null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  const quit = habit.type === "QUIT";
  return (
    <div className="mt-3">
      <div className="mx-4 mr-6 border-t border-line" />
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setOffset((current) => current + 1)} disabled={!canGoBack} aria-label="Mes anterior" className="flex h-11 w-11 flex-shrink-0 items-center justify-center text-ink-2 active:bg-wash disabled:opacity-30">
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none" aria-hidden="true"><path d="M7 1L1 7l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <p aria-live="polite" className="text-[14px] font-semibold text-ink">{monthTitle(year, month)}</p>
        <button type="button" onClick={() => setOffset((current) => current - 1)} disabled={offset === 0} aria-label="Mes siguiente" className="flex h-11 w-11 flex-shrink-0 items-center justify-center text-ink-2 active:bg-wash disabled:opacity-30">
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none" aria-hidden="true"><path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 px-0.5" role="group" aria-label={`Días de ${monthTitle(year, month)}`}>
        {DAYS.map((day) => <span key={day} className="flex h-6 items-center justify-center text-[13px] font-medium text-ink-2" aria-hidden="true">{day}</span>)}
        {cells.map((day, index) => {
          if (day === null) return <span key={`blank-${index}`} aria-hidden="true" />;
          const key = toLocalKey(new Date(year, month, day));
          const weekday = (leading + day - 1) % 7 + 1;
          const planned = habit.daysOfWeek.includes(weekday);
          const complete = habit.completedDates.includes(key);
          const future = key > today;
          const beforeCreation = created !== null && key < created;
          // Un día de descanso no se marca, pero uno ya marcado se puede desmarcar.
          const locked = future || beforeCreation || (!planned && !complete);
          const label = new Date(year, month, day).toLocaleDateString("es", { day: "numeric", month: "long" });
          const state = complete ? (quit ? "lo evité" : "hecho") : future ? "aún no" : beforeCreation ? "antes de crear el hábito" : !planned ? "descanso" : "pendiente";
          return (
            <button key={key} type="button" disabled={locked} aria-pressed={complete} aria-label={`${label}: ${state}`} onClick={() => onToggleDay(key, !complete)} className="flex h-11 items-center justify-center disabled:opacity-40">
              <span className={`num flex h-[30px] w-[30px] items-center justify-center rounded-full border-[3px] text-[13px] transition-[background-color,transform] duration-150 ease-out ${key === today ? "font-bold" : "font-medium"} ${locked ? "" : "active:scale-75"}`} style={{ borderColor: planned ? habit.color : "var(--color-line-strong)", borderStyle: planned ? "solid" : "dashed", background: complete ? habit.color : "var(--color-card)", color: complete ? "var(--color-night)" : "var(--color-ink)" }}>{day}</span>
            </button>
          );
        })}
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
    { label: "Cumplimiento", value: stats.scheduledDays > 0 ? percent(stats.completionRate) : "–", unit: stats.scheduledDays > 0 ? `${stats.completedDays}/${stats.scheduledDays}` : "" },
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
        <div key={index} className="rounded-md bg-card px-4 pt-3 pb-4" aria-hidden="true">
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
