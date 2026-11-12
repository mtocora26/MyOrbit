import { useEffect, useMemo, useState } from "react";
import { CategoryBadge, Checkbox, PriorityDot, ProgressBar, EmptyState, Station } from "../components/shared";
import { IconCalendar, IconChecklist } from "../components/icons";
import { deleteTask, fetchTasks, getSubtaskProgress, toUiTask, updateTask, updateTaskStatus, type TaskFilters, type UiTask } from "../services/tasksApi";
import { isOverdue } from "../services/taskDue";
import { categoryLabel, fetchCategories, orderCategories, type Category } from "../services/categoriesApi";

interface Props { onTaskTap: (taskId: string) => void; onFab: () => void; refreshTick: number; }

const PRIORITY_COLOR = { alta: "var(--color-coral)", media: "var(--color-amber)", baja: "var(--color-green)" };
const STATUS_COLUMNS = [
  { id: "pendientes", label: "Pendientes" },
  { id: "completadas", label: "Completadas" },
] as const;

type DatePreset = "todas" | "hoy" | "semana";
type DoneFilter = "todas" | "pendientes" | "completadas";
type PriorityFilter = "todas" | "alta" | "media" | "baja";

function toIsoLocal(date: Date, hours: string): string {
  const normalized = date.toISOString().slice(0, 10);
  return `${normalized}T${hours}`;
}

function todayRange(): { dueFrom: string; dueTo: string } {
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  return { dueFrom: `${day}T00:00`, dueTo: `${day}T23:59` };
}

function weekRange(): { dueFrom: string; dueTo: string } {
  const now = new Date();
  const day = now.getDay();
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + offsetToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { dueFrom: toIsoLocal(monday, "00:00"), dueTo: toIsoLocal(sunday, "23:59") };
}

export default function TasksScreen({ onTaskTap, onFab, refreshTick }: Props) {
  const [tasks, setTasks] = useState<UiTask[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>("todas");
  const [doneFilter, setDoneFilter] = useState<DoneFilter>("todas");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("todas");
  const [categoryFilter, setCategoryFilter] = useState<string>("todas");
  const [view, setView] = useState<"lista" | "tablero">("lista");
  const [groupBy, setGroupBy] = useState<"estado" | "categoria">("estado");

  const colorByCategoryId = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => map.set(category.id, category.color));
    return map;
  }, [categories]);

  const nameByCategoryId = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => map.set(category.id, categoryLabel(category, categories)));
    return map;
  }, [categories]);

  const nameOf = (categoryId: string | null) =>
    (categoryId ? nameByCategoryId.get(categoryId) : undefined) ?? (categoryId ? "Categoría" : "Sin categoría");

  async function loadTasks() {
    try {
      setLoading(true);
      setError(null);
      const range = datePreset === "hoy" ? todayRange() : datePreset === "semana" ? weekRange() : {};
      const filters: TaskFilters = {
        ...range,
        done: doneFilter === "pendientes" ? false : doneFilter === "completadas" ? true : undefined,
        priority: priorityFilter === "todas" ? undefined : priorityFilter,
        categoryId: categoryFilter === "todas" || categoryFilter === "none" ? undefined : categoryFilter,
        uncategorized: categoryFilter === "none",
      };
      const apiTasks = await fetchTasks(filters);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTick, datePreset, doneFilter, priorityFilter, categoryFilter]);

  const filteredTasks = tasks;

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
      await updateTask(task.id, { title: trimmed, due: task.rawDue, priority: task.priority, categoryId: task.categoryId });
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
        <div className="flex gap-2 pb-3 overflow-x-auto no-scrollbar">
          {(["todas", "hoy", "semana"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setDatePreset(f)}
              aria-pressed={datePreset === f}
              className="flex-shrink-0 min-h-[40px] rounded-md px-4 text-[14px] font-semibold transition-colors duration-150"
              style={{ background: datePreset === f ? "var(--color-strong)" : "var(--color-wash)", color: datePreset === f ? "var(--color-on-strong)" : "var(--color-ink-2)" }}
            >
              {f === "todas" ? "Todas" : f === "hoy" ? "Hoy" : "Esta semana"}
            </button>
          ))}
          <select value={doneFilter} onChange={(e) => setDoneFilter(e.target.value as DoneFilter)} aria-label="Filtrar por estado" className="flex-shrink-0 min-h-[40px] rounded-md bg-wash px-3 text-[14px] font-semibold text-ink-2 outline-none">
            <option value="todas">Estado: todas</option>
            <option value="pendientes">Pendientes</option>
            <option value="completadas">Completadas</option>
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)} aria-label="Filtrar por prioridad" className="flex-shrink-0 min-h-[40px] rounded-md bg-wash px-3 text-[14px] font-semibold text-ink-2 outline-none">
            <option value="todas">Prioridad: todas</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Filtrar por categoría" className="flex-shrink-0 min-h-[40px] rounded-md bg-wash px-3 text-[14px] font-semibold text-ink-2 outline-none">
            <option value="todas">Categoría: todas</option>
            <option value="none">Sin categoría</option>
            {orderCategories(categories).map((category) => <option key={category.id} value={category.id}>{nameByCategoryId.get(category.id) ?? category.name}</option>)}
          </select>
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
            <TaskCard key={task.id} last={index === filteredTasks.length - 1} task={task} categoryColor={task.categoryId ? colorByCategoryId.get(task.categoryId) : undefined} categoryName={nameOf(task.categoryId)} onTap={() => onTaskTap(task.id)} onToggle={() => handleToggleTask(task)} onDelete={() => handleDeleteTask(task.id)} onRename={(title) => handleRenameTask(task, title)} />
          ))}
        </ol>
      ) : (
        <TasksBoard tasks={filteredTasks} categories={categories} colorByCategoryId={colorByCategoryId} nameByCategoryId={nameByCategoryId} groupBy={groupBy} onTaskTap={onTaskTap} onToggle={handleToggleTask} />
      )}
    </div>
  );
}

