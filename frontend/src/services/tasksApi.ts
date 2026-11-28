import { cacheKeys, peek, peekMatching, remember } from "./cache";
import { enqueue, hasPendingOps, pendingOps, type OutboxOp } from "./outbox";
import { cacheKeyFor, loadResponse } from "./offlineStore";
import { isUnreachableStatus } from "./connection";
import { authHeaders, getSession } from "./authApi";
import { NETWORK_ERROR_MESSAGE } from "./apiError";
import { formatTaskDue } from "./taskDue";
import { API_BASE_URL } from "./apiConfig";

export type TaskPriority = "alta" | "media" | "baja";

export interface UiTask {
  id: string;
  userId: string;
  label: string;
  due: string;
  rawDue: string;
  priority: TaskPriority;
  categoryId: string | null;
  /** Materia a la que pertenece la tarea; null si no tiene. */
  subjectId: string | null;
  done: boolean;
  /** Cuándo se completó; null si está pendiente o no se registró. */
  completedAt?: string | null;
  subtasks: Subtask[];
  /** true si el cambio se hizo sin conexión y aún no llega al servidor. */
  pending?: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
  due?: string;
  subtasks?: Subtask[];
}

export interface ApiTask {
  id: string;
  userId: string;
  title: string;
  due: string | null;
  priority: string;
  categoryId: string | null;
  subjectId?: string | null;
  done: boolean;
  completedAt?: string | null;
  subtasks?: Subtask[];
  /** Momento lógico del último cambio (lo pone el servidor). */
  updatedAt?: string | null;
  /** true si es una tarea creada o cambiada sin conexión que aún no llega al servidor. */
  pending?: boolean;
}

export interface CreateTaskInput {
  title: string;
  due?: string;
  priority?: TaskPriority;
  categoryId?: string | null;
  /** Materia a la que se vincula; el servidor deja la tarea en Universidad si no se pide otra categoría. */
  subjectId?: string | null;
  userId?: string;
}

export interface UpdateTaskInput {
  title: string;
  due: string;
  priority: TaskPriority;
  categoryId: string | null;
  /** undefined no cambia la materia; null quita el vínculo; un id vincula esa materia. */
  subjectId?: string | null;
}

function requestHeaders(): HeadersInit {
  return { "Content-Type": "application/json", ...authHeaders() };
}

function normalizePriority(priority: string): TaskPriority {
  if (priority === "alta" || priority === "media" || priority === "baja") {
    return priority;
  }
  return "media";
}

function normalizeCategoryId(categoryId: string | null | undefined): string | null {
  return categoryId && categoryId.trim() ? categoryId.trim() : null;
}

export function toUiTask(task: ApiTask): UiTask {
  return {
    id: task.id,
    userId: task.userId,
    label: task.title,
    due: formatTaskDue(task.due),
    rawDue: task.due ?? "",
    priority: normalizePriority(task.priority),
    categoryId: normalizeCategoryId(task.categoryId),
    subjectId: task.subjectId ?? null,
    done: task.done,
    completedAt: task.completedAt ?? null,
    subtasks: normalizeSubtasks(task.subtasks),
    pending: task.pending,
  };
}

function normalizeSubtasks(subtasks?: Subtask[]): Subtask[] {
  return (subtasks ?? []).map((subtask) => ({ ...subtask, subtasks: normalizeSubtasks(subtask.subtasks) }));
}

export function getSubtaskProgress(subtasks: Subtask[]): { completed: number; total: number; percentage: number } {
  const leaves = getLeaves(subtasks);
  const completed = leaves.filter((subtask) => subtask.done).length;
  return { completed, total: leaves.length, percentage: leaves.length ? Math.round((completed / leaves.length) * 100) : 0 };
}

function getLeaves(subtasks: Subtask[]): Subtask[] {
  return subtasks.flatMap((subtask) => subtask.subtasks?.length ? getLeaves(subtask.subtasks) : [subtask]);
}

export interface TaskFilters {
  done?: boolean;
  dueFrom?: string;
  dueTo?: string;
  priority?: TaskPriority;
  categoryId?: string;
  uncategorized?: boolean;
  /** Solo las tareas de esa materia. */
  subjectId?: string;
}

