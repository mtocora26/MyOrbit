import { useEffect, useState } from "react";
import { BottomSheet, CategoryPicker, InputField } from "./shared";
import { IconPencil, IconCalendar, IconHabit, IconBell } from "./icons";
import { createTask, type TaskPriority, type TaskTag } from "../services/tasksApi";
import { todayInputValue, toTaskDue } from "../services/taskDue";
import { createHabit } from "../services/habitsApi";
import { createCategory, fetchCategories, type Category } from "../services/categoriesApi";

interface Props { open: boolean; onClose: () => void; onTaskCreated: () => void; onHabitCreated: () => void; }

type Mode = "tarea" | "evento" | "hábito" | "recordatorio";

const MODES: { id: Mode; icon: React.ReactNode; label: string; color: string; bg: string }[] = [
  { id: "tarea",         icon: <IconPencil size={18} />,   label: "Tarea",         color: "var(--color-coral-ink)", bg: "var(--color-coral-wash)" },
  { id: "evento",        icon: <IconCalendar size={18} />, label: "Evento",        color: "var(--color-blue-ink)", bg: "var(--color-blue-wash)" },
  { id: "hábito",        icon: <IconHabit size={18} />,    label: "Hábito",        color: "var(--color-violet-ink)", bg: "var(--color-violet-wash)" },
  { id: "recordatorio",  icon: <IconBell size={18} />,     label: "Recordatorio",  color: "var(--color-amber-ink)", bg: "var(--color-amber-wash)" },
];

export default function QuickAddSheet({ open, onClose, onTaskCreated, onHabitCreated }: Props) {
  const [mode, setMode] = useState<Mode>("tarea");
  const [name, setName] = useState("");
  const [date, setDate] = useState(todayInputValue);
  const [time, setTime] = useState("23:59");
  const [priority, setPriority] = useState<TaskPriority>("media");
  const [tag, setTag] = useState<TaskTag>("Personal");
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, [open]);

  async function handleCreateCategory(name: string, color: string) {
    const category = await createCategory(name, color);
    setCategories((current) => [...current, category]);
    setTag(category.name);
  }

  const active = MODES.find((m) => m.id === mode)!;

  function closeSheet() {
    setError(null);
    onClose();
  }

  async function handleCreate() {
    if (mode !== "tarea" && mode !== "hábito") {
      setError(`La API para ${mode}s aun no esta disponible.`);
      return;
    }
    if (!name.trim() || saving) return;

    try {
      setSaving(true);
      setError(null);
      if (mode === "tarea") {
        await createTask({ title: name.trim(), due: toTaskDue(date, time), priority, tag });
        onTaskCreated();
      } else {
        await createHabit({ title: name.trim(), frequency: "diaria", daysOfWeek: [1, 2, 3, 4, 5, 6, 7], color: "var(--color-violet-ink)", icon: "target" });
        onHabitCreated();
      }
      setName("");
      setDate(todayInputValue());
      setTime("23:59");
      setPriority("media");
      setTag("Personal");
      closeSheet();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible crear la tarea");
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={closeSheet}>
      {/* Mode tabs */}
      <div className="flex gap-2 mb-5">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className="flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-lg transition-all text-[13px] font-semibold"
            style={{
              background: mode === m.id ? m.bg : "var(--color-paper)",
              color: mode === m.id ? m.color : "var(--color-ink-3)",
              boxShadow: mode === m.id ? `0 0 0 1.5px color-mix(in srgb, ${m.color} 50%, transparent)` : "none",
            }}
          >
            <div style={{ color: mode === m.id ? m.color : "var(--color-ink-3)" }}>{m.icon}</div>
            {m.label}
          </button>
        ))}
      </div>

      <InputField autoFocus placeholder={`Nombre de la ${mode}...`} value={name} onChange={setName} />

      {mode === "tarea" && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Fecha límite" className="rounded-md border border-line bg-paper px-3 py-3 text-[13px] text-ink outline-none" />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Hora límite" className="rounded-md border border-line bg-paper px-3 py-3 text-[13px] text-ink outline-none" />
          <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="col-span-2 rounded-md border border-line bg-paper px-3 py-3 text-[13px] text-ink outline-none">
            <option value="alta">Prioridad alta</option>
            <option value="media">Prioridad media</option>
            <option value="baja">Prioridad baja</option>
          </select>
          <CategoryPicker categories={categories} value={tag} onChange={setTag} onCreate={handleCreateCategory} className="col-span-2" />
        </div>
      )}

      {error && <p className="mt-3 text-[13px] font-semibold text-danger">{error}</p>}

      <button
        onClick={handleCreate}
        disabled={!name.trim() || saving}
        className="mt-4 w-full py-3.5 rounded-lg text-[15px] font-bold text-white transition-all active:scale-[0.98]"
        style={{
          background: name.trim() && !saving ? active.color : "var(--color-line)",
          color: name.trim() && !saving ? "white" : "var(--color-ink-3)",
                  }}
      >
        {saving ? "Creando..." : `Crear ${mode}`}
      </button>
    </BottomSheet>
  );
}
