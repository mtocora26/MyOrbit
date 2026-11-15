import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";

/** true dentro del APK de Capacitor; false en el navegador y en la PWA instalada. */
export const isNativeApp = Capacitor.isNativePlatform();

/** Oculta el splash nativo cuando React ya pintó la primera pantalla (si no, se oculta solo a los 3 s). */
export function hideSplash(): void {
  if (isNativeApp) SplashScreen.hide().catch(() => undefined);
}

// Pila de manejadores del botón «atrás» de Android: el último en registrarse (una hoja inferior abierta) responde
// primero; si ninguno lo atiende, la app se cierra. En la web no hay botón «atrás» propio: todo esto no hace nada.
type BackHandler = () => boolean;
const handlers: BackHandler[] = [];
let listening = false;

function ensureListener(): void {
  if (listening || !isNativeApp) return;
  listening = true;
  CapacitorApp.addListener("backButton", () => {
    for (let index = handlers.length - 1; index >= 0; index -= 1) {
      if (handlers[index]()) return;
    }
    CapacitorApp.exitApp().catch(() => undefined);
  }).catch(() => { listening = false; });
}

/** Registra un manejador de «atrás»: devuelve true si lo atendió. Devuelve la función que lo quita. */
export function registerBackHandler(handler: BackHandler): () => void {
  if (!isNativeApp) return () => undefined;
  ensureListener();
  handlers.push(handler);
  return () => {
    const index = handlers.lastIndexOf(handler);
    if (index >= 0) handlers.splice(index, 1);
  };
}

/** Manejador de «atrás» de la pantalla raíz. Siempre usa la versión más reciente de `handler`. */
export function useBackHandler(handler: BackHandler): void {
  const latest = useRef(handler);
  latest.current = handler;
  useEffect(() => registerBackHandler(() => latest.current()), []);
}
