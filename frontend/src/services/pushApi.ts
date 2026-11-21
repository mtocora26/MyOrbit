import { readErrorMessage } from "./apiError";
import { authHeaders } from "./authApi";
import { API_BASE_URL } from "./apiConfig";

interface PushConfig { webPublicKey: string | null; webAvailable: boolean; fcmAvailable: boolean; }

export type WebPushState = "unsupported" | "needs-install" | "unavailable" | "denied" | "off" | "on";

async function fetchPushConfig(): Promise<PushConfig> {
  const response = await fetch(`${API_BASE_URL}/api/push/config`, { headers: authHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible consultar los avisos push"));
  return response.json();
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInstalled(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
}

function supportsWebPush(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration();
  return registration ? registration.pushManager.getSubscription() : null;
}

/** Estado del push web en este navegador: si se puede, si falta instalar la PWA (iPhone) y si ya está activo. */
export async function webPushState(): Promise<WebPushState> {
  if (!supportsWebPush()) return isIos() && !isInstalled() ? "needs-install" : "unsupported";
  if (Notification.permission === "denied") return "denied";
  try {
    const config = await fetchPushConfig();
    if (!config.webAvailable || !config.webPublicKey) return "unavailable";
    return (await currentSubscription()) ? "on" : "off";
  } catch {
    return "unavailable";
  }
}

function toKey(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

/** Pide el permiso (solo se llama desde un toque del usuario), suscribe este navegador y lo registra en la cuenta. */
export async function enableWebPush(): Promise<WebPushState> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "off";
  const config = await fetchPushConfig();
  if (!config.webAvailable || !config.webPublicKey) return "unavailable";
  const registration = await navigator.serviceWorker.ready;
  const subscription = (await registration.pushManager.getSubscription())
    ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(config.webPublicKey) });
  const json = subscription.toJSON();
  const response = await fetch(`${API_BASE_URL}/api/push/subscriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ channel: "WEB", address: subscription.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth }),
  });
  if (!response.ok) {
    await subscription.unsubscribe().catch(() => false);
    throw new Error(await readErrorMessage(response, "No fue posible activar los avisos push"));
  }
  return "on";
}

/** Quita este navegador de la cuenta y cancela su suscripción. */
export async function disableWebPush(): Promise<void> {
  const subscription = await currentSubscription();
  if (!subscription) return;
  const response = await fetch(`${API_BASE_URL}/api/push/subscriptions?address=${encodeURIComponent(subscription.endpoint)}`, { method: "DELETE", headers: authHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible desactivar los avisos push"));
  await subscription.unsubscribe().catch(() => false);
}
