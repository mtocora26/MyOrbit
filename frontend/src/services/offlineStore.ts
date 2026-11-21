/**
 * Copia persistente de las lecturas de la API (GET) para usar la app sin conexión.
 *
 * Cada GET que responde bien se guarda en IndexedDB; si después no hay red o el servidor no responde, ese mismo
 * GET devuelve lo último guardado. Está pensado para colgarse del `fetch` global (ver `translateNetworkErrors`),
 * así cubre todas las pantallas y los avisos del teléfono sin tocarlos. Reglas:
 * - Una copia por usuario: la clave lleva el id de la sesión y todo se borra al cerrar sesión o cambiar de cuenta.
 * - Solo lecturas de datos (nunca `/api/auth`, `/api/push` ni `/api/admin`) y solo respuestas JSON correctas.
 * - Un 401 o un 4xx nunca se reemplaza por la copia: solo fallos de red y 502/503/504.
 * - Si IndexedDB no existe o falla, todo sigue funcionando sin copia.
 */

const DB_NAME = "myorbit-offline";
/** Súbela cuando cambie la forma de lo guardado: la copia anterior se descarta en vez de romper la app. */
const DB_VERSION = 1;
const STORE = "responses";
const MAX_ENTRIES = 150;
const SESSION_KEY = "myorbit.session";
const LAST_SYNC_KEY = "myorbit.lastSync";
const EXCLUDED = ["/api/auth/", "/api/push/", "/api/admin"];

interface StoredResponse {
  key: string;
  savedAt: number;
  body: string;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;
let savesSinceTrim = 0;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (db.objectStoreNames.contains(STORE)) db.deleteObjectStore(STORE);
        db.createObjectStore(STORE, { keyPath: "key" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function done(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => resolve();
    transaction.onabort = () => resolve();
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T | undefined> {
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(undefined);
  });
}

function sessionId(): string | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? (JSON.parse(stored) as { id?: string }).id ?? null : null;
  } catch {
    return null;
  }
}

/** Clave de una lectura cacheable, o null si no se debe guardar (otra verbo, ruta excluida o sin sesión). */
export function cacheKeyFor(method: string, url: string): string | null {
  if (method.toUpperCase() !== "GET") return null;
  const start = url.indexOf("/api/");
  if (start < 0) return null;
  const path = url.slice(start);
  if (EXCLUDED.some((prefix) => path.startsWith(prefix))) return null;
  const owner = sessionId();
  return owner ? `${owner}|${path}` : null;
}

export async function saveResponse(key: string, body: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    const transaction = db.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).put({ key, savedAt: Date.now(), body } satisfies StoredResponse);
    await done(transaction);
    try { localStorage.setItem(LAST_SYNC_KEY, String(Date.now())); } catch { /* la marca de hora es opcional */ }
    if (++savesSinceTrim >= 25) {
      savesSinceTrim = 0;
      void trimOldEntries(db);
    }
  } catch {
    // Sin espacio o sin permiso: se sigue sin copia.
  }
}

export async function loadResponse(key: string): Promise<string | null> {
  const db = await openDb();
  if (!db) return null;
  try {
    const stored = await requestResult<StoredResponse>(db.transaction(STORE, "readonly").objectStore(STORE).get(key));
    return stored?.body ?? null;
  } catch {
    return null;
  }
}

/** Deja como máximo `MAX_ENTRIES` copias, quitando las más viejas (consultas con filtros distintos se acumulan). */
async function trimOldEntries(db: IDBDatabase): Promise<void> {
  try {
    const all = await requestResult<StoredResponse[]>(db.transaction(STORE, "readonly").objectStore(STORE).getAll());
    if (!all || all.length <= MAX_ENTRIES) return;
    const transaction = db.transaction(STORE, "readwrite");
    all.sort((a, b) => a.savedAt - b.savedAt).slice(0, all.length - MAX_ENTRIES).forEach((entry) => transaction.objectStore(STORE).delete(entry.key));
    await done(transaction);
  } catch {
    // Limpieza opcional.
  }
}

/** Borra toda la copia. Se llama al cerrar sesión y al entrar con otra cuenta. */
export async function clearOfflineData(): Promise<void> {
  try { localStorage.removeItem(LAST_SYNC_KEY); } catch { /* nada que borrar */ }
  const db = await openDb();
  if (!db) return;
  try {
    const transaction = db.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).clear();
    await done(transaction);
  } catch {
    // Nada que borrar.
  }
}

/** Cuándo se guardó por última vez una lectura correcta; null si nunca. */
export function lastSyncedAt(): Date | null {
  try {
    const value = Number(localStorage.getItem(LAST_SYNC_KEY));
    return value > 0 ? new Date(value) : null;
  } catch {
    return null;
  }
}
