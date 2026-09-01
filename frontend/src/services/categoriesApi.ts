import { authHeaders } from "./authApi";

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/api/categories`, { headers: authHeaders() });
  if (!response.ok) throw new Error("No fue posible cargar las categorías");
  return response.json();
}

export async function createCategory(name: string, color: string): Promise<Category> {
  const response = await fetch(`${API_BASE_URL}/api/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ name, color }),
  });
  if (!response.ok) throw new Error(await response.text() || "No fue posible crear la categoría");
  return response.json();
}
