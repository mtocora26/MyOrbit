import { IconHabit, IconRadar, IconUser, IconSettings, IconShield } from "../components/icons";

interface Props {
  onHabits: () => void;
  onRadar: () => void;
  onProfile: () => void;
  onAdmin: () => void;
  isAdmin: boolean;
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

export default function MoreScreen({ onHabits, onRadar, onProfile, onAdmin, isAdmin }: Props) {
  const sections: { title: string; items: SectionItem[] }[] = [
    {
      title: "Mi espacio",
      items: [
        { icon: <IconHabit size={20} />, label: "Hábitos", sub: "Seguimiento y rachas", color: "var(--color-violet-ink)", bg: "var(--color-violet-wash)", action: onHabits, badge: null },
        { icon: <IconRadar size={20} />, label: "Radar", sub: "Recordatorios activos", color: "var(--color-blue-ink)", bg: "var(--color-blue-wash)", action: onRadar, badge: "3" },
      ],
    },
    {
      title: "Cuenta",
      items: [
        { icon: <IconUser size={20} />, label: "Perfil", sub: "Daniela García", color: "var(--color-coral-ink)", bg: "var(--color-coral-wash)", action: onProfile, badge: null },
        { icon: <IconSettings size={20} />, label: "Configuración", sub: "Preferencias y notificaciones", color: "var(--color-ink-2)", bg: "var(--color-wash)", action: undefined, badge: null },
      ],
    },
    ...(!isAdmin ? [] : [{
      title: "Administración",
      items: [
        { icon: <IconShield size={20} />, label: "Usuarios", sub: "Cuentas, roles y accesos", color: "var(--color-night)", bg: "var(--color-wash)", action: onAdmin, badge: null },
      ],
    }]),
  ];

  return (
    <div className="h-full flex flex-col bg-paper">
      <header className="px-4 pt-5 pb-3 flex-shrink-0 lg:px-8 lg:pt-8">
        <h1 className="font-display text-[34px] font-semibold leading-none tracking-tight text-ink lg:text-[44px]">Más</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-5 lg:max-w-[640px] lg:px-8 lg:mx-0">
        {/* Perfil */}
        <div className="flex items-center gap-4 rounded-md border border-line bg-card p-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-md bg-coral font-display text-[24px] font-semibold text-night" aria-hidden="true">DG</div>
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-semibold text-ink">Daniela García</p>
            <p className="mt-0.5 text-[14px] text-ink-2">Ing. de Sistemas · Sem. 8</p>
            <p className="num mt-1.5 text-[15px] text-ink-2"><span className="font-semibold text-ink">4.35</span> promedio · meta <span className="font-semibold text-ink">4.50</span></p>
          </div>
        </div>

        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="mb-2 mt-2 px-1 font-display text-[20px] font-semibold leading-none text-ink">{section.title}</h2>
            <div
              className="overflow-hidden rounded-md border border-line bg-card"
            >
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 min-h-[60px] text-left active:bg-wash transition-colors ${i < section.items.length - 1 ? "border-b border-line" : ""}`}
                >
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center text-ink-2">{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-[16px] font-semibold text-ink">{item.label}</p>
                    <p className="text-[14px] text-ink-2">{item.sub}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.badge && (
                      <span className="num flex h-6 min-w-6 items-center justify-center rounded-full bg-coral px-1.5 text-[14px] font-semibold text-night">
                        {item.badge}
                      </span>
                    )}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-line-strong)" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        <p className="text-center text-[13px] text-ink-3 mt-1">MyOrbit v1.0 · MVP · 2026</p>
        <div className="h-4" />
      </div>
    </div>
  );
}
