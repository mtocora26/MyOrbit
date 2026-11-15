import { useEffect, useRef, useState } from "react";
import { BottomSheet } from "./shared";
import { fromTaskDue, nextMondayInputValue, todayInputValue, tomorrowInputValue } from "../services/taskDue";

interface RescheduleTarget {
  label: string;
  rawDue: string;
}

interface Props {
  /** Tarea a mover; null = hoja cerrada. */
  task: RescheduleTarget | null;
  onClose: () => void;
  /** Recibe la fecha elegida como AAAA-MM-DD; la hora de la tarea se conserva. */
  onPick: (date: string) => void;
}

/** «lun 17 nov»: el día completo en una línea, para que se vea a qué fecha va cada opción. */
function shortDate(date: string): string {
  return new Date(`${date}T00:00`).toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" }).replace(/\./g, "");
}

/**
 * Reprogramar en dos toques: tocar la fecha de la tarea y elegir «Hoy», «Mañana» o «Próximo lunes».
 * «Elegir fecha» abre el selector solo cuando hace falta (tres toques).
 */
export default function RescheduleSheet({ task, onClose, onPick }: Props) {
  const [picking, setPicking] = useState(false);
  const [date, setDate] = useState("");
  // Se recuerda la última tarea para que el contenido no desaparezca durante la animación de salida.
  const lastTask = useRef(task);
  if (task) lastTask.current = task;
  const shown = lastTask.current;

  useEffect(() => {
    setPicking(false);
    setDate(fromTaskDue(task?.rawDue ?? "").date || todayInputValue());
  }, [task]);

  const options = [
    { label: "Hoy", date: todayInputValue() },
    { label: "Mañana", date: tomorrowInputValue() },
    { label: "Próximo lunes", date: nextMondayInputValue() },
  ];

  return (
    <BottomSheet open={task !== null} onClose={onClose} title="Mover a…">
      {shown && <p className="-mt-2 mb-3 truncate text-[14px] text-ink-2">{shown.label}</p>}
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => onPick(option.date)}
            className="flex min-h-[56px] items-center justify-between rounded-md border border-line px-4 text-left text-[16px] font-semibold text-ink transition-[background-color,transform] duration-150 ease-out active:scale-[0.985] active:bg-wash"
          >
            <span>{option.label}</span>
            <span className="num text-[14px] font-medium text-ink-2">{shortDate(option.date)}</span>
          </button>
        ))}
        {picking ? (
          <div className="flex gap-2">
            <input
              type="date"
              autoFocus
              value={date}
              onChange={(event) => setDate(event.target.value)}
              aria-label="Fecha"
              className="min-h-[56px] min-w-0 flex-1 rounded-md border border-line bg-card px-3 text-[16px] text-ink outline-none focus:border-coral"
            />
            <button
              type="button"
              onClick={() => date && onPick(date)}
              disabled={!date}
              className="min-h-[56px] flex-shrink-0 rounded-md bg-coral px-5 text-[16px] font-semibold text-night transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
            >
              Mover
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="flex min-h-[56px] items-center justify-between rounded-md border border-line px-4 text-left text-[16px] font-semibold text-ink transition-[background-color,transform] duration-150 ease-out active:scale-[0.985] active:bg-wash"
          >
            <span>Elegir fecha</span>
            <span className="text-[14px] font-medium text-ink-2">Calendario</span>
          </button>
        )}
      </div>
      <button type="button" onClick={onClose} className="mt-2 min-h-[44px] w-full text-[15px] font-semibold text-ink-2">Cancelar</button>
    </BottomSheet>
  );
}
