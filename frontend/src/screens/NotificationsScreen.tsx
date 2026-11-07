import { useEffect, useMemo, useState, type ReactNode } from "react";
import { EmptyState, ScreenHeader } from "../components/shared";
import { IconCheckCircle, IconClock, IconHabit } from "../components/icons";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead, type AppNotification, type NotificationType } from "../services/notificationsApi";

interface Props {
  onBack: () => void;
  /** Se informa cada vez que cambia la cantidad de no leídas para mantener la campana al día. */
  onUnreadChange: (count: number) => void;
  onOpenTask: (taskId: string) => void;
  onOpenHabits: () => void;
}

type Filter = "todas" | "sin-leer";

const TYPE_STYLE: Record<NotificationType, { icon: ReactNode; color: string; bg: string; label: string }> = {
  DEADLINE: { icon: <IconClock size={20} />, color: "var(--color-amber-ink)", bg: "var(--color-amber-wash)", label: "Fecha límite" },
  EVENT: { icon: <IconCheckCircle size={20} />, color: "var(--color-green-ink)", bg: "var(--color-green-wash)", label: "Tarea" },
  HABIT: { icon: <IconHabit size={20} />, color: "var(--color-violet-ink)", bg: "var(--color-violet-wash)", label: "Hábito" },
};

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

export default function NotificationsScreen({ onBack, onUnreadChange, onOpenTask, onOpenHabits }: Props) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("todas");
  const [busy, setBusy] = useState(false);

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

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pt-3 pb-8 lg:max-w-[760px] lg:px-8 lg:pt-6">
        <div role="radiogroup" aria-label="Filtrar notificaciones" className="flex self-start rounded-md bg-wash p-1">
          {([["todas", "Todas"], ["sin-leer", "Sin leer"]] as const).map(([value, label]) => (
            <button key={value} type="button" role="radio" aria-checked={filter === value} onClick={() => setFilter(value)} className="min-h-[36px] rounded-[4px] px-4 text-[14px] font-semibold" style={{ background: filter === value ? "var(--color-card)" : "transparent", color: filter === value ? "var(--color-ink)" : "var(--color-ink-2)" }}>{label}</button>
          ))}
        </div>

        {error && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-md border border-danger-line bg-danger-wash px-3 py-2">
            <p className="text-[14px] font-semibold text-danger">{error}</p>
            <button onClick={load} className="min-h-[44px] flex-shrink-0 px-2 text-[14px] font-semibold text-coral-ink">Reintentar</button>
          </div>
        )}

        {loading ? (
          <p className="text-[14px] text-ink-2">Cargando notificaciones...</p>
        ) : visible.length === 0 && !error ? (
          filter === "sin-leer" && items.length > 0
            ? <EmptyState title="Todo leído" sub="No tienes notificaciones pendientes de leer." action="Ver todas" onAction={() => setFilter("todas")} />
            : <EmptyState title="Sin notificaciones" sub="Aquí aparecerán los avisos de fechas límite, tareas completadas y hábitos pendientes." />
        ) : (
          <ul className="overflow-hidden rounded-md border border-line bg-card">
            {visible.map((notification, index) => {
              const style = TYPE_STYLE[notification.type];
              return (
                <li key={notification.id} className={index > 0 ? "border-t border-line" : ""}>
                  <button onClick={() => open(notification)} className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors active:bg-wash">
                    <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md" style={{ background: style.bg, color: style.color }} aria-hidden="true">{style.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className={`truncate text-[16px] text-ink ${notification.read ? "font-medium" : "font-semibold"}`}>{notification.title}</span>
                        {!notification.read && <span className="flex-shrink-0 rounded-[3px] bg-coral px-1.5 py-[3px] text-[12px] font-semibold leading-none text-night">Nueva</span>}
                      </span>
                      <span className={`mt-0.5 block text-[14px] leading-snug ${notification.read ? "text-ink-2" : "text-ink"}`}>{notification.message}</span>
                      <span className="mt-1 block text-[13px] text-ink-3">{style.label} · {timeAgo(notification.createdAt)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
