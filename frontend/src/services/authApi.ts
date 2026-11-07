import { readErrorMessage } from "./apiError";
import { API_BASE_URL } from "./apiConfig";

export interface AuthSession {
  token: string;
  id: string;
  name: string;
  email: string;
  role?: "USER" | "ADMIN";
  /** Zona horaria IANA de la cuenta; null/ausente = aún no fijada (el servidor usa America/Bogota). */
  timeZone?: string | null;
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
  const next = { ...session, name: me.name, email: me.email, role: me.role, timeZone: me.timeZone ?? null };
  localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  return next;
}

export async function updateName(name: string): Promise<{ id: string; name: string; email: string; role?: "USER" | "ADMIN" }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me/name`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "No fue posible actualizar tu nombre"));
  }
  return response.json();
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me/password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "No fue posible cambiar tu contraseña"));
  }
}

/** Zona horaria del dispositivo (p. ej. "America/Bogota"). */
export function detectTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/** Todas las zonas que conoce el navegador; si no puede listarlas, una lista corta frecuente. */
export function availableTimeZones(): string[] {
  const list = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.("timeZone");
  return list && list.length > 0
    ? list
    : ["America/Bogota", "America/Lima", "America/Mexico_City", "America/Santiago", "America/Argentina/Buenos_Aires", "America/New_York", "Europe/Madrid", "UTC"];
}

export async function updateTimeZone(timeZone: string): Promise<AuthSession> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me/timezone`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ timeZone }),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible guardar tu zona horaria"));
  const saved = await response.json() as AuthSession;
  const session = getSession();
  const next = session ? { ...session, timeZone: saved.timeZone ?? timeZone } : null;
  if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  return next as AuthSession;
}

/**
 * Si la cuenta aún no tiene zona horaria, guarda la del dispositivo. Es silencioso: si falla no se interrumpe nada
 * y se reintenta en la próxima apertura.
 */
export async function ensureTimeZone(session: AuthSession): Promise<AuthSession> {
  if (session.timeZone) return session;
  const detected = detectTimeZone();
  if (!detected) return session;
  try {
    return await updateTimeZone(detected);
  } catch {
    return session;
  }
}
