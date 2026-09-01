import { IconHabit, IconRadar, IconUser, IconSettings, IconShield, IconTrendUp, IconTarget } from "../components/icons";

interface Props {
  onHabits: () => void;
  onRadar: () => void;
  onProfile: () => void;
  onAdmin: () => void;
}

interface SectionItem {
  icon: React.ReactNode;
  label: string;
  sub: string;
  color: string;
  bg: string;
  action?: () => void;
  badge?: string | null;
}

export default function MoreScreen({ onHabits, onRadar, onProfile, onAdmin }: Props) {
  const sections: { title: string; items: SectionItem[] }[] = [
    {
      title: "Mi espacio",
      items: [
        { icon: <IconHabit size={20} />, label: "Hábitos", sub: "Seguimiento y rachas", color: "#7A5AF8", bg: "#F4F3FF", action: onHabits, badge: null },
        { icon: <IconRadar size={20} />, label: "Radar", sub: "Recordatorios activos", color: "#2E90FA", bg: "#EFF8FF", action: onRadar, badge: "3" },
      ],
    },
    {
      title: "Cuenta",
      items: [
        { icon: <IconUser size={20} />, label: "Perfil", sub: "Daniela García", color: "#FF6B4A", bg: "#FFF0EC", action: onProfile, badge: null },
        { icon: <IconSettings size={20} />, label: "Configuración", sub: "Preferencias y notificaciones", color: "#667085", bg: "#F2F4F7", action: undefined, badge: null },
      ],
    },
    {
      title: "Administración",
      items: [
        { icon: <IconShield size={20} />, label: "Panel Admin", sub: "Gestión de usuarios", color: "#101828", bg: "#F2F4F7", action: onAdmin, badge: null },
      ],
    },
  ];

  return (
    <div className="h-full flex flex-col bg-[#F7F8FA]">
      <div className="px-5 pt-4 pb-4 bg-white flex-shrink-0" style={{ boxShadow: "0 1px 0 #F2F4F7" }}>
        <h1 className="text-[20px] font-extrabold text-[#172033]">Más</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-5">
        {/* User card */}
        <div
          className="rounded-2xl p-4 flex items-center gap-4"
          style={{ background: "linear-gradient(135deg, #101828 0%, #1D3461 100%)", boxShadow: "0 4px 20px rgba(16,24,40,0.25)" }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-white text-[18px] flex-shrink-0"
            style={{ background: "rgba(255,107,74,0.25)", border: "2px solid rgba(255,107,74,0.4)" }}
          >
            DG
          </div>
          <div className="flex-1">
            <p className="text-[16px] font-bold text-white">Daniela García</p>
            <p className="text-[12px] text-[#94A3BF] mt-0.5">Ing. de Sistemas · Sem. 8</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5">
                <IconTrendUp size={12} color="#FF6B4A" />
                <span className="text-[11px] font-semibold text-[#FF6B4A]">4.35 promedio</span>
              </div>
              <div className="flex items-center gap-1.5">
                <IconTarget size={12} color="#12B76A" />
                <span className="text-[11px] font-semibold text-[#12B76A]">Meta 4.50</span>
              </div>
            </div>
          </div>
        </div>

        {sections.map((section) => (
          <div key={section.title}>
            <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest mb-2 px-1">{section.title}</p>
            <div
              className="bg-white rounded-2xl overflow-hidden"
              style={{ boxShadow: "0 1px 4px rgba(16,24,40,0.07), 0 0 0 1px rgba(16,24,40,0.04)" }}
            >
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 text-left active:bg-[#F7F8FA] transition-colors ${i < section.items.length - 1 ? "border-b border-[#F7F8FA]" : ""}`}
                >
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: item.bg, color: item.color }}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-bold text-[#172033]">{item.label}</p>
                    <p className="text-[12px] text-[#94A3B8]">{item.sub}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.badge && (
                      <span className="w-5 h-5 rounded-full text-[11px] font-bold text-white flex items-center justify-center" style={{ background: "#FF6B4A" }}>
                        {item.badge}
                      </span>
                    )}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D0D5DD" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        <p className="text-center text-[11px] text-[#D0D5DD] mt-1">MyOrbit v1.0 · MVP · 2026</p>
        <div className="h-4" />
      </div>
    </div>
  );
}
