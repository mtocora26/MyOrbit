import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChoiceChip, EmptyState, ScreenHeader, ListSkeleton, ErrorBanner } from "../components/shared";
import { IconBell, IconCalendar, IconCheckCircle, IconClock, IconGraduation, IconHabit } from "../components/icons";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead, type AppNotification, type NotificationType } from "../services/notificationsApi";
import { deleteReminder, fetchReminders, type PersonalReminder } from "../services/remindersApi";

interface Props {
  onBack: () => void;
  /** Se informa cada vez que cambia la cantidad de no leídas para mantener la campana al día. */
  onUnreadChange: (count: number) => void;
  onOpenTask: (taskId: string) => void;
  onOpenHabits: () => void;
  onOpenUniversity: () => void;
  onOpenTasks: () => void;
  onOpenAgenda: () => void;
}

type Filter = "todas" | "sin-leer";

const TYPE_STYLE: Record<NotificationType, { icon: ReactNode; color: string; bg: string; label: string }> = {
  DEADLINE: { icon: <IconClock size={20} />, color: "var(--color-amber-ink)", bg: "var(--color-amber-wash)", label: "Fecha límite" },
  OVERDUE: { icon: <IconClock size={20} />, color: "var(--color-coral-ink)", bg: "var(--color-coral-wash)", label: "Vencidas" },
  EXAM: { icon: <IconGraduation size={20} />, color: "var(--color-green-ink)", bg: "var(--color-green-wash)", label: "Evaluación" },
  CLASS: { icon: <IconCalendar size={20} />, color: "var(--color-violet-ink)", bg: "var(--color-violet-wash)", label: "Agenda" },
  AT_RISK: { icon: <IconGraduation size={20} />, color: "var(--color-coral-ink)", bg: "var(--color-coral-wash)", label: "En riesgo" },
  HABIT: { icon: <IconHabit size={20} />, color: "var(--color-violet-ink)", bg: "var(--color-violet-wash)", label: "Hábito" },
  REMINDER: { icon: <IconBell size={20} />, color: "var(--color-blue-ink)", bg: "var(--color-blue-wash)", label: "Recordatorio" },
};

/** Avisos antiguos de tipos que ya no existen (p. ej. «tarea completada»). */
const LEGACY_STYLE = { icon: <IconCheckCircle size={20} />, color: "var(--color-green-ink)", bg: "var(--color-green-wash)", label: "Aviso" };

export function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (Number.isNaN(minutes) || minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  return new Date(iso).toLocaleDateString("es", { day: "2-digit", month: "short" });
}

