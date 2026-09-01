import { useState } from "react";
import { ScreenHeader } from "../components/shared";
import {
  IconBuilding, IconPackage, IconBook, IconDocument,
  IconGraduation, IconClipboard, IconBell,
} from "../components/icons";

interface Props { onBack: () => void; }

const NOTIFS = [
  { id: "n1", icon: <IconBuilding size={18} />, title: "En 30 min — Tutoría de Análisis Numérico", sub: "3:00 PM · Google Meet", time: "hace 2 min", color: "#FF6B4A", bg: "#FFF0EC", urgent: true },
  { id: "n2", icon: <IconPackage size={18} />, title: "Mañana — Entrega del proyecto de Móviles", sub: "29 ago · 11:59 PM · Plataforma LMS", time: "hace 1h", color: "#7A5AF8", bg: "#F4F3FF", urgent: true },
  { id: "n3", icon: <IconBook size={18} />, title: "7:00 PM — Hábito: Estudiar", sub: "Mantén tu racha de 7 días", time: "hace 3h", color: "#2E90FA", bg: "#EFF8FF", urgent: false },
  { id: "n4", icon: <IconDocument size={18} />, title: "Tarea pendiente — Taller de interpolación", sub: "Análisis Numérico · Fecha límite 2 sep", time: "ayer", color: "#F79009", bg: "#FFFAEB", urgent: false },
  { id: "n5", icon: <IconGraduation size={18} />, title: "Nueva nota — Desarrollo Móvil", sub: "Taller 2: 4.8 / 5.0 · Excelente trabajo", time: "hace 2 días", color: "#12B76A", bg: "#ECFDF3", urgent: false },
  { id: "n6", icon: <IconClipboard size={18} />, title: "En 8 días — Parcial 2 de Análisis Numérico", sub: "5 sep · Interpolación y derivación numérica", time: "hace 3 días", color: "#7A5AF8", bg: "#F4F3FF", urgent: false },
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
    <div className="h-full flex flex-col bg-[#F7F8FA]">
      <ScreenHeader title="Radar" subtitle="Centro de recordatorios" onBack={onBack} />

      {/* Filters */}
      <div className="px-4 pb-3 bg-white border-b border-[#F2F4F7] flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all"
              style={{ background: filter === f ? "#101828" : "#F2F4F7", color: filter === f ? "white" : "#667085" }}
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
              <div className="w-2 h-2 rounded-full bg-[#FF6B4A]" style={{ boxShadow: "0 0 0 3px rgba(255,107,74,0.2)" }} />
              <p className="text-[11px] font-bold text-[#FF6B4A] uppercase tracking-wider">Urgentes</p>
            </div>
            {visible.filter((n) => n.urgent).map((n) => (
              <NotifCard key={n.id} n={n} onDismiss={(e) => dismiss(n.id, e)} />
            ))}
            <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mt-1 mb-1">Próximamente</p>
          </>
        )}
        {visible.filter((n) => !n.urgent).map((n) => (
          <NotifCard key={n.id} n={n} onDismiss={(e) => dismiss(n.id, e)} />
        ))}

        {visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-[#ECFDF3] flex items-center justify-center mb-4">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#12B76A" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <p className="text-[16px] font-bold text-[#172033]">Sin recordatorios pendientes</p>
            <p className="text-[13px] text-[#94A3B8] mt-1">Estás al día con tu órbita.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NotifCard({ n, onDismiss }: { n: typeof NOTIFS[0]; onDismiss: (e: React.MouseEvent) => void }) {
  return (
    <div
      className="bg-white rounded-2xl px-4 py-3.5 flex items-start gap-3 cursor-pointer active:scale-[0.985] transition-transform"
      style={{ boxShadow: "0 1px 4px rgba(16,24,40,0.07), 0 0 0 1px rgba(16,24,40,0.04)" }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: n.bg, color: n.color }}
      >
        {n.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[#172033] leading-snug">{n.title}</p>
        <p className="text-[12px] text-[#94A3B8] mt-0.5">{n.sub}</p>
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="text-[10px] text-[#D0D5DD] font-medium whitespace-nowrap">{n.time}</span>
        <button
          onClick={onDismiss}
          className="w-5 h-5 rounded-full bg-[#F2F4F7] flex items-center justify-center"
        >
          <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round">
            <path d="M1 1l10 10M11 1L1 11" />
          </svg>
        </button>
      </div>
    </div>
  );
}
