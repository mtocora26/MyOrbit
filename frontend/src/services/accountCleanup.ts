import { clearAgendaWidget } from "./agendaWidget";
import { clearSession } from "./authApi";
import { clearLocalReminders } from "./localReminders";
import { discardAllOps } from "./outbox";
import { forgetWebPush } from "./pushApi";

/** Preferencias de la cuenta guardadas en el dispositivo (el tema y los permisos son del teléfono y se conservan). */
const ACCOUNT_KEYS = ["myorbit.tasks.filters", "myorbit.quickadd.category"];

/**
 * La cuenta ya no existe en el servidor: no debe quedar nada suyo en el dispositivo. Cada limpieza es independiente;
 * si una falla, las demás se hacen igual y la sesión se cierra siempre.
 */
export async function forgetAccountOnDevice(userId: string): Promise<void> {
  await Promise.allSettled([discardAllOps(userId), clearLocalReminders(), clearAgendaWidget(), forgetWebPush()]);
  try {
    ACCOUNT_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Sin almacenamiento no hay nada que borrar.
  }
  clearSession();
}
