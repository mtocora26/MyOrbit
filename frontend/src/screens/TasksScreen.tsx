import { useEffect, useMemo, useState } from "react";
import { CategoryBadge, Checkbox, PriorityDot, ProgressBar, EmptyState, Station } from "../components/shared";
import { IconCalendar, IconChecklist } from "../components/icons";
import { deleteTask, fetchTasks, getSubtaskProgress, toUiTask, updateTask, updateTaskStatus, type UiTask } from "../services/tasksApi";
import { isOverdue } from "../services/taskDue";
import { fetchCategories, type Category } from "../services/categoriesApi";

interface Props { onTaskTap: (taskId: string) => void; onFab: () => void; refreshTick: number; }

const PRIORITY_COLOR = { alta: "var(--color-coral)", media: "var(--color-amber)", baja: "var(--color-green)" };
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

export default function TasksScreen({ onTaskTap, onFab, refreshTick }: Props) {
  const [tasks, setTasks] = useState<UiTask[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  return (
    <div className="h-full min-h-0 flex flex-col bg-paper">
      <div className="px-4 pt-3 pb-0 bg-paper flex-shrink-0 border-b border-line lg:px-8 lg:pt-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-[30px] font-semibold leading-none tracking-tight text-ink lg:text-[44px]">Tareas</h1>
          <button
            onClick={() => setView(view === "lista" ? "tablero" : "lista")}
            title={view === "lista" ? "Ver como tablero" : "Ver como lista"}
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-md active:bg-wash"
            aria-label="Cambiar vista"
          >
            {view === "lista" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-2)" strokeWidth="2" strokeLinecap="round">
                <path d="M4 6h16M4 12h10M4 18h6" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-2)" strokeWidth="2" strokeLinecap="round">
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
              aria-pressed={filter === f}
              className="flex-shrink-0 min-h-[40px] rounded-md px-4 text-[14px] font-semibold transition-colors duration-150"
              style={{ background: filter === f ? "var(--color-strong)" : "var(--color-wash)", color: filter === f ? "var(--color-on-strong)" : "var(--color-ink-2)" }}
            >
              {f === "todas" ? "Todas" : f === "hoy" ? "Hoy" : "Esta semana"}
            </button>
          ))}
          {view === "tablero" && (
            <button
              onClick={() => setGroupBy(groupBy === "estado" ? "categoria" : "estado")}
              className="ml-auto flex-shrink-0 min-h-[40px] rounded-md bg-wash px-4 text-[14px] font-semibold text-ink-2"
            >
              {groupBy === "estado" ? "Por estado" : "Por línea"}
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="pb-3 text-[14px] font-semibold text-danger">{error}</p>
        )}
      </div>

      {loading ? (
        <p className="px-4 pt-4 text-[13px] text-ink-2">Cargando tareas...</p>
      ) : filteredTasks.length === 0 ? (
        <div className="px-4 pt-4">
          <EmptyState icon="—" title="Sin tareas pendientes" sub="Crea una nueva tarea para seguir en órbita." action="Nueva tarea" onAction={onFab} />
        </div>
      ) : view === "lista" ? (
        <ol className="min-h-0 flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-24 lg:px-8 lg:max-w-[760px]">
          {filteredTasks.map((task, index) => (
            <TaskCard key={task.id} last={index === filteredTasks.length - 1} task={task} categoryColor={colorByCategory.get(task.tag)} onTap={() => onTaskTap(task.id)} onToggle={() => handleToggleTask(task)} onDelete={() => handleDeleteTask(task.id)} onRename={(title) => handleRenameTask(task, title)} />
          ))}
        </ol>
      ) : (
        <TasksBoard tasks={filteredTasks} categories={categories} colorByCategory={colorByCategory} groupBy={groupBy} onTaskTap={onTaskTap} onToggle={handleToggleTask} />
      )}
    </div>
  );
}