function tasksQuery(filters: TaskFilters): string {
  const params = new URLSearchParams();
  if (filters.done !== undefined) params.set("done", String(filters.done));
  if (filters.dueFrom) params.set("dueFrom", filters.dueFrom);
  if (filters.dueTo) params.set("dueTo", filters.dueTo);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.uncategorized) params.set("uncategorized", "true");
  if (filters.subjectId) params.set("subjectId", filters.subjectId);
  return params.size ? `?${params}` : "";
}

/** Lo último que se tuvo para esos filtros (undefined si aún no se ha pedido). */
export function peekTasks(filters: TaskFilters = {}): ApiTask[] | undefined {
  return peek<ApiTask[]>(cacheKeys.tasks(tasksQuery(filters)));
}

export async function fetchTasks(filters: TaskFilters = {}): Promise<ApiTask[]> {
  const query = tasksQuery(filters);
  const response = await fetch(`${API_BASE_URL}/api/tasks${query}`, { headers: authHeaders() });
  if (!response.ok) {
    throw new Error(`No fue posible cargar tareas (${response.status})`);
  }
  const tasks = remember<ApiTask[]>(cacheKeys.tasks(query), await response.json());
  // Lo guardado queda limpio; lo que se ve lleva encima los cambios que esperan conexión.
  return applyPending(tasks, await pendingOps(), filters);
}

// ─── Cambios sin conexión (#216) ──────────────────────────────────────────────

/** Una petición no llegó al servidor: sin red (el `fetch` global ya tradujo el error). */
function didNotReachServer(error: unknown): boolean {
  return error instanceof Error && error.message === NETWORK_ERROR_MESSAGE;
}

/** ¿Cumple la tarea los filtros? Mismo criterio que el servidor, para mostrar bien lo creado sin conexión. */
function matchesFilters(task: ApiTask, filters: TaskFilters): boolean {
  if (filters.done !== undefined && task.done !== filters.done) return false;
  if (filters.priority && task.priority !== filters.priority) return false;
  if (filters.categoryId && task.categoryId !== filters.categoryId) return false;
  if (filters.uncategorized && task.categoryId) return false;
  if (filters.subjectId && task.subjectId !== filters.subjectId) return false;
  if (filters.dueFrom && (!task.due || task.due < filters.dueFrom)) return false;
  if (filters.dueTo && (!task.due || task.due > filters.dueTo)) return false;
  return true;
}

function byDue(a: ApiTask, b: ApiTask): number {
  if (!a.due && !b.due) return 0;
  if (!a.due) return 1;
  if (!b.due) return -1;
  return a.due.localeCompare(b.due);
}

/** Completadas: la más reciente primero; las que no tienen fecha, al final. */
export function byCompletion(a: { completedAt?: string | null }, b: { completedAt?: string | null }): number {
  return (b.completedAt ? Date.parse(b.completedAt) : 0) - (a.completedAt ? Date.parse(a.completedAt) : 0);
}

/** Pone encima de `tasks` los cambios pendientes, en el orden en que se hicieron. No modifica `tasks`. */
export function applyPending(tasks: ApiTask[], ops: OutboxOp[], filters: TaskFilters = {}): ApiTask[] {
  if (ops.length === 0) return tasks;
  const byId = new Map(tasks.map((task) => [task.id, task]));
  let created = false;
  for (const op of ops) {
    const current = byId.get(op.taskId);
    if (op.kind === "createTask") {
      if (!current) {
        byId.set(op.taskId, { ...taskFromCreatePayload(op), pending: true });
        created = true;
      }
    } else if (op.kind === "deleteTask") {
      byId.delete(op.taskId);
    } else if (current) {
      const next = op.kind === "updateTask" ? mergeUpdate(current, op.payload) : markDone(current, op.payload.done === true, op.at);
      byId.set(op.taskId, { ...next, pending: true });
    }
  }
  const merged = [...byId.values()].filter((task) => !task.pending || matchesFilters(task, filters));
  if (filters.done === true) return merged.sort(byCompletion);
  return created ? merged.sort(byDue) : merged;
}

function taskFromCreatePayload(op: OutboxOp): ApiTask {
  const payload = op.payload as { title: string; due?: string; priority?: string; categoryId?: string | null; subjectId?: string | null };
  return {
    id: op.taskId,
    userId: op.userId,
    title: payload.title,
    due: payload.due ? payload.due : null,
    priority: payload.priority ?? "media",
    categoryId: payload.categoryId ?? null,
    subjectId: payload.subjectId ?? null,
    done: false,
    subtasks: [],
    updatedAt: op.at,
  };
}

