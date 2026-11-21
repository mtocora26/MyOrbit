import { useEffect, useMemo, useState } from "react";
import { CategoryBadge, ChoiceChip, PendingMark, Checkbox, DeleteButton, PriorityDot, ProgressBar, EmptyState, Station, ListSkeleton, ErrorBanner } from "../components/shared";
import RescheduleSheet from "../components/RescheduleSheet";
import { IconCalendar, IconChecklist, IconSearch } from "../components/icons";
import { cacheKeys, peek } from "../services/cache";
import { flushPending, runUndoable } from "../services/undo";
import { deleteTask, fetchTasks, getSubtaskProgress, peekTasks, toUiTask, updateTask, updateTaskStatus, type TaskFilters, type UiTask } from "../services/tasksApi";
import { formatTaskDue, fromTaskDue, isOverdue, toTaskDue } from "../services/taskDue";
import { categoryLabel, fetchCategories, orderCategories, type Category } from "../services/categoriesApi";

interface Props { onTaskTap: (taskId: string) => void; onFab: () => void; refreshTick: number; }

const PRIORITY_COLOR = { alta: "var(--color-coral)", media: "var(--color-amber)", baja: "var(--color-green)" };
const STATUS_COLUMNS = [
  { id: "pendientes", label: "Pendientes" },
  { id: "completadas", label: "Completadas" },
] as const;

type DatePreset = "todas" | "hoy" | "semana" | "vencidas";
type DoneFilter = "todas" | "pendientes" | "completadas";
const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "hoy", label: "Hoy" },
  { id: "semana", label: "Semana" },
  { id: "vencidas", label: "Vencidas" },
];

// La pestaña abre en el último filtro usado; la primera vez, todo lo pendiente.
const FILTERS_KEY = "myorbit.tasks.filters";
function savedFilters(): { datePreset: DatePreset; doneFilter: DoneFilter } {
  try {
    const stored = JSON.parse(localStorage.getItem(FILTERS_KEY) ?? "null");
    const datePreset = DATE_PRESETS.some((preset) => preset.id === stored?.datePreset) ? stored.datePreset as DatePreset : "todas";
    const doneFilter = ["todas", "pendientes", "completadas"].includes(stored?.doneFilter) ? stored.doneFilter as DoneFilter : "pendientes";
    return { datePreset, doneFilter };
  } catch {
    return { datePreset: "todas", doneFilter: "pendientes" };
  }
}

/** Quita acentos y mayúsculas para que «ensayo» encuentre «Ensayo de Historia». */
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
type PriorityFilter = "todas" | "alta" | "media" | "baja";

