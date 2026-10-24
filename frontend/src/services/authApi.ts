import { readErrorMessage } from "./apiError";
import { API_BASE_URL } from "./apiConfig";

export interface AuthSession {
  token: string;
  id: string;
  name: string;
  email: string;
  role?: "USER" | "ADMIN";
}

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

/** Actualiza el rol de la sesión guardada (cuentas anteriores a la gestión de usuarios no lo traen). */
export async function refreshSession(): Promise<AuthSession | null> {
  const session = getSession();
  if (!session) return null;
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, { headers: authHeaders() });
  if (response.status === 401) {
    clearSession();
    return null;
  }
  if (!response.ok) return session;
  const me = await response.json() as AuthSession;
  const next = { ...session, name: me.name, email: me.email, role: me.role };
  localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  return next;
}
