import { useState } from "react";
import { ScreenHeader } from "../components/shared";
import {
  IconBuilding, IconPackage, IconBook, IconDocument,
  IconGraduation, IconClipboard, IconBell,
} from "../components/icons";

interface Props { onBack: () => void; }

const NOTIFS = [
  { id: "n1", icon: <IconBuilding size={18} />, title: "En 30 min — Tutoría de Análisis Numérico", sub: "3:00 PM · Google Meet", time: "hace 2 min", color: "var(--color-coral-ink)", bg: "var(--color-coral-wash)", urgent: true },
  { id: "n2", icon: <IconPackage size={18} />, title: "Mañana — Entrega del proyecto de Móviles", sub: "29 ago · 11:59 PM · Plataforma LMS", time: "hace 1h", color: "var(--color-violet-ink)", bg: "var(--color-violet-wash)", urgent: true },
  { id: "n3", icon: <IconBook size={18} />, title: "7:00 PM — Hábito: Estudiar", sub: "Mantén tu racha de 7 días", time: "hace 3h", color: "var(--color-blue-ink)", bg: "var(--color-blue-wash)", urgent: false },
  { id: "n4", icon: <IconDocument size={18} />, title: "Tarea pendiente — Taller de interpolación", sub: "Análisis Numérico · Fecha límite 2 sep", time: "ayer", color: "var(--color-amber-ink)", bg: "var(--color-amber-wash)", urgent: false },
  { id: "n5", icon: <IconGraduation size={18} />, title: "Nueva nota — Desarrollo Móvil", sub: "Taller 2: 4.8 / 5.0 · Excelente trabajo", time: "hace 2 días", color: "var(--color-green-ink)", bg: "var(--color-green-wash)", urgent: false },
  { id: "n6", icon: <IconClipboard size={18} />, title: "En 8 días — Parcial 2 de Análisis Numérico", sub: "5 sep · Interpolación y derivación numérica", time: "hace 3 días", color: "var(--color-violet-ink)", bg: "var(--color-violet-wash)", urgent: false },
];

const FILTERS = ["Todos", "Urgentes", "Clases", "Tareas", "Hábitos"];

export default function RadarScreen({ onBack }: Props) {
  const [filter, setFilter] = useState("Todos");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const dismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed((p) => new Set([...p, id]));
  };

  const visible = NOTIFS.filter((n) => !dismissed.has(n.id));

  return (
    <div className="h-full flex flex-col bg-paper">
      <ScreenHeader title="Radar" subtitle="Centro de recordatorios" onBack={onBack} />

      {/* Filters */}
      <div className="px-4 pb-3 bg-paper border-b border-line flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="flex-shrink-0 min-h-[40px] rounded-md px-4 text-[14px] font-semibold transition-colors"
              style={{ background: filter === f ? "var(--color-night)" : "var(--color-wash)", color: filter === f ? "white" : "var(--color-ink-2)" }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-2.5 pb-8">
        {visible.some((n) => n.urgent) && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-coral" />
              <p className="font-display text-[20px] font-semibold text-coral-ink">Urgentes</p>
            </div>
            {visible.filter((n) => n.urgent).map((n) => (
              <NotifCard key={n.id} n={n} onDismiss={(e) => dismiss(n.id, e)} />
            ))}
            <p className="font-display text-[20px] font-semibold text-ink mt-3 mb-1">Próximamente</p>
          </>
        )}
        {visible.filter((n) => !n.urgent).map((n) => (
          <NotifCard key={n.id} n={n} onDismiss={(e) => dismiss(n.id, e)} />
        ))}

        {visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-green-wash flex items-center justify-center mb-4">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-green)" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <p className="text-[16px] font-bold text-ink">Sin recordatorios pendientes</p>
            <p className="text-[13px] text-ink-3 mt-1">Estás al día con tu órbita.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NotifCard({ n, onDismiss }: { n: typeof NOTIFS[0]; onDismiss: (e: React.MouseEvent) => void }) {
  return (
    <div
      className="bg-card rounded-lg px-4 py-3.5 flex items-start gap-3 cursor-pointer active:scale-[0.985] transition-transform"
    >
      <div
        className="flex h-6 w-6 flex-shrink-0 items-center justify-center"
        style={{ color: n.color }}
      >
        {n.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-ink leading-snug">{n.title}</p>
        <p className="text-[13px] text-ink-3 mt-0.5">{n.sub}</p>
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="text-[13px] text-ink-3 font-medium whitespace-nowrap">{n.time}</span>
        <button
          onClick={onDismiss}
          className="w-5 h-5 rounded-full bg-wash flex items-center justify-center"
        >
          <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="var(--color-ink-3)" strokeWidth="2" strokeLinecap="round">
            <path d="M1 1l10 10M11 1L1 11" />
          </svg>
        </button>
      </div>
    </div>
  );
}
