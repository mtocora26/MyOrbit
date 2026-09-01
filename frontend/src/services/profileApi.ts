import { authHeaders } from "./authApi";

export interface UserProfile {
  userId: string;
  program: string;
  semester: string;
  studentCode: string;
  gradeTarget: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export async function fetchUserProfile(): Promise<UserProfile | null> {
  const response = await fetch(`${API_BASE_URL}/api/profile`, { headers: authHeaders() });
  if (response.status === 204) return null;
  if (!response.ok) throw new Error("No fue posible cargar tu perfil");
  return response.json();
}

export async function saveUserProfile(profile: Omit<UserProfile, "userId">): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(profile),
  });
  if (!response.ok) throw new Error("No fue posible guardar tu perfil");
  return response.json();
}