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
  { id: "tarea",         icon: <IconPencil size={18} />,   label: "Tarea",         color: "#FF6B4A", bg: "#FFF0EC" },
  { id: "evento",        icon: <IconCalendar size={18} />, label: "Evento",        color: "#2E90FA", bg: "#EFF8FF" },
  { id: "hábito",        icon: <IconHabit size={18} />,    label: "Hábito",        color: "#7A5AF8", bg: "#F4F3FF" },
  { id: "recordatorio",  icon: <IconBell size={18} />,     label: "Recordatorio",  color: "#F79009", bg: "#FFFAEB" },
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
        await createHabit({ title: name.trim(), frequency: "diaria", daysOfWeek: [1, 2, 3, 4, 5, 6, 7], color: "#7A5AF8", icon: "target" });
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
            className="flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-2xl transition-all text-[11px] font-semibold"
            style={{
              background: mode === m.id ? m.bg : "#F7F8FA",
              color: mode === m.id ? m.color : "#94A3B8",
              boxShadow: mode === m.id ? `0 0 0 1.5px ${m.color}50` : "none",
            }}
          >
            <div style={{ color: mode === m.id ? m.color : "#94A3B8" }}>{m.icon}</div>
            {m.label}
          </button>
        ))}
      </div>

      <InputField placeholder={`Nombre de la ${mode}...`} value={name} onChange={setName} />

      {mode === "tarea" && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Fecha límite" className="rounded-xl border border-[#E4E7EC] bg-[#F7F8FA] px-3 py-3 text-[13px] text-[#172033] outline-none" />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Hora límite" className="rounded-xl border border-[#E4E7EC] bg-[#F7F8FA] px-3 py-3 text-[13px] text-[#172033] outline-none" />
          <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="col-span-2 rounded-xl border border-[#E4E7EC] bg-[#F7F8FA] px-3 py-3 text-[13px] text-[#172033] outline-none">
            <option value="alta">Prioridad alta</option>
            <option value="media">Prioridad media</option>
            <option value="baja">Prioridad baja</option>
          </select>
          <CategoryPicker categories={categories} value={tag} onChange={setTag} onCreate={handleCreateCategory} className="col-span-2" />
        </div>
      )}

      {error && <p className="mt-3 text-[12px] font-semibold text-[#B42318]">{error}</p>}

      <button
        onClick={handleCreate}
        disabled={!name.trim() || saving}
        className="mt-4 w-full py-3.5 rounded-2xl text-[15px] font-bold text-white transition-all active:scale-[0.98]"
        style={{
          background: name.trim() && !saving ? active.color : "#E4E7EC",
          color: name.trim() && !saving ? "white" : "#94A3B8",
          boxShadow: name.trim() && !saving ? `0 6px 20px ${active.color}50` : "none",
        }}
      >
        {saving ? "Creando..." : `Crear ${mode}`}
      </button>
    </BottomSheet>
  );
}
