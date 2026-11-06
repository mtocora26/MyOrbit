import { authHeaders } from "./authApi";
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
  done: boolean;
  subtasks: Subtask[];
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
  done: boolean;
  subtasks?: Subtask[];
}

export interface CreateTaskInput {
  title: string;
  due?: string;
  priority?: TaskPriority;
  categoryId?: string | null;
  userId?: string;
}

export interface UpdateTaskInput {
  title: string;
  due: string;
  priority: TaskPriority;
  categoryId: string | null;
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
    done: task.done,
    subtasks: normalizeSubtasks(task.subtasks),
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
}

export async function fetchTasks(filters: TaskFilters = {}): Promise<ApiTask[]> {
  const params = new URLSearchParams();
  if (filters.done !== undefined) params.set("done", String(filters.done));
  if (filters.dueFrom) params.set("dueFrom", filters.dueFrom);
  if (filters.dueTo) params.set("dueTo", filters.dueTo);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.uncategorized) params.set("uncategorized", "true");
  const query = params.size ? `?${params}` : "";
  const response = await fetch(`${API_BASE_URL}/api/tasks${query}`, { headers: authHeaders() });
  if (!response.ok) {
    throw new Error(`No fue posible cargar tareas (${response.status})`);
  }
  return response.json();
}

export async function createTask(input: CreateTaskInput): Promise<ApiTask> {
  const response = await fetch(`${API_BASE_URL}/api/tasks`, {
    method: "POST",
    headers: requestHeaders(),
    body: JSON.stringify({
      userId: input.userId,
      title: input.title,
      due: input.due ?? "",
      priority: input.priority ?? "media",
      categoryId: input.categoryId ?? null,
    }),
  });

  if (!response.ok) {
    throw new Error(`No fue posible crear la tarea (${response.status})`);
  }
  return response.json();
}

export async function fetchTaskById(taskId: string): Promise<ApiTask> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/${encodeURIComponent(taskId)}`, { headers: authHeaders() });
  if (!response.ok) {
    throw new Error(`No fue posible cargar el detalle de la tarea (${response.status})`);
  }
  return response.json();
}

export async function updateTaskStatus(taskId: string, done: boolean): Promise<ApiTask> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/${encodeURIComponent(taskId)}/status`, {
    method: "PATCH",
    headers: requestHeaders(),
    body: JSON.stringify({ done }),
  });

  if (!response.ok) {
    throw new Error(`No fue posible actualizar estado (${response.status})`);
  }
  return response.json();
}

export async function updateTask(taskId: string, input: UpdateTaskInput): Promise<ApiTask> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/${encodeURIComponent(taskId)}`, {
    method: "PUT",
    headers: requestHeaders(),
    body: JSON.stringify({
      title: input.title,
      due: input.due,
      priority: input.priority,
      categoryId: input.categoryId,
    }),
  });

  if (!response.ok) {
    throw new Error(`No fue posible guardar cambios de la tarea (${response.status})`);
  }
  return response.json();
}

export async function deleteTask(taskId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/${encodeURIComponent(taskId)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

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
