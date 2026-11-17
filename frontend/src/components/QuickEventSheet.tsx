import { useEffect, useState } from "react";
import EventFormSheet from "./EventFormSheet";
import { fetchCategories, type Category } from "../services/categoriesApi";
import { fetchSubjects, type Subject } from "../services/subjectsApi";
import { todayInputValue } from "../services/taskDue";
import type { CalendarEvent } from "../services/eventsApi";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Se avisa al crear para que la Agenda vuelva a pedir sus eventos. */
  onSaved: (event: CalendarEvent) => void;
}

/** Formulario de evento abierto desde «+»: carga categorías y materias y reutiliza el de la Agenda. */
export default function QuickEventSheet({ open, onClose, onSaved }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Las dos listas son opcionales: si no cargan, el evento se crea igual, sin categoría ni materia.
  useEffect(() => {
    if (!open) return;
    fetchCategories().then(setCategories).catch(() => setCategories([]));
    fetchSubjects().then(setSubjects).catch(() => setSubjects([]));
  }, [open]);

  return <EventFormSheet open={open} onClose={onClose} event={null} defaultDate={todayInputValue()} subjects={subjects} categories={categories} onSaved={onSaved} onDeleted={() => undefined} />;
}
