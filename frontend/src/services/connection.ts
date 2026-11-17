import { Network } from "@capacitor/network";
import { isNativeApp } from "../hooks/useNativeApp";
import { API_BASE_URL } from "./apiConfig";
import { authHeaders } from "./authApi";

/**
 * Estado de la conexión en cuatro valores:
 * - offline: el dispositivo no tiene red.
 * - unreachable: hay red pero la API no responde (o da 502/503/504).
 * - recovered: acaba de volver (se confirma unos segundos).
 * - online: todo normal.
 */
export type ConnectionState = "online" | "offline" | "unreachable" | "recovered";

const RECOVERED_MS = 3500;
const RECHECK_MS = 8000;

let deviceOnline = typeof navigator === "undefined" ? true : navigator.onLine;
let apiOk = true;
let recoveredUntil = 0;
let recoveredTimer: ReturnType<typeof setTimeout> | null = null;
let recheckTimer: ReturnType<typeof setInterval> | null = null;
let state: ConnectionState = "online";
const listeners = new Set<() => void>();

function compute(): ConnectionState {
  if (!deviceOnline) return "offline";
  if (!apiOk) return "unreachable";
  return Date.now() < recoveredUntil ? "recovered" : "online";
}

function refresh() {
  const wasProblem = state === "offline" || state === "unreachable";
  const next = compute();
  if (wasProblem && (next === "online" || next === "recovered")) {
    // Volvió: se confirma y las pantallas vuelven a pedir sus datos.
    recoveredUntil = Date.now() + RECOVERED_MS;
    if (recoveredTimer) clearTimeout(recoveredTimer);
    recoveredTimer = setTimeout(refresh, RECOVERED_MS + 50);
    window.dispatchEvent(new Event("myorbit:recovered"));
  }
  const final = compute();
  const hasProblem = final === "offline" || final === "unreachable";
  if (final !== state) {
    state = final;
    listeners.forEach((listener) => listener());
  }
  if (hasProblem && !recheckTimer) recheckTimer = setInterval(() => { if (document.visibilityState === "visible") void retryConnection(); }, RECHECK_MS);
  if (!hasProblem && recheckTimer) { clearInterval(recheckTimer); recheckTimer = null; }
}

export function subscribeConnection(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getConnectionState(): ConnectionState {
  return state;
}

/** Lo llama el envoltorio de `fetch` con el resultado de cada petición a la API. */
export function reportApiResult(reachable: boolean) {
  if (apiOk === reachable) return;
  apiOk = reachable;
  refresh();
}

/** Respuestas que significan «el servidor no está»: caída del proxy, servicio no disponible, tiempo agotado. */
export const isUnreachableStatus = (status: number) => status === 502 || status === 503 || status === 504;

/** «Reintentar»: pregunta a la API si responde. Un 401 también cuenta: el servidor contestó. */
export async function retryConnection(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, { headers: authHeaders() });
    reportApiResult(!isUnreachableStatus(response.status));
  } catch {
    // el envoltorio de fetch ya marcó el fallo
  }
}

export function startConnectionMonitor() {
  window.addEventListener("online", () => { deviceOnline = true; refresh(); void retryConnection(); });
  window.addEventListener("offline", () => { deviceOnline = false; refresh(); });
  // En la app instalada `navigator.onLine` es poco fiable: se usa el plugin nativo.
  if (isNativeApp) {
    Network.getStatus().then((status) => { deviceOnline = status.connected; refresh(); }).catch(() => undefined);
    Network.addListener("networkStatusChange", (status) => { deviceOnline = status.connected; refresh(); if (status.connected) void retryConnection(); }).catch(() => undefined);
  }
  refresh();
}