function toIsoLocal(date: Date, hours: string): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${hours}`;
}

function todayRange(): { dueFrom: string; dueTo: string } {
  const now = new Date();
  return { dueFrom: toIsoLocal(now, "00:00"), dueTo: toIsoLocal(now, "23:59") };
}

/** Vencidas: todo lo que debía entregarse antes de este momento. */
function overdueRange(): { dueTo: string } {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return { dueTo: toIsoLocal(now, `${pad(now.getHours())}:${pad(now.getMinutes())}`) };
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

function buildFilters(datePreset: DatePreset, doneFilter: DoneFilter, priorityFilter: PriorityFilter, categoryFilter: string): TaskFilters {
  const range = datePreset === "hoy" ? todayRange() : datePreset === "semana" ? weekRange() : datePreset === "vencidas" ? overdueRange() : {};
  return {
    ...range,
    done: datePreset === "vencidas" || doneFilter === "pendientes" ? false : doneFilter === "completadas" ? true : undefined,
    priority: priorityFilter === "todas" ? undefined : priorityFilter,
    categoryId: categoryFilter === "todas" || categoryFilter === "none" ? undefined : categoryFilter,
    uncategorized: categoryFilter === "none",
  };
}

export default function TasksScreen({ onTaskTap, onFab, refreshTick }: Props) {
  // Segunda visita: se pinta lo último que se tuvo (sin esqueleto) y se revalida en segundo plano.
  const [initialTasks] = useState(() => { const saved = savedFilters(); return peekTasks(buildFilters(saved.datePreset, saved.doneFilter, "todas", "todas")); });
  const [tasks, setTasks] = useState<UiTask[]>(() => initialTasks?.map(toUiTask) ?? []);
  const [categories, setCategories] = useState<Category[]>(() => peek<Category[]>(cacheKeys.categories) ?? []);
  const [loading, setLoading] = useState(!initialTasks);
  const [error, setError] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>(() => savedFilters().datePreset);
  const [doneFilter, setDoneFilter] = useState<DoneFilter>(() => savedFilters().doneFilter);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [rescheduling, setRescheduling] = useState<UiTask | null>(null);

  useEffect(() => {
    try { localStorage.setItem(FILTERS_KEY, JSON.stringify({ datePreset, doneFilter })); } catch { /* sin almacenamiento */ }
  }, [datePreset, doneFilter]);
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

  async function loadTasks(quiet = false) {
    try {
      if (!quiet) setLoading(true);
      setError(null);
      const filters = buildFilters(datePreset, doneFilter, priorityFilter, categoryFilter);
      const cached = peekTasks(filters);
      if (cached && !quiet) { setTasks(cached.map(toUiTask)); setLoading(false); }
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

  const filteredTasks = useMemo(() => {
    const needle = normalize(query.trim());
    if (!needle) return tasks;
    return tasks.filter((task) => normalize(`${task.label} ${nameOf(task.categoryId)}`).includes(needle));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, query, categories]);

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

  // Se quita al instante y el servidor la elimina al vencer el plazo de «Deshacer».
  function handleDeleteTask(taskId: string) {
    const index = tasks.findIndex((task) => task.id === taskId);
    const removed = tasks[index];
    if (!removed) return;
    runUndoable({
      message: "Tarea eliminada",
      apply: () => setTasks((current) => current.filter((task) => task.id !== taskId)),
      restore: () => setTasks((current) => current.some((task) => task.id === taskId) ? current : [...current.slice(0, index), removed, ...current.slice(index)]),
      commit: () => deleteTask(taskId),
    });
  }

  // Al salir de la pantalla lo que espera «Deshacer» se confirma en el servidor.
  useEffect(() => flushPending, []);

  async function handleReschedule(task: UiTask, date: string) {
    setRescheduling(null);
    const due = toTaskDue(date, fromTaskDue(task.rawDue).time);
    const previousTasks = tasks;
    setTasks(tasks.map((item) => item.id === task.id ? { ...item, rawDue: due, due: formatTaskDue(due) } : item));

    try {
      await updateTask(task.id, { title: task.label, due, priority: task.priority, categoryId: task.categoryId });
      // En «Hoy» o «Vencidas» la tarea movida sale de la lista: se actualiza sin mostrar el esqueleto.
      if (datePreset !== "todas") await loadTasks(true);
    } catch (err) {
      setTasks(previousTasks);
      setError(err instanceof Error ? err.message : "No fue posible mover la tarea");
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
          <div className="-mr-2 flex items-center">
          <button
            onClick={() => { if (searching) setQuery(""); setSearching(!searching); }}
            aria-pressed={searching}
            title="Buscar tareas"
            aria-label="Buscar tareas"
            className="flex h-11 w-11 items-center justify-center rounded-md active:bg-wash"
          >
            <IconSearch size={20} color={searching ? "var(--color-coral-ink)" : "var(--color-ink-2)"} />
          </button>
          <button
            onClick={() => setView(view === "lista" ? "tablero" : "lista")}
            title={view === "lista" ? "Ver como tablero" : "Ver como lista"}
            className="flex h-11 w-11 items-center justify-center rounded-md active:bg-wash"
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
        </div>
        {searching && (
          <div className="mb-2 flex items-center gap-2">
            <label className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 rounded-md border border-line-control bg-card px-3 transition-colors focus-within:border-coral">
              <IconSearch size={16} color="var(--color-ink-3)" />
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar tareas" aria-label="Buscar tareas" className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none" />
            </label>
            <button type="button" onClick={() => { setQuery(""); setSearching(false); }} className="-mr-2 min-h-[44px] flex-shrink-0 px-2 text-[14px] font-semibold text-coral-ink">Cerrar</button>
          </div>
        )}
        <div className="flex gap-2 pb-3 overflow-x-auto no-scrollbar">
          {DATE_PRESETS.map(({ id: f, label }) => (
            <ChoiceChip key={f} role="button" selected={datePreset === f} onClick={() => setDatePreset(f)} className="px-4">{label}</ChoiceChip>
          ))}
          <select value={doneFilter} onChange={(e) => setDoneFilter(e.target.value as DoneFilter)} aria-label="Filtrar por estado" className="flex-shrink-0 min-h-[44px] rounded-md bg-wash px-3 text-[14px] font-semibold text-ink-2 outline-none">
            <option value="todas">Estado: todas</option>
            <option value="pendientes">Pendientes</option>
            <option value="completadas">Completadas</option>
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)} aria-label="Filtrar por prioridad" className="flex-shrink-0 min-h-[44px] rounded-md bg-wash px-3 text-[14px] font-semibold text-ink-2 outline-none">
            <option value="todas">Prioridad: todas</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Filtrar por categoría" className="flex-shrink-0 min-h-[44px] rounded-md bg-wash px-3 text-[14px] font-semibold text-ink-2 outline-none">
            <option value="todas">Categoría: todas</option>
            <option value="none">Sin categoría</option>
            {orderCategories(categories).map((category) => <option key={category.id} value={category.id}>{nameByCategoryId.get(category.id) ?? category.name}</option>)}
          </select>
          {view === "tablero" && (
            <button
              onClick={() => setGroupBy(groupBy === "estado" ? "categoria" : "estado")}
              className="ml-auto flex-shrink-0 min-h-[44px] rounded-md bg-wash px-4 text-[14px] font-semibold text-ink-2"
            >
              {groupBy === "estado" ? "Por estado" : "Por línea"}
            </button>
          )}
        </div>
        {error && <ErrorBanner message={error} onRetry={() => loadTasks()} className="mb-3" />}
      </div>

      {loading ? (
        <ListSkeleton rows={5} label="Cargando tareas" />
      ) : filteredTasks.length === 0 ? (
        // Si la carga falló no se dice «sin tareas»: el aviso de error con «Reintentar» ya explica lo que pasa.
        error ? null : query.trim() ? <div className="px-4 pt-4"><EmptyState icon="—" title="Sin resultados" sub={`Ninguna tarea coincide con «${query.trim()}».`} /></div> : <div className="px-4 pt-4">
          <EmptyState icon="—" title="Sin tareas pendientes" sub="Crea una nueva tarea para seguir en órbita." action="Nueva tarea" onAction={onFab} />
        </div>
      ) : view === "lista" ? (
        <ol className="min-h-0 flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-24 lg:px-8 lg:max-w-[760px]">
          {filteredTasks.map((task, index) => (
            <TaskCard key={task.id} last={index === filteredTasks.length - 1} task={task} categoryColor={task.categoryId ? colorByCategoryId.get(task.categoryId) : undefined} categoryName={nameOf(task.categoryId)} onTap={() => onTaskTap(task.id)} onToggle={() => handleToggleTask(task)} onDelete={() => handleDeleteTask(task.id)} onReschedule={() => setRescheduling(task)} onRename={(title) => handleRenameTask(task, title)} />
          ))}
        </ol>
      ) : (
        <TasksBoard tasks={filteredTasks} categories={categories} colorByCategoryId={colorByCategoryId} nameByCategoryId={nameByCategoryId} groupBy={groupBy} onTaskTap={onTaskTap} onToggle={handleToggleTask} />
      )}

      <RescheduleSheet task={rescheduling} onClose={() => setRescheduling(null)} onPick={(date) => rescheduling && handleReschedule(rescheduling, date)} />
    </div>
  );
}

function TaskCard({ task, categoryColor, categoryName, last, onTap, onToggle, onDelete, onReschedule, onRename }: { task: UiTask; categoryColor?: string; categoryName: string; last: boolean; onTap: () => void; onToggle: () => void; onDelete: () => void; onReschedule: () => void; onRename: (title: string) => void }) {
  const overdue = !task.done && isOverdue(task.rawDue);
  const subtaskInfo = task.subtasks.length ? getSubtaskProgress(task.subtasks) : null;
  const color = categoryColor ?? "#FF6B4A";
  const [renaming, setRenaming] = useState(false);
  // En pantallas táctiles no hay doble clic: tocar el título abre el detalle. El renombrado en línea queda para el ratón.
  const touch = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches === true;
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
              onClick={(event) => { if (!touch) event.stopPropagation(); }}
              onDoubleClick={touch ? undefined : () => { setDraftTitle(task.label); setRenaming(true); }}
              title={touch ? undefined : "Doble clic para renombrar"}
              className={`text-[16px] font-semibold leading-snug ${task.done ? "line-through text-ink-3" : "text-ink"}`}
            >
              {task.label}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {task.done
              ? <span className="num text-[16px] font-semibold text-ink-2">{task.due}</span>
              : (
                // Tocar la fecha abre «Mover a…»: reprogramar en dos toques, sin entrar al detalle. 44 px de alto sin crecer la fila.
                <button
                  type="button"
                  onClick={(event) => { event.stopPropagation(); onReschedule(); }}
                  aria-label={`Mover «${task.label}», vence ${task.due}`}
                  className={`num -my-2 -ml-2 inline-flex min-h-[44px] items-center gap-1.5 rounded-md px-2 text-[16px] font-semibold transition-[background-color,transform] duration-150 ease-out active:scale-95 active:bg-wash ${overdue ? "text-danger" : "text-ink-2"}`}
                >
                  <IconCalendar size={16} />
                  {task.due}
                </button>
              )}
            {task.pending && <PendingMark />}
            {overdue && <span className="rounded-sm bg-danger-wash px-1.5 py-1 font-display text-[13px] font-semibold uppercase leading-none tracking-wide text-danger">Vencida</span>}
            <CategoryBadge name={categoryName} color={categoryColor} />
            {subtaskInfo && <span className="num text-[14px] font-semibold text-ink-2">{subtaskInfo.completed}/{subtaskInfo.total} pasos</span>}
            <PriorityDot level={task.priority} />
          </div>
          {subtaskInfo && <div className="mt-2.5"><ProgressBar value={subtaskInfo.percentage} color={color} height={4} /></div>}
        </div>
        {/* La papelera va aparte, tras una línea: nunca pegada a «completar» ni a la fecha. */}
        <span aria-hidden="true" className="my-1 w-px flex-shrink-0 self-stretch bg-line" />
        <DeleteButton label={`tarea «${task.label}»`} onClick={onDelete} className="-mr-2" />
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
