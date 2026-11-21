import { useCallback, useEffect, useState } from "react";
import { BottomSheet } from "./shared";
import { IconCheckCircle } from "./icons";
import { confirmAutoStart, reminderSetupSteps, runSetupStep, type SetupStep } from "../services/devicePermissions";
import { setLocalRemindersEnabled, syncLocalReminders } from "../services/localReminders";

interface Props { open: boolean; onClose: () => void; }

/**
 * Lista lo que falta para que los avisos suenen con la app cerrada y lleva directo a cada ajuste.
 * Se vuelve a comprobar cada vez que el usuario regresa de los ajustes del sistema.
 */
export default function ReminderSetupSheet({ open, onClose }: Props) {
  const [steps, setSteps] = useState<SetupStep[] | null>(null);

  const refresh = useCallback(() => {
    reminderSetupSteps().then(setSteps).catch(() => setSteps([]));
  }, []);

  useEffect(() => {
    if (!open) return;
    refresh();
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [open, refresh]);

  async function handle(step: SetupStep) {
    await runSetupStep(step.id).catch(() => undefined);
    if (step.id === "notifications") {
      setLocalRemindersEnabled(true);
      syncLocalReminders().catch(() => undefined);
    }
    // El inicio automático no se puede leer: al abrir su pantalla se da por hecho.
    if (step.id === "autostart") confirmAutoStart();
    refresh();
  }

  const pending = steps?.filter((step) => !step.done).length ?? 0;
  const allDone = steps !== null && pending === 0;

  return (
    <BottomSheet open={open} onClose={onClose} title="Que tus avisos lleguen">
      <p className="mb-4 text-[14px] leading-relaxed text-ink-2">
        {allDone ? "Todo listo: los avisos sonarán a su hora aunque la app esté cerrada." : "Tu teléfono puede silenciar los avisos si la app está cerrada. Activa estos ajustes una sola vez."}
      </p>
      <ul className="flex flex-col gap-2">
        {steps?.map((step) => (
          <li key={step.id} className="flex items-center gap-3 rounded-lg border border-line px-3 py-3">
            <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center ${step.done ? "text-green" : "text-ink-3"}`} aria-hidden="true">
              {step.done ? <IconCheckCircle size={22} /> : <span className="h-5 w-5 rounded-full border-2 border-current" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-ink">{step.title}</p>
              {!step.done && <p className="mt-0.5 text-[13px] leading-snug text-ink-2">{step.why}</p>}
            </div>
            {!step.done && (
              <button onClick={() => handle(step)} className="min-h-[44px] flex-shrink-0 rounded-md bg-coral px-4 text-[14px] font-bold text-white transition-transform active:scale-[0.97]">{step.action}</button>
            )}
          </li>
        ))}
      </ul>
      <button onClick={onClose} className="mt-4 min-h-[44px] w-full text-[14px] font-semibold text-ink-2">{allDone ? "Listo" : "Ahora no"}</button>
    </BottomSheet>
  );
}
