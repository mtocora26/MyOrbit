import { useEffect, useMemo, useRef, useState } from "react";
import { ProgressBar, ScreenHeader } from "../components/shared";
import { IconBook, IconMeditate, IconNoPhone, IconPencil, IconReadingBook, IconRun, IconTarget } from "../components/icons";
import { createHabit, currentStreak, deleteHabit, fetchHabitStats, fetchHabits, toLocalKey, todayKey, updateHabit, updateHabitCompletion, type Habit, type HabitStats } from "../services/habitsApi";

interface Props { onBack: () => void; refreshTick: number; }

const DAYS = ["L", "M", "X", "J", "V", "S", "D"];
const STATS_WINDOWS = [7, 30, 90] as const;
const COLORS = ["#7A5AF8", "#FF6B4A", "#2E90FA", "#12B76A", "#F79009"];
const ICONS = { book: IconBook, run: IconRun, reading: IconReadingBook, meditate: IconMeditate, phone: IconNoPhone, target: IconTarget };

export default function HabitsScreen({ onBack, refreshTick }: Props) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  // Id del hábito en edición; null = el formulario crea uno nuevo.
  const [editingId, setEditingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [statsWindow, setStatsWindow] = useState<(typeof STATS_WINDOWS)[number]>(30);
  const [stats, setStats] = useState<Record<string, HabitStats>>({});
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState<"diaria" | "personalizada">("diaria");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState<keyof typeof ICONS>("target");

  async function loadHabits() {
    try {
      setLoading(true);
      setError(null);
      setHabits(await fetchHabits());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar los habitos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadHabits(); }, [refreshTick]);

  // Las estadísticas dependen del historial y del horario de cada hábito: se recalculan cuando cambian o cambia la ventana.
  const statsKey = habits.map((habit) => `${habit.id}:${habit.frequency}:${habit.daysOfWeek.join("")}:${habit.completedDates.length}:${habit.completedDates.at(-1) ?? ""}`).join("|");
  useEffect(() => {
    let cancelled = false;
    Promise.allSettled(habits.map((habit) => fetchHabitStats(habit.id, statsWindow).then((value) => [habit.id, value] as const))).then((results) => {
      if (cancelled) return;
      setStats(Object.fromEntries(results.flatMap((result) => result.status === "fulfilled" ? [result.value] : [])));
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsKey, statsWindow]);

  const doneToday = habits.filter((habit) => habit.completedDates.includes(todayKey())).length;
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
      const input = { title: title.trim(), frequency, daysOfWeek: frequency === "diaria" ? [1, 2, 3, 4, 5, 6, 7] : daysOfWeek, color, icon };
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

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto no-scrollbar px-4 pt-3 pb-8 flex flex-col gap-4 lg:px-8 lg:pt-6 lg:max-w-[760px]">
        <div className="rounded-md border border-line bg-card p-4">
          <p className="num text-[44px] font-semibold leading-none text-ink">{doneToday}<span className="text-[24px] text-ink-3">/{habits.length}</span> <span className="text-[16px] font-medium text-ink-2">hábitos hoy</span></p>
          <div className="mt-3"><ProgressBar value={completion} height={4} /></div>
          {habits.length > 0 && (
            <div className="mt-4 flex items-center justify-between gap-3">
              <span id="stats-window-label" className="text-[13px] font-semibold text-ink-2">Estadísticas de los últimos</span>
              <div role="radiogroup" aria-labelledby="stats-window-label" className="flex rounded-md bg-wash p-1">
                {STATS_WINDOWS.map((days) => (
                  <button key={days} type="button" role="radio" aria-checked={statsWindow === days} onClick={() => setStatsWindow(days)} className="num min-h-[36px] rounded-[4px] px-3 text-[14px] font-semibold" style={{ background: statsWindow === days ? "var(--color-card)" : "transparent", color: statsWindow === days ? "var(--color-ink)" : "var(--color-ink-2)" }}>{days} d</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {creating && <form onSubmit={submitHabit} className="rounded-lg bg-card p-4 flex flex-col gap-3">{editingId && <p className="text-[13px] font-semibold text-ink-2">Editando hábito · tu historial de cumplimiento se conserva</p>}<input autoFocus aria-label="Nombre del hábito" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej. Leer 20 minutos" className="rounded-md border border-line bg-paper px-3 py-2.5 text-[14px] outline-none focus:border-violet" /><div className="flex rounded-md bg-wash p-1"><button type="button" onClick={() => { setFrequency("diaria"); setDaysOfWeek([1, 2, 3, 4, 5, 6, 7]); }} className="flex-1 rounded-lg py-2 text-[13px] font-bold" style={{ background: frequency === "diaria" ? "var(--color-card)" : "transparent" }}>Diario</button><button type="button" onClick={() => setFrequency("personalizada")} className="flex-1 rounded-lg py-2 text-[13px] font-bold" style={{ background: frequency === "personalizada" ? "var(--color-card)" : "transparent" }}>Días</button></div>{frequency === "personalizada" && <div className="flex justify-between">{DAYS.map((day, index) => <button key={day} type="button" onClick={() => toggleDay(index + 1)} className="h-8 w-8 rounded-full text-[13px] font-bold" style={{ background: daysOfWeek.includes(index + 1) ? color : "var(--color-wash)", color: daysOfWeek.includes(index + 1) ? "white" : "var(--color-ink-2)" }}>{day}</button>)}</div>}<div className="flex items-center justify-between"><div className="flex gap-2">{(COLORS.includes(color) ? COLORS : [...COLORS, color]).map((option) => <button key={option} type="button" aria-label={`Color ${option}`} onClick={() => setColor(option)} className="h-6 w-6 rounded-full border-2" style={{ background: option, borderColor: color === option ? "var(--color-night)" : "transparent" }} />)}</div><select value={icon} onChange={(event) => setIcon(event.target.value as keyof typeof ICONS)} className="rounded-md border border-line bg-paper px-2 py-1.5 text-[13px]"><option value="target">Meta</option><option value="book">Estudio</option><option value="run">Ejercicio</option><option value="reading">Lectura</option><option value="meditate">Calma</option><option value="phone">Sin redes</option></select></div><div className="flex gap-2"><button type="button" onClick={resetForm} className="rounded-md bg-wash px-3 py-2 text-[13px] font-bold text-ink-2">Cancelar</button><button disabled={!title.trim() || saving} className="rounded-md bg-violet px-3 py-2 text-[13px] font-bold text-white disabled:opacity-50">{saving ? (editingId ? "Guardando..." : "Creando...") : editingId ? "Guardar cambios" : "Crear hábito"}</button></div></form>}

        {error && <p className="text-[13px] font-semibold text-danger">{error}</p>}
        {loading ? <p className="text-[13px] text-ink-2">Cargando hábitos...</p> : habits.length === 0 ? <div className="rounded-md border border-dashed border-line-strong px-5 py-10 text-center"><p className="font-display text-[22px] font-semibold leading-none text-ink">Tu primera rutina empieza aquí</p><p className="mt-1 text-[13px] leading-relaxed text-ink-2">Crea un hábito pequeño y marca tu avance cada día.</p><button onClick={startCreate} className="mt-4 min-h-[44px] rounded-md bg-coral px-5 text-[15px] font-semibold text-night">Crear hábito</button></div> : habits.map((habit) => <HabitCard key={habit.id} habit={habit} weekDates={weekDates} saving={saving} stats={stats[habit.id]} windowDays={statsWindow} onToggle={() => toggleHabit(habit)} onEdit={() => startEdit(habit)} onDelete={() => removeHabit(habit.id)} />)}
      </div>
    </div>
  );
}

function HabitCard({ habit, weekDates, saving, stats, windowDays, onToggle, onEdit, onDelete }: { habit: Habit; weekDates: Date[]; saving: boolean; stats?: HabitStats; windowDays: number; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  const doneToday = habit.completedDates.includes(todayKey());
  const streak = stats?.currentStreak ?? currentStreak(habit.completedDates);
  return (
    <div className="rounded-md border border-line bg-card px-4 pt-3 pb-4">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 flex-shrink-0 rounded-[3px]" style={{ background: habit.color }} aria-hidden="true" />
        <p className="min-w-0 flex-1 truncate text-[17px] font-semibold text-ink">{habit.title}</p>
        <button onClick={onEdit} disabled={saving} title="Editar hábito" aria-label={`Editar hábito ${habit.title}`} className="flex h-11 w-11 items-center justify-center rounded-md text-ink-3 transition-colors active:bg-wash disabled:opacity-50">
          <IconPencil size={16} />
        </button>
        <button onClick={onDelete} disabled={saving} title="Eliminar hábito" aria-label={`Eliminar hábito ${habit.title}`} className="flex h-11 w-11 items-center justify-center rounded-md text-ink-3 transition-colors active:bg-wash disabled:opacity-50">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 7h12M9 7V5h6v2M9 10v7M12 10v7M15 10v7" /></svg>
        </button>
        <button
          onClick={onToggle}
          disabled={saving}
          role="checkbox"
          aria-checked={doneToday}
          aria-label={doneToday ? "Desmarcar hoy" : "Completar hoy"}
          className="-mr-2 flex h-11 w-11 items-center justify-center disabled:opacity-50"
        >
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-[3px] transition-[background-color,transform] duration-150 ease-out active:scale-75" style={{ borderColor: habit.color, background: doneToday ? habit.color : "var(--color-card)" }}>
            {doneToday && <svg width="11" height="9" viewBox="0 0 9 7" fill="none" aria-hidden="true"><path d="M1 3.5L3.5 6 8 1" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </span>
        </button>
      </div>
      <p className="mt-0.5 flex items-center gap-3 text-[14px] text-ink-2">
        <span>{habit.frequency === "diaria" ? "Diario" : "Personalizado"}</span>
      </p>
      <HabitStatsRow stats={stats} streak={streak} windowDays={windowDays} />
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

const percent = (value: number) => `${value.toLocaleString("es", { maximumFractionDigits: 1 })}%`;

/** Racha actual, mejor racha y cumplimiento: tablero de salidas, cifras condensadas sobre etiquetas pequeñas. */
function HabitStatsRow({ stats, streak, windowDays }: { stats?: HabitStats; streak: number; windowDays: number }) {
  const cells = [
    { label: "Racha", value: String(streak), unit: streak === 1 ? "día" : "días" },
    { label: "Mejor racha", value: stats ? String(stats.bestStreak) : "–", unit: stats ? (stats.bestStreak === 1 ? "día" : "días") : "" },
    { label: `Cumplimiento ${windowDays} d`, value: stats && stats.scheduledDays > 0 ? percent(stats.completionRate) : "–", unit: stats && stats.scheduledDays > 0 ? `${stats.completedDays}/${stats.scheduledDays}` : "" },
  ];
  const empty = stats && stats.bestStreak === 0 && stats.completedDays === 0;
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
      {empty && <p className="mt-2 text-[13px] text-ink-2">Marca tu primer día para empezar la racha.</p>}
    </div>
  );
}