function TaskCard({ task, categoryColor, last, onTap, onToggle, onDelete, onRename }: { task: UiTask; categoryColor?: string; last: boolean; onTap: () => void; onToggle: () => void; onDelete: () => void; onRename: (title: string) => void }) {
  const overdue = !task.done && isOverdue(task.rawDue);
  const subtaskInfo = task.subtasks.length ? getSubtaskProgress(task.subtasks) : null;
  const color = categoryColor ?? "#FF6B4A";
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.label);

  function commitRename() {
    setRenaming(false);
    onRename(draftTitle);
  }

  return (
    <li className="relative flex gap-3">
      {/* Riel: la tarea es una estación en la línea de su categoría */}
      <div className="relative flex w-7 flex-shrink-0 justify-center">
        {!last && <span className="absolute left-1/2 top-[30px] bottom-0 w-[3px] -translate-x-1/2" style={{ background: color, opacity: overdue ? 0.45 : 1 }} />}
        <Station color={color} done={task.done} overdue={overdue} onToggle={onToggle} label={task.done ? "Marcar como pendiente" : "Marcar como hecha"} />
      </div>
      <div className="mb-2 flex min-w-0 flex-1 items-start gap-2 border-b border-line pb-3">
        <div className="min-w-0 flex-1 cursor-pointer pt-2" onClick={onTap}>
          {renaming ? (
            <input
              autoFocus
              value={draftTitle}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => setDraftTitle(event.target.value)}
              onBlur={commitRename}
              onKeyDown={(event) => { if (event.key === "Enter") commitRename(); if (event.key === "Escape") { setDraftTitle(task.label); setRenaming(false); } }}
              className="w-full rounded-md border border-coral bg-card px-2 py-1 text-[16px] font-semibold text-ink outline-none"
            />
          ) : (
            <p
              onClick={(event) => event.stopPropagation()}
              onDoubleClick={() => { setDraftTitle(task.label); setRenaming(true); }}
              title="Doble clic para renombrar"
              className={`text-[16px] font-semibold leading-snug ${task.done ? "line-through text-ink-3" : "text-ink"}`}
            >
              {task.label}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className={`num text-[16px] font-semibold ${overdue ? "text-danger" : "text-ink-2"}`}>{task.due}</span>
            {overdue && <span className="rounded-sm bg-danger-wash px-1.5 py-1 font-display text-[13px] font-semibold uppercase leading-none tracking-wide text-danger">Vencida</span>}
            <CategoryBadge name={task.tag} color={categoryColor} />
            {subtaskInfo && <span className="num text-[14px] font-semibold text-ink-2">{subtaskInfo.completed}/{subtaskInfo.total} pasos</span>}
            <PriorityDot level={task.priority} />
          </div>
          {subtaskInfo && <div className="mt-2.5"><ProgressBar value={subtaskInfo.percentage} color={color} height={4} /></div>}
        </div>
        <button
          onClick={onDelete}
          className="-mr-2 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md text-ink-3 transition-colors hover:text-danger active:bg-wash"
          title="Eliminar tarea"
          aria-label="Eliminar tarea"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 7h12M9 7V5h6v2M9 10v7M12 10v7M15 10v7" />
          </svg>
        </button>
      </div>
    </li>
  );
}

function TasksBoard({ tasks, categories, colorByCategory, groupBy, onTaskTap, onToggle }: { tasks: UiTask[]; categories: Category[]; colorByCategory: Map<string, string>; groupBy: "estado" | "categoria"; onTaskTap: (taskId: string) => void; onToggle: (task: UiTask) => void }) {
  const columns = useMemo(() => {
    if (groupBy === "estado") {
      return STATUS_COLUMNS.map((column) => ({
        id: column.id,
        label: column.label,
        color: column.id === "completadas" ? "var(--color-green)" : "var(--color-coral)",
        tasks: tasks.filter((task) => (column.id === "completadas") === task.done),
      }));
    }
    const names = categories.length ? categories.map((category) => category.name) : Array.from(new Set(tasks.map((task) => task.tag)));
    return names.map((name) => ({
      id: name,
      label: name,
      color: colorByCategory.get(name) ?? "var(--color-ink-2)",
      tasks: tasks.filter((task) => task.tag === name),
    }));
  }, [tasks, categories, colorByCategory, groupBy]);

  return (
    <div className="min-h-0 flex-1 overflow-x-auto no-scrollbar px-4 py-4 lg:px-8">
      <div className="flex h-full gap-3 pb-24" style={{ minWidth: "max-content" }}>
        {columns.map((column) => (
          <div key={column.id} className="flex w-64 flex-shrink-0 flex-col rounded-md bg-wash p-2">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: column.color }} />
              <p className="text-[13px] font-bold text-ink">{column.label}</p>
              <span className="ml-auto text-[13px] font-bold text-ink-3">{column.tasks.length}</span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto no-scrollbar px-1 pb-2">
              {column.tasks.length === 0 ? (
                <p className="px-2 py-3 text-[13px] text-ink-3">Sin tareas aquí</p>
              ) : column.tasks.map((task) => {
                const overdue = !task.done && isOverdue(task.rawDue);
                const subtaskInfo = task.subtasks.length ? getSubtaskProgress(task.subtasks) : null;
                return (
                  <div
                    key={task.id}
                    onClick={() => onTaskTap(task.id)}
                    className="cursor-pointer rounded-md bg-card p-3"
                    style={{ boxShadow: overdue ? "0 0 0 1.5px var(--color-danger-line)" : "0 0 0 1px var(--color-line)" }}
                  >
                    <div className="flex items-start gap-2">
                      <Checkbox checked={task.done} onChange={() => onToggle(task)} />
                      <p className={`min-w-0 flex-1 text-[14px] font-semibold leading-snug ${task.done ? "text-ink-3 line-through" : "text-ink"}`}>{task.label}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <CategoryBadge name={task.tag} color={colorByCategory.get(task.tag)} />
                      {overdue && <span className="rounded-sm bg-danger-wash px-1.5 py-1 font-display text-[13px] font-semibold uppercase leading-none tracking-wide text-danger">Vencida</span>}
                      {subtaskInfo && <span className="text-[13px] font-bold text-ink-2">{subtaskInfo.completed}/{subtaskInfo.total}</span>}
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
