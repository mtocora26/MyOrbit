import { useEffect, useMemo, useState } from "react";
import { CategoryBadge, CategoryPicker, Checkbox, ProgressBar, EmptyState } from "../components/shared";
import { IconCalendar, IconChecklist } from "../components/icons";
import { createTask, deleteTask, fetchTasks, getSubtaskProgress, toUiTask, updateTask, updateTaskStatus, type UiTask } from "../services/tasksApi";
import { todayInputValue, toTaskDue, isOverdue } from "../services/taskDue";
import { createCategory, fetchCategories, type Category } from "../services/categoriesApi";

interface Props { onTaskTap: (taskId: string) => void; onFab: () => void; refreshTick: number; }

const PRIORITY_COLOR = { alta: "#FF6B4A", media: "#F79009", baja: "#12B76A" };
const STATUS_COLUMNS = [
  { id: "pendientes", label: "Pendientes" },
  { id: "completadas", label: "Completadas" },
] as const;

const WEEKDAY_HINTS = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];

function isTodayDue(due: string): boolean {
  return due.toLowerCase().includes("hoy");
}

function isThisWeekDue(due: string): boolean {
  const normalized = due.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.includes("hoy") || normalized.includes("mañana") || normalized.includes("manana")) {
    return true;
  }
  if (WEEKDAY_HINTS.some((day) => normalized.includes(day))) {
    return true;
  }

  const parsed = new Date(due);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const now = new Date();
  const startOfWeek = new Date(now);
  const day = now.getDay();
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  startOfWeek.setDate(now.getDate() + offsetToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  return parsed >= startOfWeek && parsed < endOfWeek;
}