function TaskCard({ task, categoryColor, categoryName, last, onTap, onToggle, onDelete, onRename }: { task: UiTask; categoryColor?: string; categoryName: string; last: boolean; onTap: () => void; onToggle: () => void; onDelete: () => void; onRename: (title: string) => void }) {
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
            <CategoryBadge name={categoryName} color={categoryColor} />
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

function TasksBoard({ tasks, categories, colorByCategoryId, nameByCategoryId, groupBy, onTaskTap, onToggle }: { tasks: UiTask[]; categories: Category[]; colorByCategoryId: Map<string, string>; nameByCategoryId: Map<string, string>; groupBy: "estado" | "categoria"; onTaskTap: (taskId: string) => void; onToggle: (task: UiTask) => void }) {
  const columns = useMemo(() => {
    if (groupBy === "estado") {
      return STATUS_COLUMNS.map((column) => ({
        id: column.id,
        label: column.label,
        color: column.id === "completadas" ? "var(--color-green)" : "var(--color-coral)",
        tasks: tasks.filter((task) => (column.id === "completadas") === task.done),
      }));
    }
    const ids = categories.length ? orderCategories(categories).map((category) => category.id) : Array.from(new Set(tasks.map((task) => task.categoryId).filter((id): id is string => !!id)));
    const uncategorized = tasks.some((task) => !task.categoryId) ? [{ id: "__none", label: "Sin categoría", color: "var(--color-ink-2)", tasks: tasks.filter((task) => !task.categoryId) }] : [];
    return [
      ...ids.map((id) => ({
        label: nameByCategoryId.get(id) ?? "Categoría",
        id,
        color: colorByCategoryId.get(id) ?? "var(--color-ink-2)",
        tasks: tasks.filter((task) => task.categoryId === id),
      })),
      ...uncategorized,
    ];
  }, [tasks, categories, colorByCategoryId, nameByCategoryId, groupBy]);

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
                      <CategoryBadge name={task.categoryId ? (nameByCategoryId.get(task.categoryId) ?? "Categoría") : "Sin categoría"} color={task.categoryId ? colorByCategoryId.get(task.categoryId) : undefined} />
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
