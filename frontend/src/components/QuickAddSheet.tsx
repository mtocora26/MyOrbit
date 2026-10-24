import { useEffect, useRef, useState } from "react";
import { BottomSheet, CategoryPicker, PriorityDot } from "./shared";
import { IconPencil, IconCalendar, IconHabit, IconBell, IconClock } from "./icons";
import { createTask, type TaskPriority, type TaskTag } from "../services/tasksApi";
import { todayInputValue, tomorrowInputValue, toTaskDue } from "../services/taskDue";
import { createHabit } from "../services/habitsApi";
import { createCategory, fetchCategories, type Category } from "../services/categoriesApi";

interface Props { open: boolean; onClose: () => void; onTaskCreated: () => void; onHabitCreated: () => void; }

type Mode = "tarea" | "evento" | "hábito" | "recordatorio";

// Etiquetas cortas: en 360 px caben cuatro modos en una sola fila.
const MODES: { id: Mode; icon: React.ReactNode; label: string; placeholder: string; color: string; bg: string; ready: boolean }[] = [
  { id: "tarea",        icon: <IconPencil size={18} />,   label: "Tarea",  placeholder: "Nueva tarea",  color: "var(--color-coral-ink)",  bg: "var(--color-coral-wash)",  ready: true },
  { id: "evento",       icon: <IconCalendar size={18} />, label: "Evento", placeholder: "Nuevo evento", color: "var(--color-blue-ink)",   bg: "var(--color-blue-wash)",   ready: false },
  { id: "hábito",       icon: <IconHabit size={18} />,    label: "Hábito", placeholder: "Nuevo hábito", color: "var(--color-violet-ink)", bg: "var(--color-violet-wash)", ready: true },
  { id: "recordatorio", icon: <IconBell size={18} />,     label: "Aviso",  placeholder: "Nuevo aviso",  color: "var(--color-amber-ink)",  bg: "var(--color-amber-wash)",  ready: false },
];

const PRIORITIES: { id: TaskPriority; label: string }[] = [
  { id: "alta", label: "Alta" },
  { id: "media", label: "Media" },
  { id: "baja", label: "Baja" },
];

const chip = "flex h-10 flex-shrink-0 items-center gap-1.5 rounded-md border px-3 text-[14px] font-semibold";
const chipOn = "border-ink bg-wash text-ink";
const chipOff = "border-line text-ink-2";

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
  const canSubmit = active.ready && !!name.trim() && !saving;

  function closeSheet() {
    setError(null);
    onClose();
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

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
      setError(err instanceof Error ? err.message : `No fue posible crear: ${active.label.toLowerCase()}`);
    } finally {
      setSaving(false);
    }
  }

  const today = todayInputValue();
  const tomorrow = tomorrowInputValue();
  const customDate = date !== today && date !== tomorrow;

  return (
    <BottomSheet open={open} onClose={closeSheet}>
      <form onSubmit={handleCreate} className="flex flex-col gap-3">
        <div role="radiogroup" aria-label="Qué añadir" className="grid grid-cols-4 gap-1.5">
          {MODES.map((m) => {
            const selected = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => { setMode(m.id); setError(null); }}
                className="flex h-11 items-center justify-center gap-1.5 rounded-md text-[14px] font-semibold"
                style={{
                  background: selected ? m.bg : "transparent",
                  color: selected ? m.color : "var(--color-ink-3)",
                  boxShadow: selected ? `inset 0 0 0 1.5px color-mix(in srgb, ${m.color} 50%, transparent)` : "inset 0 0 0 1px var(--color-line)",
                }}
              >
                {m.icon}
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Campo y envío en una sola fila: el pulgar llega a los dos sin soltar el teclado. */}
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={active.placeholder}
            aria-label={active.placeholder}
            enterKeyHint="done"
            autoComplete="off"
            className="h-12 min-w-0 flex-1 rounded-md border border-line bg-paper px-3.5 text-[16px] text-ink outline-none focus:border-coral"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            aria-label={saving ? "Creando" : `Crear ${active.label.toLowerCase()}`}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-coral text-night disabled:bg-wash disabled:text-ink-3"
          >
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
            )}
          </button>
        </div>

        {!active.ready && <p className="text-[14px] text-ink-2">Próximamente. Por ahora puedes crear tareas y hábitos.</p>}

        {mode === "tarea" && (
          <>
            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5" role="group" aria-label="Fecha y hora límite">
              <button type="button" aria-pressed={date === today} onClick={() => setDate(today)} className={`${chip} ${date === today ? chipOn : chipOff}`}>Hoy</button>
              <button type="button" aria-pressed={date === tomorrow} onClick={() => setDate(tomorrow)} className={`${chip} ${date === tomorrow ? chipOn : chipOff}`}>Mañana</button>
              <PickerChip type="date" value={date} onChange={setDate} label="Elegir fecha" selected={customDate} icon={<IconCalendar size={16} />} text={customDate ? formatShortDate(date) : "Otra"} />
              <PickerChip type="time" value={time} onChange={setTime} label="Hora límite" selected={false} icon={<IconClock size={16} />} text={formatTime(time)} />
            </div>

            <div role="radiogroup" aria-label="Prioridad" className="grid grid-cols-3 gap-2">
              {PRIORITIES.map((p) => {
                const selected = priority === p.id;
                return (
                  <button key={p.id} type="button" role="radio" aria-checked={selected} onClick={() => setPriority(p.id)} className={`${chip} justify-center ${selected ? chipOn : chipOff}`}>
                    <PriorityDot level={p.id} />
                    {p.label}
                  </button>
                );
              })}
            </div>

            <CategoryPicker variant="chips" categories={categories} value={tag} onChange={setTag} onCreate={handleCreateCategory} />
          </>
        )}

        {error && <p role="alert" className="text-[14px] font-semibold text-danger">{error}</p>}
      </form>
    </BottomSheet>
  );
}

/** Chip que abre el selector nativo de fecha u hora: el input transparente cubre el chip entero. */
function PickerChip({ type, value, onChange, label, selected, icon, text }: { type: "date" | "time"; value: string; onChange: (v: string) => void; label: string; selected: boolean; icon: React.ReactNode; text: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <label className={`${chip} relative ${selected ? chipOn : chipOff}`}>
      {icon}
      <span className="num">{text}</span>
      <input
        ref={ref}
        type={type}
        value={value}
        aria-label={label}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        onClick={() => { try { ref.current?.showPicker(); } catch { /* el navegador abre el selector solo */ } }}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </label>
  );
}

function formatShortDate(value: string): string {
  return new Date(`${value}T00:00`).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

function formatTime(value: string): string {
  return new Date(`2000-01-01T${value || "23:59"}`).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
}