function mergeUpdate(task: ApiTask, payload: Record<string, unknown>): ApiTask {
  const next = { ...task };
  if (typeof payload.title === "string" && payload.title.trim()) next.title = payload.title.trim();
  if (typeof payload.due === "string") next.due = payload.due ? payload.due : null;
  if (typeof payload.priority === "string") next.priority = payload.priority;
  if ("categoryId" in payload) next.categoryId = (payload.categoryId as string | null) || null;
  if ("subjectId" in payload) next.subjectId = (payload.subjectId as string | null) || null;
  return next;
}

function markDone(task: ApiTask, done: boolean, at: string): ApiTask {
  const mark = (subtask: Subtask): Subtask => ({ ...subtask, done, subtasks: subtask.subtasks?.map(mark) });
  const completedAt = done ? (task.done ? task.completedAt : at) : null;
  return { ...task, done, completedAt, subtasks: task.subtasks?.map(mark) };
}

/** Tarea mínima para cuando no se conoce la real (nunca vista en esta app): solo para pintar el cambio. */
function stub(taskId: string): ApiTask {
  return { id: taskId, userId: getSession()?.id ?? "", title: "Tarea", due: null, priority: "media", categoryId: null, subjectId: null, done: false, subtasks: [] };
}

/** La tarea tal como se conoce ahora: memoria, o la última copia guardada de la lista. */
async function knownTask(taskId: string): Promise<ApiTask | undefined> {
  for (const list of peekMatching<ApiTask[]>("tasks")) {
    const found = list.find((task) => task.id === taskId);
    if (found) return found;
  }
  const key = cacheKeyFor("GET", `${API_BASE_URL}/api/tasks`);
  const saved = key ? await loadResponse(key) : null;
  if (!saved) return undefined;
  try {
    return (JSON.parse(saved) as ApiTask[]).find((task) => task.id === taskId);
  } catch {
    return undefined;
  }
}

/** Guarda un cambio para enviarlo después y devuelve la tarea como quedará, para pintarla ya. */
async function queueChange(kind: OutboxOp["kind"], task: ApiTask, payload: Record<string, unknown>): Promise<ApiTask> {
  const at = new Date().toISOString();
  await enqueue({ kind, taskId: task.id, label: task.title, payload, at });
  return { ...task, pending: true, updatedAt: at };
}

function createBody(input: CreateTaskInput) {
  return {
    userId: input.userId,
    title: input.title,
    due: input.due ?? "",
    priority: input.priority ?? "media",
    categoryId: input.categoryId ?? null,
    subjectId: input.subjectId || null,
  };
}

export async function createTask(input: CreateTaskInput): Promise<ApiTask> {
  // El id lo elige el cliente: reenviar el mismo cambio nunca duplica la tarea.
  const id = crypto.randomUUID();
  const body = createBody(input);
  const queued = (): Promise<ApiTask> => {
    const at = new Date().toISOString();
    const task = taskFromCreatePayload({ kind: "createTask", taskId: id, userId: getSession()?.id ?? "", label: input.title, payload: body, at, attempts: 0 });
    return queueChange("createTask", task, body);
  };
  if (await hasPendingOps()) return queued();
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/tasks`, { method: "POST", headers: requestHeaders(), body: JSON.stringify({ ...body, id }) });
  } catch (error) {
    if (didNotReachServer(error)) return queued();
    throw error;
  }
  if (isUnreachableStatus(response.status)) return queued();
  if (!response.ok) {
    throw new Error(`No fue posible crear la tarea (${response.status})`);
  }
  return response.json();
}

export async function fetchTaskById(taskId: string): Promise<ApiTask> {
  const pending = await pendingOps();
  const own = pending.filter((op) => op.taskId === taskId);
  const notSentYet = own.some((op) => op.kind === "createTask");
  let task: ApiTask | undefined;
  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${encodeURIComponent(taskId)}`, { headers: authHeaders() });
    if (response.ok) task = await response.json();
    else if (!notSentYet) throw new Error(`No fue posible cargar el detalle de la tarea (${response.status})`);
  } catch (error) {
    // Una tarea creada sin conexión no existe todavía en el servidor: se arma con lo pendiente.
    if (!notSentYet) throw error;
  }
  const result = applyPending(task ? [task] : [], own).find((candidate) => candidate.id === taskId);
  if (!result) throw new Error("No fue posible cargar el detalle de la tarea (404)");
  return result;
}

