import { ReactNode, useEffect, useState } from "react";

/*
 * Lenguaje de ruta: paneles planos separados por líneas finas, estaciones
 * (puntos) para el estado, códigos de línea cuadrados para las categorías.
 * Sin sombras ni degradados. El estado siempre lleva forma además de color.
 */

// ─── Screen Header ────────────────────────────────────────────────────────────
interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  bg?: string;
}
export function ScreenHeader({ title, subtitle, onBack, right, bg = "var(--color-paper)" }: ScreenHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3 px-4 py-3 flex-shrink-0 border-b border-line lg:px-8" style={{ background: bg }}>
      <div className="flex min-w-0 items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Volver"
            className="flex h-11 w-11 -ml-2 flex-shrink-0 items-center justify-center rounded-md text-ink transition-colors active:bg-wash"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-[26px] font-semibold leading-none tracking-tight text-ink truncate">{title}</h1>
          {subtitle && <p className="mt-1 text-[13px] text-ink-2 truncate">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </header>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeColor = "coral" | "blue" | "green" | "yellow" | "purple" | "gray" | "night";
interface BadgeProps { label: string; color?: BadgeColor; }
export function Badge({ label, color = "gray" }: BadgeProps) {
  const map: Record<BadgeColor, string> = {
    coral:  "bg-coral-wash text-coral-ink",
    blue:   "bg-blue-wash text-blue-ink",
    green:  "bg-green-wash text-green-ink",
    yellow: "bg-amber-wash text-amber-ink",
    purple: "bg-violet-wash text-violet-ink",
    gray:   "bg-wash text-ink-2",
    night:  "bg-strong text-on-strong",
  };
  return (
    <span className={`inline-flex items-center rounded-sm px-1.5 py-1 font-display text-[13px] font-semibold uppercase leading-none tracking-wide ${map[color]}`}>
      {label}
    </span>
  );
}

// ─── Category Badge & Picker ──────────────────────────────────────────────────
// La categoría es una línea de la red: cuadrito del color de la línea + nombre.
export function CategoryBadge({ name, color }: { name: string; color?: string }) {
  const hex = color || "#667085";
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium leading-none text-ink-2">
      <span className="h-2.5 w-2.5 flex-shrink-0 rounded-[2px]" style={{ background: hex }} aria-hidden="true" />
      {name}
    </span>
  );
}

const CATEGORY_PALETTE = ["#FF6B4A", "#2E90FA", "#12B76A", "#7A5AF8", "#F79009", "#EE46BC", "#0BA5EC", "#667085"];

interface CategoryOption { id: string; name: string; color: string; }
interface CategoryPickerProps {
  categories: CategoryOption[];
  value: string;
  onChange: (name: string) => void;
  onCreate: (name: string, color: string) => Promise<void>;
  className?: string;
  /** "chips": una fila deslizable de un toque por categoría, sin abrir el selector nativo. */
  variant?: "select" | "chips";
}
export function CategoryPicker({ categories, value, onChange, onCreate, className = "", variant = "select" }: CategoryPickerProps) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(CATEGORY_PALETTE[0]);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim() || saving) return;
    try {
      setSaving(true);
      await onCreate(name.trim(), color);
      setName("");
      setCreating(false);
    } finally {
      setSaving(false);
    }
  }

  if (creating) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <div className="flex gap-2">
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Nueva categoría" className="min-w-0 flex-1 rounded-md border border-line bg-card px-3 py-2.5 text-[14px] text-ink outline-none focus:border-coral" />
          <button type="button" onClick={submit} disabled={!name.trim() || saving} className="rounded-md bg-strong px-3 text-[13px] font-semibold text-on-strong disabled:opacity-50">{saving ? "..." : "Crear"}</button>
          <button type="button" onClick={() => setCreating(false)} className="rounded-md bg-wash px-3 text-[13px] font-semibold text-ink-2">Cancelar</button>
        </div>
        <div className="flex gap-1" role="radiogroup" aria-label="Color de la línea">
          {CATEGORY_PALETTE.map((option) => (
            <button key={option} type="button" role="radio" aria-checked={color === option} aria-label={option} onClick={() => setColor(option)} className="flex h-9 w-9 items-center justify-center">
              <span className="h-6 w-6 rounded-[3px] border-2" style={{ background: option, borderColor: color === option ? "var(--color-ink)" : "transparent" }} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "chips") {
    const options = value && !categories.some((category) => category.name === value) ? [...categories, { id: "__current", name: value, color: "#667085" }] : categories;
    return (
      <div role="radiogroup" aria-label="Categoría" className={`no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 ${className}`}>
        {options.map((category) => {
          const selected = category.name === value;
          return (
            <button
              key={category.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(category.name)}
              className={`flex h-10 flex-shrink-0 items-center gap-2 rounded-md border px-3 text-[14px] font-semibold ${selected ? "border-ink bg-wash text-ink" : "border-line text-ink-2"}`}
            >
              <span className="h-2.5 w-2.5 flex-shrink-0 rounded-[2px]" style={{ background: category.color }} aria-hidden="true" />
              {category.name}
            </button>
          );
        })}
        <button type="button" onClick={() => setCreating(true)} aria-label="Nueva categoría" className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-dashed border-line-strong text-ink-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="min-w-0 flex-1 rounded-md border border-line bg-card px-3 py-2.5 text-[14px] text-ink outline-none focus:border-coral">
        {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
        {value && !categories.some((category) => category.name === value) && <option value={value}>{value}</option>}
      </select>
      <button type="button" onClick={() => setCreating(true)} title="Nueva categoría" aria-label="Nueva categoría" className="w-11 rounded-md bg-wash text-[16px] font-semibold text-ink-2">+</button>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, color = "var(--color-coral)", height = 6, bg = "var(--color-wash)" }: { value: number; color?: string; height?: number; bg?: string; }) {
  return (
    <div className="w-full overflow-hidden rounded-[2px]" style={{ height, background: bg }} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}>
      <div className="h-full rounded-[2px] transition-[width] duration-500 ease-out" style={{ width: `${Math.min(Math.max(value, 0), 100)}%`, background: color }} />
    </div>
  );
}

// ─── Progress Ring ────────────────────────────────────────────────────────────
export function ProgressRing({ value, size = 60, stroke = 5, color = "var(--color-coral)", trackColor = "var(--color-wash)", children }: { value: number; size?: number; stroke?: number; color?: string; trackColor?: string; children?: ReactNode; }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(Math.max(value, 0), 100) / 100) * circ;
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.23, 1, 0.32, 1)" }} />
      </svg>
      <div className="relative flex items-center justify-center">{children}</div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
// Panel plano con línea fina. Si es pulsable, se comporta como botón.
export function Card({ children, className = "", onClick, padding = "p-4" }: { children: ReactNode; className?: string; onClick?: () => void; padding?: string; }) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      className={`rounded-md border border-line bg-card ${padding} ${onClick ? "cursor-pointer transition-transform duration-150 ease-out active:scale-[0.985]" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────
// Estación: hueca = pendiente, rellena con marca = hecha. Área táctil de 44px.
export function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void; }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      role="checkbox"
      aria-checked={checked}
      aria-label={checked ? "Marcar como pendiente" : "Marcar como hecha"}
      className="-m-3 flex h-11 w-11 flex-shrink-0 items-center justify-center"
    >
      <span
        className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-[2.5px] transition-[background-color,border-color,transform] duration-200 ease-out active:scale-90"
        style={{ borderColor: checked ? "var(--color-coral)" : "var(--color-line-strong)", background: checked ? "var(--color-coral)" : "var(--color-card)" }}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 9 7" fill="none" aria-hidden="true">
            <path d="M1 3.5L3.5 6 8 1" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
export function Toggle({ on, onChange }: { on: boolean; onChange: () => void; }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={on}
      className="relative h-7 w-12 flex-shrink-0 rounded-[6px] transition-colors duration-200"
      style={{ background: on ? "var(--color-coral)" : "var(--color-line-strong)" }}
    >
      <span
        className="absolute top-[3px] h-[22px] w-[22px] rounded-[4px] bg-white transition-[left] duration-200 ease-out"
        style={{ left: on ? "calc(100% - 25px)" : "3px" }}
      />
    </button>
  );
}

// ─── FAB ──────────────────────────────────────────────────────────────────────
export function FAB({ onClick }: { onClick?: () => void; }) {
  return (
    <button
      onClick={onClick}
      aria-label="Añadir"
      className="absolute bottom-5 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-coral text-night transition-transform duration-150 ease-out active:scale-95"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );
}

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────
export function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; }) {
  // Se mantiene montado 200 ms tras cerrar para poder animar la salida.
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) { setMounted(true); return; }
    const timer = setTimeout(() => setMounted(false), 200);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;
  return (
    <div data-closing={open ? undefined : ""} className="orbit-scrim absolute inset-0 z-50 flex flex-col justify-end bg-night/60 lg:items-center lg:justify-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-closing={open ? undefined : ""}
        className="orbit-sheet max-h-[92%] w-full overflow-y-auto rounded-t-lg border-t border-line bg-card px-5 pt-2.5 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:max-w-[480px] lg:rounded-lg lg:border lg:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex justify-center">
          <div className="h-1 w-10 rounded-full bg-line-strong" />
        </div>
        {title && <p className="mb-4 font-display text-[24px] font-semibold leading-none text-ink">{title}</p>}
        {children}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
// Una línea sin estaciones todavía: el vacío se dibuja, no se rellena con emoji.
export function EmptyState({ title, sub, action, onAction }: { icon?: string; title: string; sub?: string; action?: string; onAction?: () => void; }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <svg width="148" height="36" viewBox="0 0 148 36" fill="none" aria-hidden="true" className="mb-5">
        <path d="M6 18h136" stroke="var(--color-line-strong)" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 9" />
        <circle cx="74" cy="18" r="9" fill="var(--color-card)" stroke="var(--color-coral)" strokeWidth="3" />
      </svg>
      <p className="font-display text-[22px] font-semibold leading-none text-ink">{title}</p>
      {sub && <p className="mt-2 max-w-[28ch] text-[14px] leading-snug text-ink-2">{sub}</p>}
      {action && onAction && (
        <button
          onClick={onAction}
          className="mt-5 rounded-md bg-coral px-5 py-3 text-[15px] font-semibold text-night transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          {action}
        </button>
      )}
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
export function Skeleton({ className = "" }: { className?: string; }) {
  return <div className={`bg-wash rounded-sm animate-pulse ${className}`} />;
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionTitle({ label, action, onAction }: { label: string; action?: string; onAction?: () => void; }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="font-display text-[20px] font-semibold leading-none tracking-tight text-ink">{label}</h2>
      {action && (
        <button onClick={onAction} className="-mr-2 flex h-11 items-center px-2 text-[14px] font-semibold text-coral-ink">{action}</button>
      )}
    </div>
  );
}

// ─── Input Field ──────────────────────────────────────────────────────────────
export function InputField({ label, placeholder, value, onChange, type = "text", autoFocus }: { label?: string; placeholder?: string; value?: string; onChange?: (v: string) => void; type?: string; autoFocus?: boolean; }) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-[14px] font-semibold text-ink">{label}</span>}
      <span className="flex items-center rounded-md border border-line bg-card px-3 py-3 transition-colors focus-within:border-coral">
        <input
          type={type}
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="flex-1 bg-transparent text-[16px] text-ink outline-none"
        />
      </span>
    </label>
  );
}

// ─── Priority ─────────────────────────────────────────────────────────────────
// Tres marcas de altura creciente: la prioridad se lee por cantidad, no solo por color.
const PRIORITY = {
  alta:  { n: 3, color: "var(--color-coral)", label: "Prioridad alta" },
  media: { n: 2, color: "var(--color-amber)", label: "Prioridad media" },
  baja:  { n: 1, color: "var(--color-green)", label: "Prioridad baja" },
} as const;
export function PriorityDot({ level }: { level: "alta" | "media" | "baja"; }) {
  const p = PRIORITY[level];
  return (
    <span className="flex h-3.5 flex-shrink-0 items-end gap-[2px]" role="img" aria-label={p.label}>
      {[1, 2, 3].map((i) => (
        <span key={i} className="w-[3px] rounded-[1px]" style={{ height: 4 + i * 3, background: i <= p.n ? p.color : "var(--color-line-strong)" }} />
      ))}
    </span>
  );
}

// ─── Orbit Decoration SVG ─────────────────────────────────────────────────────
// La órbita como trazado de ruta: una elipse fina con estaciones.
export function OrbitDecor({ className = "", opacity = 0.35 }: { className?: string; opacity?: number; }) {
  return (
    <svg className={`pointer-events-none select-none ${className}`} width="180" height="120" viewBox="0 0 180 120" style={{ opacity }} aria-hidden="true">
      <ellipse cx="120" cy="60" rx="100" ry="45" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="60" cy="60" rx="55" ry="25" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 6" />
      <circle cx="164" cy="38" r="5" fill="var(--color-coral)" />
      <circle cx="25" cy="90" r="3.5" fill="var(--color-blue)" />
      <circle cx="100" cy="104" r="3" fill="var(--color-amber)" />
    </svg>
  );
}

// ─── Station ──────────────────────────────────────────────────────────────────
// Parada de una línea: hueca = pendiente, rellena = hecha, discontinua = vencida.
export function Station({ color, done, overdue, onToggle, label }: { color: string; done: boolean; overdue?: boolean; onToggle: () => void; label: string; }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      className="relative z-10 flex h-11 w-11 items-center justify-center self-start"
    >
      <span
        className="block h-[20px] w-[20px] rounded-full border-[3px] transition-[background-color] duration-150 ease-out"
        style={{ borderColor: color, borderStyle: overdue && !done ? "dashed" : "solid", background: done ? color : "var(--color-paper)" }}
      />
    </button>
  );
}