export default function TasksScreen({ onTaskTap, refreshTick }: Props) {
  const [tasks, setTasks] = useState<UiTask[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(todayInputValue);
  const [newTime, setNewTime] = useState("23:59");
  const [newTag, setNewTag] = useState("Personal");
  const [filter, setFilter] = useState<"todas" | "hoy" | "semana">("todas");
  const [view, setView] = useState<"lista" | "tablero">("lista");
  const [groupBy, setGroupBy] = useState<"estado" | "categoria">("estado");

  const colorByCategory = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => map.set(category.name, category.color));
    return map;
  }, [categories]);

  async function loadTasks() {
    try {
      setLoading(true);
      setError(null);
      const apiTasks = await fetchTasks();
      setTasks(apiTasks.map(toUiTask));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado al cargar tareas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
    fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, [refreshTick]);

  const filteredTasks = useMemo(() => {
    if (filter === "hoy") {
      return tasks.filter((task) => isTodayDue(task.due));
    }
    if (filter === "semana") {
      return tasks.filter((task) => isThisWeekDue(task.due));
    }
    return tasks;
  }, [tasks, filter]);

  async function handleToggleTask(task: UiTask) {
    const previousTasks = tasks;
    const optimistic = tasks.map((item) => item.id === task.id ? { ...item, done: !item.done } : item);
    setTasks(optimistic);

    try {
      await updateTaskStatus(task.id, !task.done);
    } catch (err) {
      setTasks(previousTasks);
      setError(err instanceof Error ? err.message : "No fue posible actualizar la tarea");
    }
  }

  async function handleDeleteTask(taskId: string) {
    const previousTasks = tasks;
    setTasks(tasks.filter((task) => task.id !== taskId));

    try {
      await deleteTask(taskId);
    } catch (err) {
      setTasks(previousTasks);
      setError(err instanceof Error ? err.message : "No fue posible eliminar la tarea");
    }
  }

  async function handleRenameTask(task: UiTask, title: string) {
    const trimmed = title.trim();
    if (!trimmed || trimmed === task.label) return;
    const previousTasks = tasks;
    setTasks(tasks.map((item) => item.id === task.id ? { ...item, label: trimmed } : item));

    try {
      await updateTask(task.id, { title: trimmed, due: task.rawDue, priority: task.priority, tag: task.tag });
    } catch (err) {
      setTasks(previousTasks);
      setError(err instanceof Error ? err.message : "No fue posible renombrar la tarea");
    }
  }

  async function handleCreateCategory(name: string, color: string) {
    const category = await createCategory(name, color);
    setCategories((current) => [...current, category]);
    setNewTag(category.name);
  }

  async function handleCreateTask() {
    const title = newTitle.trim();
    if (!title || saving) return;

    try {
      setSaving(true);
      setError(null);
      await createTask({
        title,
        due: toTaskDue(newDate, newTime),
        priority: "media",
        tag: newTag,
      });
      setNewTitle("");
      setNewDate(todayInputValue());
      setNewTime("23:59");
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible crear la tarea");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-full min-h-0 flex flex-col bg-[#F7F8FA]">
      <div className="px-5 pt-4 pb-0 bg-white flex-shrink-0" style={{ boxShadow: "0 1px 0 #F2F4F7" }}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-[20px] font-extrabold text-[#172033]">Tareas</h1>
          <button
            onClick={() => setView(view === "lista" ? "tablero" : "lista")}
            title={view === "lista" ? "Ver como tablero" : "Ver como lista"}
            className="w-9 h-9 rounded-full bg-[#F7F8FA] flex items-center justify-center"
          >
            {view === "lista" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#667085" strokeWidth="2" strokeLinecap="round">
                <path d="M4 6h16M4 12h10M4 18h6" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#667085" strokeWidth="2" strokeLinecap="round">
                <rect x="4" y="4" width="4" height="16" rx="1" /><rect x="10" y="4" width="4" height="10" rx="1" /><rect x="16" y="4" width="4" height="13" rx="1" />
              </svg>
            )}
          </button>
        </div>
        <div className="flex gap-2 pb-3">
          {(["todas", "hoy", "semana"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-bold transition-all"
              style={{ background: filter === f ? "#101828" : "#F2F4F7", color: filter === f ? "white" : "#667085" }}
            >
              {f === "todas" ? "Todas" : f === "hoy" ? "Hoy" : "Esta semana"}
            </button>
          ))}
          {view === "tablero" && (
            <button
              onClick={() => setGroupBy(groupBy === "estado" ? "categoria" : "estado")}
              className="ml-auto flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-bold bg-[#F4F3FF] text-[#7A5AF8]"
            >
              Agrupar: {groupBy === "estado" ? "Estado" : "Categoría"}
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 pb-3">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Nueva tarea"
            className="col-span-2 rounded-xl border border-[#E4E7EC] bg-[#F7F8FA] px-3 py-2 text-[13px] outline-none"
          />
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            aria-label="Fecha límite"
            className="min-w-0 rounded-xl border border-[#E4E7EC] bg-[#F7F8FA] px-3 py-2 text-[13px] outline-none"
          />
          <input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            aria-label="Hora límite"
            className="min-w-0 rounded-xl border border-[#E4E7EC] bg-[#F7F8FA] px-3 py-2 text-[13px] outline-none"
          />
          <CategoryPicker categories={categories} value={newTag} onChange={setNewTag} onCreate={handleCreateCategory} className="col-span-2" />
          <button
            onClick={handleCreateTask}
            disabled={saving || !newTitle.trim()}
            className="col-span-2 rounded-xl px-3 py-2 text-[12px] font-bold text-white disabled:opacity-50"
            style={{ background: "#FF6B4A" }}
          >
            {saving ? "Guardando" : "Agregar"}
          </button>
        </div>
        {error && (
          <p className="pb-3 text-[12px] font-semibold text-[#B42318]">{error}</p>
        )}
      </div>

      {loading ? (
        <p className="px-4 pt-4 text-[13px] text-[#667085]">Cargando tareas...</p>
      ) : filteredTasks.length === 0 ? (
        <div className="px-4 pt-4">
          <EmptyState icon="—" title="Sin tareas pendientes" sub="Crea una nueva tarea para seguir en órbita." action="Nueva tarea" />
        </div>
      ) : view === "lista" ? (
        <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-3 pb-24">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} categoryColor={colorByCategory.get(task.tag)} onTap={() => onTaskTap(task.id)} onToggle={() => handleToggleTask(task)} onDelete={() => handleDeleteTask(task.id)} onRename={(title) => handleRenameTask(task, title)} />
          ))}
        </div>
      ) : (
        <TasksBoard tasks={filteredTasks} categories={categories} colorByCategory={colorByCategory} groupBy={groupBy} onTaskTap={onTaskTap} onToggle={handleToggleTask} />
      )}
    </div>
  );
}