export async function updateTaskStatus(taskId: string, done: boolean): Promise<ApiTask> {
  const queued = async () => queueChange("setTaskDone", markDone((await knownTask(taskId)) ?? stub(taskId), done, new Date().toISOString()), { done });
  if (await hasPendingOps()) return queued();
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/tasks/${encodeURIComponent(taskId)}/status`, {
      method: "PATCH",
      headers: requestHeaders(),
      body: JSON.stringify({ done }),
    });
  } catch (error) {
    if (didNotReachServer(error)) return queued();
    throw error;
  }
  if (isUnreachableStatus(response.status)) return queued();
  if (!response.ok) {
    throw new Error(`No fue posible actualizar estado (${response.status})`);
  }
  return response.json();
}

export async function updateTask(taskId: string, input: UpdateTaskInput): Promise<ApiTask> {
  const body = {
    title: input.title,
    due: input.due,
    priority: input.priority,
    categoryId: input.categoryId,
    ...(input.subjectId === undefined ? {} : { subjectId: input.subjectId ?? "" }),
  };
  const queued = async () => queueChange("updateTask", mergeUpdate((await knownTask(taskId)) ?? stub(taskId), body), body);
  if (await hasPendingOps()) return queued();
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/tasks/${encodeURIComponent(taskId)}`, {
      method: "PUT",
      headers: requestHeaders(),
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (didNotReachServer(error)) return queued();
    throw error;
  }
  if (isUnreachableStatus(response.status)) return queued();
  if (!response.ok) {
    throw new Error(`No fue posible guardar cambios de la tarea (${response.status})`);
  }
  return response.json();
}

export async function deleteTask(taskId: string): Promise<void> {
  const queued = async () => {
    const task = (await knownTask(taskId)) ?? stub(taskId);
    await enqueue({ kind: "deleteTask", taskId, label: task.title, payload: {}, at: new Date().toISOString() });
  };
  if (await hasPendingOps()) return queued();
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/tasks/${encodeURIComponent(taskId)}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  } catch (error) {
    if (didNotReachServer(error)) return queued();
    throw error;
  }
  if (isUnreachableStatus(response.status)) return queued();
  if (!response.ok) {
    throw new Error(`No fue posible eliminar la tarea (${response.status})`);
  }
}

export async function createSubtask(taskId: string, title: string, due?: string, parentSubtaskId?: string): Promise<ApiTask> {
  const parentPath = parentSubtaskId ? `/${encodeURIComponent(parentSubtaskId)}` : "";
  const response = await fetch(`${API_BASE_URL}/api/tasks/${encodeURIComponent(taskId)}/subtasks${parentPath}`, {
    method: "POST",
    headers: requestHeaders(),
    body: JSON.stringify({ title, due }),
  });
  if (!response.ok) throw new Error("No fue posible crear la subtarea");
  return response.json();
}

export async function updateSubtaskDue(taskId: string, subtaskId: string, title: string, due: string | undefined): Promise<ApiTask> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/${encodeURIComponent(taskId)}/subtasks/${encodeURIComponent(subtaskId)}`, {
    method: "PUT",
    headers: requestHeaders(),
    // El backend interpreta due omitido como "no cambiar" y "" como "quitar la fecha".
    body: JSON.stringify({ title, due: due ?? "" }),
  });
  if (!response.ok) throw new Error("No fue posible actualizar la fecha de la subtarea");
  return response.json();
}

export async function updateSubtaskStatus(taskId: string, subtaskId: string, done: boolean): Promise<ApiTask> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/${encodeURIComponent(taskId)}/subtasks/${encodeURIComponent(subtaskId)}/status`, {
    method: "PATCH",
    headers: requestHeaders(),
    body: JSON.stringify({ done }),
  });
  if (!response.ok) throw new Error("No fue posible actualizar la subtarea");
  return response.json();
}

export async function deleteSubtask(taskId: string, subtaskId: string): Promise<ApiTask> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/${encodeURIComponent(taskId)}/subtasks/${encodeURIComponent(subtaskId)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("No fue posible eliminar la subtarea");
  return response.json();
}
