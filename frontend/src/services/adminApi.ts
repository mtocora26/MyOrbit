import { authHeaders } from "./authApi";
import { API_BASE_URL } from "./apiConfig";
import { readErrorMessage } from "./apiError";

export type UserRole = "USER" | "ADMIN";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string | null;
}

export interface CreateAdminUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateAdminUserInput {
  name?: string;
  role?: UserRole;
  active?: boolean;
}

const BASE = `${API_BASE_URL}/api/admin/users`;

function jsonHeaders(): HeadersInit {
  return { "Content-Type": "application/json", ...authHeaders() };
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const response = await fetch(BASE, { headers: authHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible cargar los usuarios"));
  return response.json();
}

export async function createAdminUser(input: CreateAdminUserInput): Promise<AdminUser> {
  const response = await fetch(BASE, { method: "POST", headers: jsonHeaders(), body: JSON.stringify(input) });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible crear el usuario"));
  return response.json();
}

export async function updateAdminUser(id: string, input: UpdateAdminUserInput): Promise<AdminUser> {
  const response = await fetch(`${BASE}/${encodeURIComponent(id)}`, { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify(input) });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible actualizar el usuario"));
  return response.json();
}

export async function deleteAdminUser(id: string): Promise<void> {
  const response = await fetch(`${BASE}/${encodeURIComponent(id)}`, { method: "DELETE", headers: authHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible eliminar el usuario"));
}
