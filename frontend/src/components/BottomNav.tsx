import React from "react";
import type { MainTab } from "../App";

interface Props {
  active: MainTab;
  onChange: (tab: MainTab) => void;
  onFab: () => void;
}

const svg = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const TABS: { id: MainTab; label: string; icon: React.ReactElement }[] = [
  {
    id: "home", label: "Hoy",
    icon: (
      <svg {...svg} aria-hidden="true">
        <circle cx="5" cy="12" r="2.2" />
        <circle cx="19" cy="12" r="2.2" />
        <path d="M7.2 12h9.6" />
      </svg>
    ),
  },
  {
    id: "tasks", label: "Tareas",
    icon: (
      <svg {...svg} aria-hidden="true">
        <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
        <path d="M8 12.2l2.7 2.7L16.2 9.4" />
      </svg>
    ),
  },
  {
    id: "agenda", label: "Agenda",
    icon: (
      <svg {...svg} aria-hidden="true">
        <rect x="3.5" y="4.5" width="17" height="16" rx="3" />
        <path d="M8 2.5v4M16 2.5v4M3.5 10h17" />
      </svg>
    ),
  },
  {
    id: "university", label: "Uni",
    icon: (
      <svg {...svg} aria-hidden="true">
        <path d="M12 3L2 8l10 5 10-5-10-5z" />
        <path d="M6 10.5v5a6 6 0 0 0 12 0v-5" />
      </svg>
    ),
  },
  {
    id: "more", label: "Más",
    icon: (
      <svg {...svg} aria-hidden="true">
        <circle cx="6" cy="12" r="1.2" fill="currentColor" />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" />
        <circle cx="18" cy="12" r="1.2" fill="currentColor" />
      </svg>
    ),
  },
];

export default function BottomNav({ active, onChange, onFab }: Props) {
  return (
    <nav aria-label="Principal" className="lg:hidden flex-shrink-0 border-t border-line bg-card pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-[760px] items-stretch justify-around px-1">
        {TABS.slice(0, 2).map((tab) => <NavItem key={tab.id} tab={tab} active={active} onChange={onChange} />)}

        <div className="flex w-[72px] items-center justify-center">
          <button
            onClick={onFab}
            aria-label="Añadir tarea, evento o hábito"
            className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full border-[4px] border-card bg-coral text-night transition-transform duration-150 ease-out active:scale-95"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        {TABS.slice(2).map((tab) => <NavItem key={tab.id} tab={tab} active={active} onChange={onChange} />)}
      </div>
    </nav>
  );
}

function NavItem({ tab, active, onChange }: { tab: typeof TABS[0]; active: MainTab; onChange: (t: MainTab) => void }) {
  const isActive = active === tab.id;
  return (
    <button
      onClick={() => onChange(tab.id)}
      aria-current={isActive ? "page" : undefined}
      className={`relative flex min-h-[56px] min-w-[56px] flex-1 flex-col items-center justify-center gap-1 transition-colors duration-150 ${isActive ? "text-ink" : "text-ink-3"}`}
    >
      <span className="absolute left-3 right-3 top-0 h-[3px] origin-center rounded-b-[2px] bg-coral transition-transform duration-300 ease-out" style={{ transform: isActive ? "scaleX(1)" : "scaleX(0)" }} />
      <span className={isActive ? "text-coral-ink" : ""}>{tab.icon}</span>
      <span className="text-[13px] font-semibold leading-none">{tab.label}</span>
    </button>
  );
}
