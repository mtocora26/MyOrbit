/**
 * Caché en memoria para «mostrar lo guardado y revalidar»: al volver a una pantalla se pinta lo último que
 * se tuvo y la petición normal lo actualiza en segundo plano. Se vacía al cerrar sesión.
 */
const store = new Map<string, unknown>();

export function peek<T>(key: string): T | undefined {
  return store.get(key) as T | undefined;
}

export function remember<T>(key: string, value: T): T {
  store.set(key, value);
  return value;
}

/** Todo lo guardado cuya clave empieza por `prefix` (p. ej. todas las listas de tareas con distintos filtros). */
export function peekMatching<T>(prefix: string): T[] {
  return [...store.entries()].filter(([key]) => key.startsWith(prefix)).map(([, value]) => value as T);
}

export function clearCache(): void {
  store.clear();
}

/** Lo último guardado para `key`, o `fallback` si aún no hay nada. */
export function peekOr<T>(key: string, fallback: T): T {
  return store.has(key) ? (store.get(key) as T) : fallback;
}

export const cacheKeys = {
  tasks: (query: string) => `tasks${query}`,
  categories: "categories",
  subjects: "subjects",
  semesters: "semesters",
  habits: "habits",
  habitSummaries: (days: number, months: number) => `habits/summary?days=${days}&months=${months}`,
  agendaEvaluations: "academic/evaluations",
  classes: (from: string, to: string) => `classes?from=${from}&to=${to}`,
  events: (from: string, to: string) => `events?from=${from}&to=${to}`,
  academicSummary: (semester?: string) => `academic/summary?semester=${semester ?? ""}`,
};
