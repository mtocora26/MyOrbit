import { API_BASE_URL } from "./apiConfig";
import { readErrorMessage } from "./apiError";
import { authHeaders, getSession } from "./authApi";
import { isUnreachableStatus } from "./connection";
import { done, openOfflineDb, OUTBOX_STORE, requestResult } from "./offlineStore";

/**
 * Cola de cambios hechos sin conexión (#216). Cuando crear, editar, marcar o borrar una tarea falla por falta de red,
 * el cambio se guarda aquí (en IndexedDB, así sobrevive a cerrar la app) y se envía en orden al volver la conexión.
 *
 * - Cada cambio lleva la hora en que el usuario lo hizo (`at`): el servidor la usa para no pisar un cambio más nuevo
 *   hecho desde otro dispositivo (409). Un cambio rechazado queda como «fallido» para que el usuario lo vea.
 * - La tarea creada sin conexión usa un UUID del cliente como id, así reenviar nunca la duplica.
 * - Solo se envían los cambios del usuario con sesión; los de otra cuenta esperan a que ella vuelva a entrar.
 */

export type OutboxKind = "createTask" | "updateTask" | "setTaskDone" | "deleteTask";

export interface OutboxOp {
  /** Clave autoincremental de IndexedDB; define el orden de envío. */
  seq?: number;
  userId: string;
  kind: OutboxKind;
  taskId: string;
  /** Nombre de la tarea al momento del cambio, para decirlo con palabras en la lista de pendientes. */
  label: string;
  payload: Record<string, unknown>;
  /** Instante ISO en que el usuario hizo el cambio. */
  at: string;
  attempts: number;
  /** Presente cuando el servidor rechazó el cambio: ya no se reintenta ni se muestra en pantalla. */
  error?: string;
}

const MAX_ATTEMPTS = 5;
const POLL_MS = 15_000;

let ops: OutboxOp[] = [];
let loaded: Promise<void> | null = null;
let flushing = false;
const listeners = new Set<() => void>();
let snapshot: OutboxSnapshot = { pending: 0, failed: [] };

export interface OutboxSnapshot {
  pending: number;
  failed: OutboxOp[];
}

function currentUserId(): string | null {
  return getSession()?.id ?? null;
}

function recompute() {
  const userId = currentUserId();
  const mine = ops.filter((op) => op.userId === userId);
  snapshot = { pending: mine.filter((op) => !op.error).length, failed: mine.filter((op) => op.error) };
  listeners.forEach((listener) => listener());
}

