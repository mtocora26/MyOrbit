import { readErrorMessage } from "./apiError";
import { authHeaders } from "./authApi";
import { API_BASE_URL } from "./apiConfig";

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  /** Categoría padre; null si es raíz. Solo hay un nivel de subcategorías. */
  parentId: string | null;
}

/** Lo mínimo para ordenar y etiquetar jerarquías. */
interface Hierarchical { id: string; name: string; parentId?: string | null; }

/** «Universidad › Semillero» para una subcategoría; el nombre solo para una raíz. */
export function categoryLabel(category: Hierarchical, all: Hierarchical[]): string {
  const parent = category.parentId ? all.find((item) => item.id === category.parentId) : undefined;
  return parent ? `${parent.name} › ${category.name}` : category.name;
}

/** Raíces por nombre, cada una seguida de sus subcategorías por nombre. Una hija sin padre conocido se trata como raíz. */
export function orderCategories<T extends Hierarchical>(all: T[]): T[] {
  const byName = (a: T, b: T) => a.name.localeCompare(b.name, "es");
  const ids = new Set(all.map((item) => item.id));
  const roots = all.filter((item) => !item.parentId || !ids.has(item.parentId)).sort(byName);
  return roots.flatMap((root) => [root, ...all.filter((item) => item.parentId === root.id).sort(byName)]);
}


export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/api/categories`, { headers: authHeaders() });
  if (!response.ok) throw new Error("No fue posible cargar las categorías");
  return response.json();
}

/** `parentId` opcional: crea una subcategoría de esa categoría raíz. */
export async function createCategory(name: string, color: string, parentId?: string | null): Promise<Category> {
  const response = await fetch(`${API_BASE_URL}/api/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ name, color, parentId: parentId || null }),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible crear la categoría"));
  return response.json();
}

/** `parentId`: undefined no cambia el padre; null la pasa a categoría raíz; un id la mueve bajo esa categoría. */
export async function updateCategory(id: string, name: string, color?: string, parentId?: string | null): Promise<Category> {
  const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ name, color, ...(parentId === undefined ? {} : { parentId: parentId ?? "" }) }),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible editar la categoría"));
  return response.json();
}

export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible eliminar la categoría"));
}
