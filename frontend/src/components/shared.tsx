import { ReactNode, useState } from "react";

// ─── Screen Header ────────────────────────────────────────────────────────────
interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  bg?: string;
}
export function ScreenHeader({ title, subtitle, onBack, right, bg = "#FFFFFF" }: ScreenHeaderProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ background: bg }}>
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-[#F2F4F7]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#172033" strokeWidth="2.2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        <div>
          <h1 className="text-[18px] font-bold text-[#172033] leading-tight">{title}</h1>
          {subtitle && <p className="text-[12px] text-[#667085] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeColor = "coral" | "blue" | "green" | "yellow" | "purple" | "gray" | "night";
interface BadgeProps { label: string; color?: BadgeColor; }
export function Badge({ label, color = "gray" }: BadgeProps) {
  const map: Record<BadgeColor, string> = {
    coral:  "bg-[#FFF0EC] text-[#FF6B4A]",
    blue:   "bg-[#EFF8FF] text-[#2E90FA]",
    green:  "bg-[#ECFDF3] text-[#12B76A]",
    yellow: "bg-[#FFFAEB] text-[#F79009]",
    purple: "bg-[#F4F3FF] text-[#7A5AF8]",
    gray:   "bg-[#F2F4F7] text-[#667085]",
    night:  "bg-[#101828] text-white",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold leading-none ${map[color]}`}>
      {label}
    </span>
  );
}

// ─── Category Badge & Picker ──────────────────────────────────────────────────
export function CategoryBadge({ name, color }: { name: string; color?: string }) {
  const hex = color || "#667085";
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold leading-none" style={{ background: `${hex}1A`, color: hex }}>
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
}
export function CategoryPicker({ categories, value, onChange, onCreate, className = "" }: CategoryPickerProps) {
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
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Nueva categoría" className="min-w-0 flex-1 rounded-xl border border-[#E4E7EC] bg-[#F7F8FA] px-3 py-2 text-[13px] outline-none" />
          <button type="button" onClick={submit} disabled={!name.trim() || saving} className="rounded-xl bg-[#172033] px-3 text-[12px] font-bold text-white disabled:opacity-50">{saving ? "..." : "Crear"}</button>
          <button type="button" onClick={() => setCreating(false)} className="rounded-xl bg-[#F2F4F7] px-3 text-[12px] font-bold text-[#667085]">Cancelar</button>
        </div>
        <div className="flex gap-1.5">
          {CATEGORY_PALETTE.map((option) => (
            <button key={option} type="button" onClick={() => setColor(option)} className="h-6 w-6 rounded-full border-2" style={{ background: option, borderColor: color === option ? "#101828" : "transparent" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-[#E4E7EC] bg-[#F7F8FA] px-3 py-2 text-[13px] text-[#172033] outline-none">
        {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
        {value && !categories.some((category) => category.name === value) && <option value={value}>{value}</option>}
      </select>
      <button type="button" onClick={() => setCreating(true)} title="Nueva categoría" className="rounded-xl bg-[#F2F4F7] px-3 text-[13px] font-bold text-[#667085]">+</button>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, color = "#FF6B4A", height = 6, bg = "#F2F4F7" }: { value: number; color?: string; height?: number; bg?: string; }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: bg }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(Math.max(value, 0), 100)}%`, background: color }} />
    </div>
  );
}