export function subscribeOutbox(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Estable entre llamadas mientras no cambie la cola (lo exige `useSyncExternalStore`). */
export function getOutboxSnapshot(): OutboxSnapshot {
  return snapshot;
}

/** Carga la cola guardada. Se llama sola antes de cualquier operación. */
export function loadOutbox(): Promise<void> {
  if (!loaded) {
    loaded = (async () => {
      const db = await openOfflineDb();
      if (db) {
        try {
          const stored = await requestResult<OutboxOp[]>(db.transaction(OUTBOX_STORE, "readonly").objectStore(OUTBOX_STORE).getAll());
          ops = (stored ?? []).sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
        } catch {
          ops = [];
        }
      }
      recompute();
    })();
  }
  return loaded;
}

async function persist(op: OutboxOp): Promise<void> {
  const db = await openOfflineDb();
  if (!db) return;
  try {
    const transaction = db.transaction(OUTBOX_STORE, "readwrite");
    const request = transaction.objectStore(OUTBOX_STORE).put(op);
    request.onsuccess = () => { if (op.seq === undefined) op.seq = Number(request.result); };
    await done(transaction);
  } catch {
    // Sin almacenamiento el cambio vive solo en memoria: se envía mientras la app siga abierta.
  }
}

async function erase(seq: number | undefined): Promise<void> {
  if (seq === undefined) return;
  const db = await openOfflineDb();
  if (!db) return;
  try {
    const transaction = db.transaction(OUTBOX_STORE, "readwrite");
    transaction.objectStore(OUTBOX_STORE).delete(seq);
    await done(transaction);
  } catch {
    // Se vuelve a intentar al enviar.
  }
}

/** Los cambios de la cuenta con sesión que siguen esperando (sin los fallidos), en orden de envío. */
export async function pendingOps(): Promise<OutboxOp[]> {
  await loadOutbox();
  const userId = currentUserId();
  return ops.filter((op) => op.userId === userId && !op.error);
}

export async function hasPendingOps(): Promise<boolean> {
  return (await pendingOps()).length > 0;
}

async function drop(predicate: (op: OutboxOp) => boolean): Promise<void> {
  const removed = ops.filter(predicate);
  ops = ops.filter((op) => !predicate(op));
  await Promise.all(removed.map((op) => erase(op.seq)));
}

/**
 * Añade un cambio a la cola. Para no enviar de más:
 * - borrar una tarea que aún no existe en el servidor cancela todo lo que se hizo con ella;
 * - borrar una existente descarta sus cambios pendientes (el borrado manda);
 * - marcar hecha/no hecha varias veces deja solo la última.
 */
export async function enqueue(input: Omit<OutboxOp, "seq" | "attempts" | "userId" | "error">): Promise<void> {
  await loadOutbox();
  const userId = currentUserId();
  if (!userId) return;
  const op: OutboxOp = { ...input, userId, attempts: 0 };
  const mine = (candidate: OutboxOp) => candidate.userId === userId && !candidate.error && candidate.taskId === op.taskId;

  if (op.kind === "deleteTask") {
    const neverSent = ops.some((candidate) => mine(candidate) && candidate.kind === "createTask");
    await drop(mine);
    if (!neverSent) await add(op);
  } else {
    if (op.kind === "setTaskDone") await drop((candidate) => mine(candidate) && candidate.kind === "setTaskDone");
    await add(op);
  }
  recompute();
  // Si la red ya volvió (se encola por no poder enviar, pero a veces fue algo momentáneo), se intenta enseguida.
  void flushOutbox();
}

async function add(op: OutboxOp): Promise<void> {
  await persist(op);
  ops.push(op);
}

/** Quita un cambio fallido de la lista (el usuario lo descarta). */
export async function discardOp(seq: number): Promise<void> {
  await loadOutbox();
  await drop((op) => op.seq === seq);
  recompute();
  window.dispatchEvent(new Event("myorbit:synced"));
}

/** La cuenta se eliminó: sus cambios sin enviar ya no tienen destino. */
export async function discardAllOps(userId: string): Promise<void> {
  await loadOutbox();
  await drop((op) => op.userId === userId);
  recompute();
}

/** Vuelve a poner en espera un cambio fallido. */
export async function retryOp(seq: number): Promise<void> {
  await loadOutbox();
  const op = ops.find((candidate) => candidate.seq === seq);
  if (!op) return;
  delete op.error;
  op.attempts = 0;
  await persist(op);
  recompute();
  void flushOutbox();
}

function requestFor(op: OutboxOp): { method: string; path: string; body?: Record<string, unknown> } {
  const id = encodeURIComponent(op.taskId);
  switch (op.kind) {
    case "createTask": return { method: "POST", path: "/api/tasks", body: { ...op.payload, id: op.taskId } };
    case "updateTask": return { method: "PUT", path: `/api/tasks/${id}`, body: { ...op.payload, clientTime: op.at } };
    case "setTaskDone": return { method: "PATCH", path: `/api/tasks/${id}/status`, body: { ...op.payload, clientTime: op.at } };
    case "deleteTask": return { method: "DELETE", path: `/api/tasks/${id}` };
  }
}

type SendOutcome =
  | { result: "sent" }
  /** Parar y volver a intentar luego. `counts`: si cuenta como intento fallido (un error del servidor sí; no tener red no). */
  | { result: "retry"; counts: boolean }
  | { result: "failed"; message: string };

/** Envía un cambio. «failed» = el servidor lo rechazó para siempre. */
async function send(op: OutboxOp): Promise<SendOutcome> {
  const { method, path, body } = requestFor(op);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json", ...authHeaders() } : authHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { result: "retry", counts: false };
  }
  if (response.ok) return { result: "sent" };
  // Borrar algo que ya no existe es borrar: el resultado que se quería.
  if (op.kind === "deleteTask" && response.status === 404) return { result: "sent" };
  if (isUnreachableStatus(response.status) || response.status === 401 || response.status === 429) return { result: "retry", counts: false };
  if (response.status >= 500) return { result: "retry", counts: true };
  return { result: "failed", message: await readErrorMessage(response, "El servidor no aceptó este cambio") };
}

/**
 * Envía en orden lo pendiente. Se detiene en el primer fallo de red para conservar el orden y reintenta después;
 * un rechazo definitivo (409, 400…) marca ese cambio como fallido y sigue con el resto.
 */
export async function flushOutbox(): Promise<void> {
  if (flushing) return;
  await loadOutbox();
  flushing = true;
  let changed = false;
  try {
    for (const op of await pendingOps()) {
      const outcome = await send(op);
      if (outcome.result === "retry") {
        if (outcome.counts && ++op.attempts >= MAX_ATTEMPTS) {
          op.error = "El servidor falló varias veces al recibir este cambio";
          await persist(op);
          changed = true;
        }
        break;
      }
      changed = true;
      if (outcome.result === "sent") {
        await drop((candidate) => candidate.seq === op.seq);
      } else {
        op.error = outcome.message;
        await persist(op);
        // Si no se pudo crear la tarea, lo que dependía de ella ya no tiene a qué aplicarse.
        if (op.kind === "createTask") await drop((candidate) => candidate.taskId === op.taskId && candidate.seq !== op.seq && !candidate.error);
      }
    }
  } finally {
    flushing = false;
    recompute();
    if (changed) window.dispatchEvent(new Event("myorbit:synced"));
  }
}

/** Arranca el envío automático: al abrir, al volver la red y cada pocos segundos mientras haya algo pendiente. */
export function startOutboxSync(): () => void {
  void loadOutbox().then(() => flushOutbox());
  const onBack = () => { void flushOutbox(); };
  window.addEventListener("online", onBack);
  window.addEventListener("myorbit:recovered", onBack);
  const timer = window.setInterval(() => {
    if (document.visibilityState === "visible" && snapshot.pending > 0) void flushOutbox();
  }, POLL_MS);
  return () => {
    window.removeEventListener("online", onBack);
    window.removeEventListener("myorbit:recovered", onBack);
    window.clearInterval(timer);
  };
}
