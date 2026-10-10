import { readErrorMessage } from "./apiError";

export interface AuthSession {
  token: string;
  id: string;
  name: string;
  email: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const SESSION_KEY = "myorbit.session";

export function getSession(): AuthSession | null {
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as AuthSession;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function authHeaders(): HeadersInit {
  const session = getSession();
  return session ? { Authorization: `Bearer ${session.token}` } : {};
}

async function submit(path: string, body: Record<string, string>): Promise<AuthSession> {
  const response = await fetch(`${API_BASE_URL}/api/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "No fue posible iniciar sesion"));
  }
  const session = await response.json() as AuthSession;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function login(email: string, password: string): Promise<AuthSession> {
  return submit("login", { email, password });
}

export function register(name: string, email: string, password: string): Promise<AuthSession> {
  return submit("register", { name, email, password });
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, { method: "POST", headers: authHeaders() });
  } finally {
    clearSession();
  }
}