function TaskCard({ task, categoryColor, onTap, onToggle, onDelete, onRename }: { task: UiTask; categoryColor?: string; onTap: () => void; onToggle: () => void; onDelete: () => void; onRename: (title: string) => void }) {
  const overdue = !task.done && isOverdue(task.rawDue);
  const subtaskInfo = task.subtasks.length ? getSubtaskProgress(task.subtasks) : null;
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.label);

  function commitRename() {
    setRenaming(false);
    onRename(draftTitle);
  }

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: overdue ? "0 0 0 1.5px #FDA29B, 0 1px 4px rgba(16,24,40,0.07)" : "0 1px 4px rgba(16,24,40,0.07), 0 0 0 1px rgba(16,24,40,0.04)" }}
    >
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <Checkbox checked={task.done} onChange={onToggle} />
          <div className="flex-1 min-w-0 cursor-pointer" onClick={onTap}>
            {renaming ? (
              <input
                autoFocus
                value={draftTitle}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => setDraftTitle(event.target.value)}
                onBlur={commitRename}
                onKeyDown={(event) => { if (event.key === "Enter") commitRename(); if (event.key === "Escape") { setDraftTitle(task.label); setRenaming(false); } }}
                className="w-full rounded-lg border border-[#FF6B4A] bg-white px-2 py-1 text-[14px] font-bold text-[#172033] outline-none"
              />
            ) : (
              <p
                onClick={(event) => event.stopPropagation()}
                onDoubleClick={() => { setDraftTitle(task.label); setRenaming(true); }}
                title="Doble clic para renombrar"
                className={`text-[14px] font-bold leading-snug ${task.done ? "line-through text-[#D0D5DD]" : "text-[#172033]"}`}
              >
                {task.label}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <div className={`flex items-center gap-1 ${overdue ? "text-[#B42318] font-bold" : "text-[#94A3B8]"}`}>
                <IconCalendar size={11} color={overdue ? "#B42318" : "#94A3B8"} strokeWidth={2} />
                <span className="text-[11px]">{task.due}</span>
              </div>
              {overdue && <span className="rounded-full bg-[#FEF3F2] px-2 py-0.5 text-[10px] font-bold text-[#B42318]">Vencida</span>}
              <CategoryBadge name={task.tag} color={categoryColor} />
              {subtaskInfo && (
                <div className="flex items-center gap-1 rounded-full bg-[#F2F4F7] px-2 py-0.5 text-[#667085]">
                  <IconChecklist size={11} color="#667085" />
                  <span className="text-[10px] font-bold">{subtaskInfo.completed}/{subtaskInfo.total}</span>
                </div>
              )}
              <div className="w-2 h-2 rounded-full" style={{ background: PRIORITY_COLOR[task.priority] }} />
            </div>
          </div>
          <button
            onClick={onDelete}
            className="flex-shrink-0 w-7 h-7 rounded-full bg-[#F7F8FA] flex items-center justify-center"
            title="Eliminar tarea"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B42318" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 7h12M9 7V5h6v2M9 10v7M12 10v7M15 10v7" />
            </svg>
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <ProgressBar value={task.subtasks.length ? getSubtaskProgress(task.subtasks).percentage : task.done ? 100 : 0} color={PRIORITY_COLOR[task.priority]} height={4} />
          <span className="text-[11px] font-bold text-[#94A3B8] flex-shrink-0 tabular-nums">{task.subtasks.length ? `${getSubtaskProgress(task.subtasks).completed}/${getSubtaskProgress(task.subtasks).total}` : task.done ? "100%" : "0%"}</span>
        </div>
      </div>
    </div>
  );
}

function TasksBoard({ tasks, categories, colorByCategory, groupBy, onTaskTap, onToggle }: { tasks: UiTask[]; categories: Category[]; colorByCategory: Map<string, string>; groupBy: "estado" | "categoria"; onTaskTap: (taskId: string) => void; onToggle: (task: UiTask) => void }) {
  const columns = useMemo(() => {
    if (groupBy === "estado") {
      return STATUS_COLUMNS.map((column) => ({
        id: column.id,
        label: column.label,
        color: column.id === "completadas" ? "#12B76A" : "#FF6B4A",
        tasks: tasks.filter((task) => (column.id === "completadas") === task.done),
      }));
    }
    const names = categories.length ? categories.map((category) => category.name) : Array.from(new Set(tasks.map((task) => task.tag)));
    return names.map((name) => ({
      id: name,
      label: name,
      color: colorByCategory.get(name) ?? "#667085",
      tasks: tasks.filter((task) => task.tag === name),
    }));
  }, [tasks, categories, colorByCategory, groupBy]);

  return (
    <div className="min-h-0 flex-1 overflow-x-auto no-scrollbar px-4 py-4">
      <div className="flex h-full gap-3 pb-24" style={{ minWidth: "max-content" }}>
        {columns.map((column) => (
          <div key={column.id} className="flex w-64 flex-shrink-0 flex-col rounded-2xl bg-[#F2F4F7]/60 p-2">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: column.color }} />
              <p className="text-[12px] font-bold text-[#344054]">{column.label}</p>
              <span className="ml-auto text-[11px] font-bold text-[#98A2B3]">{column.tasks.length}</span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto no-scrollbar px-1 pb-2">
              {column.tasks.length === 0 ? (
                <p className="px-2 py-3 text-[11px] text-[#98A2B3]">Sin tareas aquí</p>
              ) : column.tasks.map((task) => {
                const overdue = !task.done && isOverdue(task.rawDue);
                const subtaskInfo = task.subtasks.length ? getSubtaskProgress(task.subtasks) : null;
                return (
                  <div
                    key={task.id}
                    onClick={() => onTaskTap(task.id)}
                    className="cursor-pointer rounded-xl bg-white p-3"
                    style={{ boxShadow: overdue ? "0 0 0 1.5px #FDA29B" : "0 1px 3px rgba(16,24,40,0.08)" }}
                  >
                    <div className="flex items-start gap-2">
                      <Checkbox checked={task.done} onChange={() => onToggle(task)} />
                      <p className={`min-w-0 flex-1 text-[12.5px] font-semibold leading-snug ${task.done ? "text-[#D0D5DD] line-through" : "text-[#172033]"}`}>{task.label}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <CategoryBadge name={task.tag} color={colorByCategory.get(task.tag)} />
                      {overdue && <span className="rounded-full bg-[#FEF3F2] px-1.5 py-0.5 text-[9px] font-bold text-[#B42318]">Vencida</span>}
                      {subtaskInfo && <span className="text-[10px] font-bold text-[#667085]">{subtaskInfo.completed}/{subtaskInfo.total}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
