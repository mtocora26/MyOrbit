import { useEffect, useMemo, useState } from "react";
import { ProgressRing } from "../components/shared";
import { IconBook, IconFlame, IconMeditate, IconNoPhone, IconReadingBook, IconRepeat, IconRun, IconTarget } from "../components/icons";
import { createHabit, currentStreak, deleteHabit, fetchHabits, toLocalKey, todayKey, updateHabitCompletion, type Habit } from "../services/habitsApi";

interface Props { onBack: () => void; refreshTick: number; }

const DAYS = ["L", "M", "X", "J", "V", "S", "D"];
const COLORS = ["#7A5AF8", "#FF6B4A", "#2E90FA", "#12B76A", "#F79009"];
const ICONS = { book: IconBook, run: IconRun, reading: IconReadingBook, meditate: IconMeditate, phone: IconNoPhone, target: IconTarget };

export default function HabitsScreen({ onBack, refreshTick }: Props) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
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
      const habit = await createHabit({ title: title.trim(), frequency, daysOfWeek, color, icon });
      setHabits([...habits, habit]);
      setTitle("");
      setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible crear el habito");
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible eliminar el habito");
    } finally {
      setSaving(false);
    }
  }

  function toggleDay(day: number) {
    setDaysOfWeek((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort());
  }

  return (
    <div className="h-full min-h-0 flex flex-col bg-[#F7F8FA]">
      <div className="flex items-center justify-between px-5 py-4 bg-white"><div className="flex items-center gap-3"><button onClick={onBack} className="w-9 h-9 rounded-full bg-[#F2F4F7] text-[22px] text-[#172033]">‹</button><div><h1 className="text-[18px] font-bold text-[#172033]">Hábitos</h1><p className="text-[12px] text-[#667085]">Tu constancia, un día a la vez</p></div></div><button onClick={() => setCreating(!creating)} title="Crear hábito" className="w-9 h-9 rounded-full bg-[#F4F3FF] text-[22px] font-semibold text-[#7A5AF8]">+</button></div>

      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar px-4 pt-3 pb-8 flex flex-col gap-4">
        <div className="relative overflow-hidden rounded-3xl p-5" style={{ background: "linear-gradient(150deg, #101828 0%, #1D3461 100%)" }}>
          <div className="flex items-center gap-4 relative z-10"><ProgressRing value={completion} size={76} stroke={6} color="#FF6B4A" trackColor="rgba(255,255,255,0.12)"><div className="text-center"><span className="text-[16px] font-extrabold text-white block leading-none">{doneToday}</span><span className="text-[10px] text-[#94A3BF]">/{habits.length}</span></div></ProgressRing><div><p className="text-[12px] text-[#94A3BF] font-medium">Completados hoy</p><p className="text-[22px] font-extrabold text-white">{completion}%</p><p className="text-[12px] text-[#94A3BF] mt-0.5">de tus hábitos activos</p></div></div>
        </div>

        {creating && <form onSubmit={submitHabit} className="rounded-2xl bg-white p-4 flex flex-col gap-3" style={{ boxShadow: "0 1px 4px rgba(16,24,40,0.07), 0 0 0 1px rgba(16,24,40,0.04)" }}><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej. Leer 20 minutos" className="rounded-xl border border-[#E4E7EC] bg-[#F7F8FA] px-3 py-2.5 text-[14px] outline-none focus:border-[#7A5AF8]" /><div className="flex rounded-xl bg-[#F2F4F7] p-1"><button type="button" onClick={() => { setFrequency("diaria"); setDaysOfWeek([1, 2, 3, 4, 5, 6, 7]); }} className="flex-1 rounded-lg py-2 text-[12px] font-bold" style={{ background: frequency === "diaria" ? "white" : "transparent" }}>Diario</button><button type="button" onClick={() => setFrequency("personalizada")} className="flex-1 rounded-lg py-2 text-[12px] font-bold" style={{ background: frequency === "personalizada" ? "white" : "transparent" }}>Días</button></div>{frequency === "personalizada" && <div className="flex justify-between">{DAYS.map((day, index) => <button key={day} type="button" onClick={() => toggleDay(index + 1)} className="h-8 w-8 rounded-full text-[12px] font-bold" style={{ background: daysOfWeek.includes(index + 1) ? color : "#F2F4F7", color: daysOfWeek.includes(index + 1) ? "white" : "#667085" }}>{day}</button>)}</div>}<div className="flex items-center justify-between"><div className="flex gap-2">{COLORS.map((option) => <button key={option} type="button" onClick={() => setColor(option)} className="h-6 w-6 rounded-full border-2" style={{ background: option, borderColor: color === option ? "#101828" : "transparent" }} />)}</div><select value={icon} onChange={(event) => setIcon(event.target.value as keyof typeof ICONS)} className="rounded-xl border border-[#E4E7EC] bg-[#F7F8FA] px-2 py-1.5 text-[12px]"><option value="target">Meta</option><option value="book">Estudio</option><option value="run">Ejercicio</option><option value="reading">Lectura</option><option value="meditate">Calma</option><option value="phone">Sin redes</option></select></div><div className="flex gap-2"><button type="button" onClick={() => setCreating(false)} className="rounded-xl bg-[#F2F4F7] px-3 py-2 text-[12px] font-bold text-[#667085]">Cancelar</button><button disabled={!title.trim() || saving} className="rounded-xl bg-[#7A5AF8] px-3 py-2 text-[12px] font-bold text-white disabled:opacity-50">{saving ? "Creando..." : "Crear hábito"}</button></div></form>}

        {error && <p className="text-[12px] font-semibold text-[#B42318]">{error}</p>}
        {loading ? <p className="text-[13px] text-[#667085]">Cargando hábitos...</p> : habits.length === 0 ? <div className="rounded-2xl border border-dashed border-[#D0D5DD] px-5 py-10 text-center"><div className="mx-auto w-11 h-11 rounded-2xl bg-[#F4F3FF] flex items-center justify-center"><IconTarget size={21} color="#7A5AF8" /></div><p className="mt-3 text-[15px] font-bold text-[#172033]">Tu primera rutina empieza aquí</p><p className="mt-1 text-[13px] leading-relaxed text-[#667085]">Crea un hábito pequeño y marca tu avance cada día.</p><button onClick={() => setCreating(true)} className="mt-4 text-[13px] font-bold text-[#7A5AF8]">Crear hábito</button></div> : habits.map((habit) => <HabitCard key={habit.id} habit={habit} weekDates={weekDates} saving={saving} onToggle={() => toggleHabit(habit)} onDelete={() => removeHabit(habit.id)} />)}
      </div>
    </div>
  );
}

function HabitCard({ habit, weekDates, saving, onToggle, onDelete }: { habit: Habit; weekDates: Date[]; saving: boolean; onToggle: () => void; onDelete: () => void }) {
  const Icon = ICONS[habit.icon as keyof typeof ICONS] ?? IconTarget;
  const doneToday = habit.completedDates.includes(todayKey());
  const streak = currentStreak(habit.completedDates);
  return <div className="rounded-2xl bg-white p-4" style={{ boxShadow: "0 1px 4px rgba(16,24,40,0.07), 0 0 0 1px rgba(16,24,40,0.04)" }}><div className="flex items-start gap-3.5"><div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${habit.color}18`, color: habit.color }}><Icon size={20} /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="text-[14px] font-bold text-[#172033] truncate">{habit.title}</p><button onClick={onToggle} disabled={saving} title={doneToday ? "Desmarcar hoy" : "Completar hoy"} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-50" style={{ background: doneToday ? habit.color : "#F2F4F7" }}>{doneToday ? <span className="text-white text-[15px]">✓</span> : <span className="w-3 h-3 rounded-full border-2 border-[#D0D5DD]" />}</button></div><div className="mt-1.5 flex items-center gap-3"><div className="flex items-center gap-1 text-[#94A3B8]"><IconRepeat size={12} color="#94A3B8" /><span className="text-[11px]">{habit.frequency === "diaria" ? "Diario" : "Personalizado"}</span></div><div className="flex items-center gap-1"><IconFlame size={12} color={habit.color} /><span className="text-[11px] font-bold" style={{ color: habit.color }}>{streak} días</span></div><button onClick={onDelete} disabled={saving} title="Eliminar hábito" className="ml-auto text-[16px] text-[#B42318] disabled:opacity-50">×</button></div><div className="mt-3 flex justify-between">{weekDates.map((date, index) => { const key = toLocalKey(date); const planned = habit.daysOfWeek.includes(index + 1); const complete = habit.completedDates.includes(key); return <div key={key} className="flex flex-col items-center gap-1"><div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: complete ? habit.color : planned ? "#F2F4F7" : "transparent", border: planned && !complete ? "1px solid #E4E7EC" : "none" }}>{complete && <span className="text-[10px] text-white">✓</span>}</div><span className="text-[9px] font-medium text-[#98A2B3]">{DAYS[index]}</span></div>; })}</div></div></div></div>;
}