// ─── Progress Ring ────────────────────────────────────────────────────────────
export function ProgressRing({ value, size = 60, stroke = 5, color = "#FF6B4A", trackColor = "#F2F4F7", children }: { value: number; size?: number; stroke?: number; color?: string; trackColor?: string; children?: ReactNode; }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(Math.max(value, 0), 100) / 100) * circ;
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="relative flex items-center justify-center">{children}</div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = "", onClick, padding = "p-4" }: { children: ReactNode; className?: string; onClick?: () => void; padding?: string; }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl ${padding} ${onClick ? "cursor-pointer active:scale-[0.985] transition-transform" : ""} ${className}`}
      style={{ boxShadow: "0 1px 4px rgba(16,24,40,0.07), 0 0 0 1px rgba(16,24,40,0.04)" }}
    >
      {children}
    </div>
  );
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────
export function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void; }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200"
      style={{ borderColor: checked ? "#FF6B4A" : "#D0D5DD", background: checked ? "#FF6B4A" : "transparent" }}
    >
      {checked && (
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <path d="M1 3.5L3.5 6 8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
export function Toggle({ on, onChange }: { on: boolean; onChange: () => void; }) {
  return (
    <button
      onClick={onChange}
      className="relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0"
      style={{ background: on ? "#FF6B4A" : "#D0D5DD" }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200"
        style={{ left: on ? "calc(100% - 22px)" : "2px" }}
      />
    </button>
  );
}

// ─── FAB ──────────────────────────────────────────────────────────────────────
export function FAB({ onClick }: { onClick?: () => void; }) {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-5 right-4 w-14 h-14 rounded-full flex items-center justify-center z-20 transition-transform active:scale-95"
      style={{ background: "#FF6B4A", boxShadow: "0 8px 28px rgba(255,107,74,0.45), 0 2px 8px rgba(255,107,74,0.3)" }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );
}

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────
export function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; }) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(16,24,40,0.5)" }} onClick={onClose}>
      <div
        className="bg-white rounded-t-[28px] px-5 pt-4 pb-8"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "0 -8px 40px rgba(16,24,40,0.15)" }}
      >
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-[#E4E7EC]" />
        </div>
        {title && <p className="text-[17px] font-bold text-[#172033] mb-4">{title}</p>}
        {children}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, sub, action, onAction }: { icon: string; title: string; sub?: string; action?: string; onAction?: () => void; }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="relative mb-4">
        <div className="w-20 h-20 rounded-full bg-[#F2F4F7] flex items-center justify-center text-[36px]">{icon}</div>
        <svg className="absolute inset-0 w-20 h-20 opacity-20" viewBox="0 0 80 80">
          <ellipse cx="40" cy="40" rx="36" ry="20" fill="none" stroke="#101828" strokeWidth="1.5" strokeDasharray="4 3" />
          <circle cx="76" cy="30" r="3" fill="#FF6B4A" opacity="0.6" />
          <circle cx="10" cy="52" r="2" fill="#2E90FA" opacity="0.6" />
        </svg>
      </div>
      <p className="text-[16px] font-bold text-[#172033] mb-1">{title}</p>
      {sub && <p className="text-[13px] text-[#667085] leading-relaxed">{sub}</p>}
      {action && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-6 py-2.5 rounded-2xl text-[14px] font-bold text-white"
          style={{ background: "#FF6B4A" }}
        >
          {action}
        </button>
      )}
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
export function Skeleton({ className = "" }: { className?: string; }) {
  return <div className={`bg-[#F2F4F7] rounded-xl animate-pulse ${className}`} />;
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionTitle({ label, action, onAction }: { label: string; action?: string; onAction?: () => void; }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-[15px] font-bold text-[#172033]">{label}</p>
      {action && (
        <button onClick={onAction} className="text-[13px] font-semibold text-[#FF6B4A]">{action}</button>
      )}
    </div>
  );
}

// ─── Input Field ──────────────────────────────────────────────────────────────
export function InputField({ label, placeholder, value, onChange, type = "text" }: { label?: string; placeholder?: string; value?: string; onChange?: (v: string) => void; type?: string; }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <p className="text-[13px] font-semibold text-[#172033]">{label}</p>}
      <div className="flex items-center bg-[#F7F8FA] border border-[#E4E7EC] rounded-xl px-3 py-3 gap-2 focus-within:border-[#FF6B4A] transition-colors">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="flex-1 bg-transparent text-[14px] text-[#172033] placeholder-[#D0D5DD] outline-none"
        />
      </div>
    </div>
  );
}

// ─── Priority Pill ────────────────────────────────────────────────────────────
export function PriorityDot({ level }: { level: "alta" | "media" | "baja"; }) {
  const color = { alta: "#FF6B4A", media: "#F79009", baja: "#12B76A" }[level];
  return <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />;
}

// ─── Orbit Decoration SVG ─────────────────────────────────────────────────────
export function OrbitDecor({ className = "", opacity = 0.12 }: { className?: string; opacity?: number; }) {
  return (
    <svg className={`pointer-events-none select-none ${className}`} width="180" height="120" viewBox="0 0 180 120" style={{ opacity }}>
      <ellipse cx="120" cy="60" rx="100" ry="45" fill="none" stroke="white" strokeWidth="1.2" />
      <ellipse cx="60" cy="60" rx="55" ry="25" fill="none" stroke="white" strokeWidth="0.8" />
      <circle cx="215" cy="30" r="5" fill="white" />
      <circle cx="25" cy="90" r="3" fill="white" />
      <circle cx="170" cy="95" r="2" fill="white" opacity="0.5" />
    </svg>
  );
}
