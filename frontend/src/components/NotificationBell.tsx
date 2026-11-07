import { IconBell } from "./icons";

interface Props {
  count: number;
  onClick: () => void;
  className?: string;
}

/** Campana con contador de no leídas: el número va en una marca cuadrada, no solo en color. */
export default function NotificationBell({ count, onClick, className = "" }: Props) {
  const label = count > 0 ? `Notificaciones, ${count} sin leer` : "Notificaciones";
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-ink-2 transition-colors duration-150 hover:bg-wash hover:text-ink active:bg-wash ${className}`}
    >
      <IconBell size={22} />
      {count > 0 && (
        <span aria-hidden="true" className="num absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] bg-coral px-1 text-[12px] font-semibold leading-none text-night">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
