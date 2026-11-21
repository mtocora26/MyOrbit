import { registerPlugin } from "@capacitor/core";
import { isNativeApp } from "../hooks/useNativeApp";
import { exactAlarmsAllowed, localReminderPermission, requestExactAlarms, requestLocalReminderPermission } from "./localReminders";

/** Plugin propio de Android (`DeviceSettingsPlugin.java`): ajustes del fabricante que frenan los avisos. */
interface DeviceSettingsPlugin {
  batteryStatus(): Promise<{ unrestricted: boolean }>;
  requestUnrestrictedBattery(): Promise<void>;
  autoStartStatus(): Promise<{ available: boolean }>;
  openAutoStart(): Promise<{ opened: boolean }>;
}

const DeviceSettings = registerPlugin<DeviceSettingsPlugin>("DeviceSettings");

export type SetupStepId = "notifications" | "exact" | "battery" | "autostart";

export interface SetupStep {
  id: SetupStepId;
  title: string;
  why: string;
  action: string;
  done: boolean;
}

const AUTOSTART_KEY = "myorbit.autostartConfirmed";

function autoStartConfirmed(): boolean {
  try {
    return localStorage.getItem(AUTOSTART_KEY) === "yes";
  } catch {
    return false;
  }
}

/** Android no dice si el inicio automático está activo: se recuerda que el usuario abrió su pantalla. */
export function confirmAutoStart(): void {
  try {
    localStorage.setItem(AUTOSTART_KEY, "yes");
  } catch {
    // Sin almacenamiento se vuelve a preguntar la próxima vez.
  }
}

/** Lo que falta para que los avisos lleguen con la app cerrada. Vacío fuera de Android. */
export async function reminderSetupSteps(): Promise<SetupStep[]> {
  if (!isNativeApp) return [];
  const [notifications, exact, battery, autostart] = await Promise.all([
    localReminderPermission().catch(() => "unavailable" as const),
    exactAlarmsAllowed(),
    DeviceSettings.batteryStatus().then((status) => status.unrestricted).catch(() => true),
    DeviceSettings.autoStartStatus().then((status) => status.available).catch(() => false),
  ]);
  const steps: SetupStep[] = [
    { id: "notifications", title: "Permitir notificaciones", why: "Sin esto Android no muestra ningún aviso.", action: "Permitir", done: notifications === "granted" },
    { id: "exact", title: "Alarmas y recordatorios", why: "Para que suenen a la hora exacta y no minutos después.", action: "Permitir", done: exact },
    { id: "battery", title: "Batería sin restricciones", why: "Evita que el ahorro de batería frene los avisos.", action: "Permitir", done: battery },
  ];
  if (autostart) {
    steps.push({ id: "autostart", title: "Inicio automático", why: "Tu teléfono cierra las apps que no están abiertas. Actívalo para MyOrbit y los avisos llegan con la app cerrada.", action: "Abrir ajuste", done: autoStartConfirmed() });
  }
  return steps;
}

/** Lanza el ajuste de un paso. El resultado se vuelve a leer con `reminderSetupSteps` al volver a la app. */
export async function runSetupStep(id: SetupStepId): Promise<void> {
  switch (id) {
    case "notifications":
      await requestLocalReminderPermission();
      break;
    case "exact":
      await requestExactAlarms();
      break;
    case "battery":
      await DeviceSettings.requestUnrestrictedBattery();
      break;
    case "autostart":
      await DeviceSettings.openAutoStart();
      break;
  }
}