export default function NotificationsScreen({ onBack, onUnreadChange, onOpenTask, onOpenHabits, onOpenUniversity, onOpenTasks, onOpenAgenda }: Props) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("todas");
  const [busy, setBusy] = useState(false);
  const [scheduled, setScheduled] = useState<PersonalReminder[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Los programados son un extra: si no cargan, la bandeja funciona igual.
  useEffect(() => { fetchReminders().then(setScheduled).catch(() => setScheduled([])); }, []);

  async function removeReminder(id: string) {
    if (removingId) return;
    try {
      setRemovingId(id);
      setError(null);
      await deleteReminder(id);
      setScheduled((current) => current.filter((reminder) => reminder.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible quitar el recordatorio");
    } finally {
      setRemovingId(null);
    }
  }

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const list = await fetchNotifications();
      setItems(list);
      onUnreadChange(list.filter((item) => !item.read).length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar las notificaciones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const unread = items.filter((item) => !item.read).length;
  const visible = useMemo(() => (filter === "sin-leer" ? items.filter((item) => !item.read) : items), [items, filter]);

  function apply(next: AppNotification[]) {
    setItems(next);
    onUnreadChange(next.filter((item) => !item.read).length);
  }

  async function open(notification: AppNotification) {
    if (!notification.read) {
      const previous = items;
      apply(items.map((item) => item.id === notification.id ? { ...item, read: true } : item));
      markNotificationRead(notification.id).catch(() => { apply(previous); setError("No fue posible marcar la notificación"); });
    }
    if (notification.type === "HABIT") onOpenHabits();
    else if (notification.type === "EXAM" || notification.type === "AT_RISK") onOpenUniversity();
    else if (notification.type === "OVERDUE") onOpenTasks();
    else if (notification.type === "CLASS") onOpenAgenda();
    else if (notification.type === "REMINDER") return; // el texto ya está en la tarjeta: no hay adónde ir
    else onOpenTask(notification.referenceId);
  }

  async function markAll() {
    if (busy || unread === 0) return;
    const previous = items;
    try {
      setBusy(true);
      setError(null);
      apply(items.map((item) => ({ ...item, read: true })));
      await markAllNotificationsRead();
    } catch (err) {
      apply(previous);
      setError(err instanceof Error ? err.message : "No fue posible marcar las notificaciones");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-paper">
      <ScreenHeader
        title="Notificaciones"
        subtitle={unread > 0 ? `${unread} sin leer` : "Estás al día"}
        onBack={onBack}
        right={unread > 0 ? <button onClick={markAll} disabled={busy} className="-mr-2 flex min-h-[44px] items-center px-2 text-[14px] font-semibold text-coral-ink disabled:opacity-50">Marcar todas</button> : undefined}
      />

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pt-3 pb-8 lg:max-w-[760px] lg:px-8 lg:pt-6 [&>*]:shrink-0">
        <div role="radiogroup" aria-label="Filtrar notificaciones" className="flex gap-2">
          {([["todas", "Todas"], ["sin-leer", "Sin leer"]] as const).map(([value, label]) => (
            <ChoiceChip key={value} selected={filter === value} onClick={() => setFilter(value)} className="flex-1">{label}</ChoiceChip>
          ))}
        </div>

        {error && <ErrorBanner message={error} onRetry={load} />}

        {scheduled.length > 0 && (
          <section aria-label="Recordatorios programados" className="flex flex-col gap-1.5">
            <h2 className="px-1 font-display text-[18px] font-semibold leading-none text-ink-2">Programados</h2>
            <ul className="overflow-hidden rounded-md bg-card">
              {scheduled.map((reminder, index) => (
                <li key={reminder.id} className={`flex items-center gap-3 pl-4 ${index > 0 ? "border-t border-line" : ""}`}>
                  <span className="min-w-0 flex-1 py-3">
                    <span className="block break-words text-[16px] font-medium text-ink">{reminder.text}</span>
                    <span className="num mt-0.5 block text-[13px] text-ink-3">{formatRemindAt(reminder.remindAt)}</span>
                  </span>
                  <button type="button" onClick={() => removeReminder(reminder.id)} disabled={removingId !== null} aria-label={`Quitar recordatorio: ${reminder.text}`} className="flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center px-3 text-[14px] font-semibold text-coral-ink disabled:opacity-50">Quitar</button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {loading ? (
          <ListSkeleton rows={5} label="Cargando notificaciones" />
        ) : visible.length === 0 && !error ? (
          filter === "sin-leer" && items.length > 0
            ? <EmptyState title="Todo leído" sub="No tienes notificaciones pendientes de leer." action="Ver todas" onAction={() => setFilter("todas")} />
            : <EmptyState title="Sin notificaciones" sub="Aquí aparecerán los avisos de fechas límite, hábitos, parciales, materias en riesgo y clases." />
        ) : (
          <div className="flex flex-col gap-4">
          {groupByDay(visible).map((group) => (
          <section key={group.key} aria-label={group.label} className="flex flex-col gap-1.5">
          <h2 className="px-1 font-display text-[18px] font-semibold leading-none text-ink-2">{group.label}</h2>
          <ul className="overflow-hidden rounded-md bg-card">
            {group.items.map((notification, index) => {
              const style = TYPE_STYLE[notification.type] ?? LEGACY_STYLE;
              return (
                <li key={notification.id} className={index > 0 ? "border-t border-line" : ""}>
                  <button onClick={() => open(notification)} className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors active:bg-wash">
                    <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md" style={{ background: style.bg, color: style.color }} aria-hidden="true">{style.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className={`truncate text-[16px] text-ink ${notification.read ? "font-medium" : "font-semibold"}`}>{notification.title}</span>
                        {!notification.read && <span className="flex-shrink-0 rounded-[3px] bg-coral px-1.5 py-[3px] text-[13px] font-semibold leading-none text-night">Nueva</span>}
                      </span>
                      <span className={`mt-0.5 block text-[14px] leading-snug ${notification.read ? "text-ink-2" : "text-ink"}`}>{notification.message}</span>
                      <span className="mt-1 block text-[13px] text-ink-3">{style.label} · {timeAgo(notification.createdAt)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          </section>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** «lun 20 nov, 8:30 a. m.»: la fecha y hora local que eligió el usuario (el servidor la guarda sin zona). */
function formatRemindAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-CO", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

const localDayKey =(date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** Agrupa por día local, en el orden recibido: «Hoy», «Ayer» o la fecha. */
function groupByDay(list: AppNotification[]): { key: string; label: string; items: AppNotification[] }[] {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const groups: { key: string; label: string; items: AppNotification[] }[] = [];
  list.forEach((item) => {
    const date = new Date(item.createdAt);
    const key = Number.isNaN(date.getTime()) ? "sin-fecha" : localDayKey(date);
    let group = groups.find((entry) => entry.key === key);
    if (!group) {
      const label = key === "sin-fecha" ? "Sin fecha" : key === localDayKey(today) ? "Hoy" : key === localDayKey(yesterday) ? "Ayer" : date.toLocaleDateString("es-CO", { day: "numeric", month: "long" });
      group = { key, label, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  });
  return groups;
}
