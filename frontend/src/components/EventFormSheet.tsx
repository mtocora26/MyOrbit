import { useEffect, useState } from "react";
import { BottomSheet } from "./shared";
import SubjectPicker from "./SubjectPicker";
import { categoryLabel, orderCategories, type Category } from "../services/categoriesApi";
import { createEvent, deleteEvent, updateEvent, type CalendarEvent } from "../services/eventsApi";
import type { Subject } from "../services/subjectsApi";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Evento a editar; null crea uno nuevo. */
  event: CalendarEvent | null;
  /** Día preseleccionado al crear (AAAA-MM-DD). */
  defaultDate: string;
  subjects: Subject[];
  categories: Category[];
  onSaved: (event: CalendarEvent) => void;
  onDeleted: (id: string) => void;
}

export default function EventFormSheet({ open, onClose, event, defaultDate, subjects, categories, onSaved, onDeleted }: Props) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(defaultDate);
  const [multiDay, setMultiDay] = useState(false);
  const [endDate, setEndDate] = useState(defaultDate);
  const [withTime, setWithTime] = useState(false);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // El formulario se precarga cada vez que se abre.
  useEffect(() => {
    if (!open) return;
    setTitle(event?.title ?? "");
    setStartDate(event?.startDate ?? defaultDate);
    setMultiDay(event?.multiDay ?? false);
    setEndDate(event?.endDate ?? defaultDate);
    setWithTime(!!event?.startTime);
    setStartTime(event?.startTime ?? "08:00");
    setEndTime(event?.endTime ?? "");
    setSubjectId(event?.subjectId ?? "");
    setCategoryId(event?.categoryId ?? "");
    setConfirmingDelete(false);
    setError(null);
  }, [open, event, defaultDate]);

  const lastDay = multiDay ? endDate : startDate;
  const rangeInvalid = multiDay && (!endDate || endDate < startDate);
  // En un evento de un solo día la hora de fin debe ser posterior a la de inicio; en varios días son de días distintos.
  const timeInvalid = withTime && (!startTime || (!!endTime && lastDay === startDate && endTime <= startTime));
  const canSubmit = title.trim() !== "" && !!startDate && !rangeInvalid && !timeInvalid && !busy;

  function close() {
    if (!busy) onClose();
  }

  async function submit(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    if (!canSubmit) return;
    try {
      setBusy(true);
      setError(null);
      const input = {
        title: title.trim(),
        startDate,
        endDate: multiDay && endDate !== startDate ? endDate : null,
        startTime: withTime ? startTime : null,
        endTime: withTime && endTime ? endTime : null,
        subjectId: subjectId || null,
        categoryId: categoryId || null,
      };
      const saved = event ? await updateEvent(event.id, input) : await createEvent(input);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar el evento");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!event || busy) return;
    try {
      setBusy(true);
      setError(null);
      await deleteEvent(event.id);
      onDeleted(event.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible eliminar el evento");
    } finally {
      setBusy(false);
    }
  }

  const field = "min-h-[44px] rounded-md border border-line bg-card px-3 py-2.5 text-[16px] text-ink outline-none focus:border-coral";

  return (
    <BottomSheet open={open} onClose={close} title={confirmingDelete ? "Eliminar evento" : event ? "Editar evento" : "Nuevo evento"}>
      {confirmingDelete && event ? (
        <div className="flex flex-col gap-4">
          <p className="text-[15px] leading-snug text-ink">¿Eliminar <strong className="font-semibold">{event.title}</strong>? Esta acción no se puede deshacer.</p>
          {error && <p role="alert" className="text-[14px] font-semibold text-danger">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirmingDelete(false)} disabled={busy} className="min-h-[48px] flex-1 rounded-md bg-wash text-[15px] font-semibold text-ink-2 disabled:opacity-50">Cancelar</button>
            <button type="button" onClick={remove} disabled={busy} className="min-h-[48px] flex-1 rounded-md bg-danger text-[15px] font-semibold text-white disabled:opacity-50">{busy ? "Eliminando..." : "Eliminar"}</button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[14px] font-semibold text-ink">Título</span>
            <input autoFocus value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Semana de parciales" className={field} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[14px] font-semibold text-ink">{multiDay ? "Desde" : "Fecha"}</span>
              <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); if (endDate < e.target.value) setEndDate(e.target.value); }} className={`num ${field}`} />
            </label>
            {multiDay && (
              <label className="flex flex-col gap-1.5">
                <span className="text-[14px] font-semibold text-ink">Hasta</span>
                <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} aria-invalid={rangeInvalid} className={`num ${field} ${rangeInvalid ? "border-danger-line" : ""}`} />
              </label>
            )}
          </div>
          <label className="flex min-h-[44px] items-center gap-3">
            <input type="checkbox" checked={multiDay} onChange={(e) => { setMultiDay(e.target.checked); if (e.target.checked && endDate < startDate) setEndDate(startDate); }} className="h-5 w-5 flex-shrink-0" style={{ accentColor: "var(--color-coral)" }} />
            <span className="text-[15px] text-ink">Dura varios días</span>
          </label>
          {rangeInvalid && <p role="alert" className="-mt-2 text-[14px] font-semibold text-danger">La fecha final no puede ser anterior a la inicial</p>}

          <label className="flex min-h-[44px] items-center gap-3">
            <input type="checkbox" checked={withTime} onChange={(e) => setWithTime(e.target.checked)} className="h-5 w-5 flex-shrink-0" style={{ accentColor: "var(--color-coral)" }} />
            <span className="text-[15px] text-ink">Con hora</span>
          </label>
          {withTime && (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[14px] font-semibold text-ink">{multiDay ? "Hora de inicio (primer día)" : "Inicio"}</span>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={`num ${field}`} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[14px] font-semibold text-ink">{multiDay ? "Hora de fin (último día)" : "Fin (opcional)"}</span>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} aria-invalid={timeInvalid} className={`num ${field} ${timeInvalid ? "border-danger-line" : ""}`} />
              </label>
            </div>
          )}
          {timeInvalid && <p role="alert" className="-mt-2 text-[14px] font-semibold text-danger">La hora de fin debe ser posterior a la de inicio</p>}

          <SubjectPicker subjects={subjects} value={subjectId} onChange={setSubjectId} />
          {categories.length > 0 && (
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-ink-2">Categoría (opcional)</span>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-label="Categoría del evento" className="min-h-[44px] rounded-md border border-line bg-card px-3 py-2.5 text-[14px] text-ink outline-none focus:border-coral">
                <option value="">Sin categoría</option>
                {orderCategories(categories).map((category) => <option key={category.id} value={category.id}>{categoryLabel(category, categories)}</option>)}
              </select>
            </label>
          )}

          {error && <p role="alert" className="text-[14px] font-semibold text-danger">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={close} disabled={busy} className="min-h-[48px] flex-1 rounded-md bg-wash text-[15px] font-semibold text-ink-2 disabled:opacity-50">Cancelar</button>
            <button type="submit" disabled={!canSubmit} className="min-h-[48px] flex-1 rounded-md bg-coral text-[15px] font-semibold text-night disabled:opacity-50">{busy ? "Guardando..." : event ? "Guardar cambios" : "Crear evento"}</button>
          </div>
          {event && (
            <button type="button" onClick={() => { setError(null); setConfirmingDelete(true); }} disabled={busy} className="min-h-[44px] self-center px-3 text-[14px] font-semibold text-danger disabled:opacity-50">Eliminar evento</button>
          )}
        </form>
      )}
    </BottomSheet>
  );
}
