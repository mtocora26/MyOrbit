import React from "react";
import type { MainTab } from "../App";

interface Props {
  active: MainTab;
  onChange: (tab: MainTab) => void;
  onFab: () => void;
}

const TABS: { id: MainTab; label: string; icon: (a: boolean) => React.ReactElement }[] = [
  {
    id: "home", label: "Inicio",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? "#FF6B4A" : "none"} stroke={a ? "#FF6B4A" : "#94A3B8"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    id: "tasks", label: "Tareas",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? "#FF6B4A" : "#94A3B8"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5" fill={a ? "#FFF0EC" : "none"} />
        <path d="M8 12l2.5 2.5 5.5-5" />
        <path d="M8 7h4M8 17h3" />
      </svg>
    ),
  },
  {
    id: "agenda", label: "Agenda",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? "#FF6B4A" : "#94A3B8"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="4" fill={a ? "#FFF0EC" : "none"} />
        <path d="M8 2v4M16 2v4M3 10h18" />
        <rect x="7" y="14" width="3" height="3" rx="1" fill={a ? "#FF6B4A" : "#94A3B8"} />
      </svg>
    ),
  },
  {
    id: "university", label: "Uni",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? "#FF6B4A" : "#94A3B8"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3L2 8l10 5 10-5-10-5z" fill={a ? "#FFF0EC" : "none"} />
        <path d="M6 10.5v5a6 6 0 0 0 12 0v-5" />
        <path d="M20 8v5" />
      </svg>
    ),
  },
  {
    id: "more", label: "Más",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? "#FF6B4A" : "#94A3B8"} strokeWidth="1.8" strokeLinecap="round">
        <circle cx="5" cy="12" r="1.5" fill={a ? "#FF6B4A" : "#94A3B8"} />
        <circle cx="12" cy="12" r="1.5" fill={a ? "#FF6B4A" : "#94A3B8"} />
        <circle cx="19" cy="12" r="1.5" fill={a ? "#FF6B4A" : "#94A3B8"} />
      </svg>
    ),
  },
];

export default function BottomNav({ active, onChange, onFab }: Props) {
  return (
    <div
      className="flex-shrink-0 bg-white border-t border-[#F2F4F7] md:border md:rounded-2xl md:mx-4 md:mb-4"
      style={{ boxShadow: "0 -4px 24px rgba(16,24,40,0.07)" }}
    >
      <div className="mx-auto flex items-center justify-around px-1 py-2 pb-3 max-w-[760px] md:px-4 md:py-3 md:pb-3">
        {TABS.slice(0, 2).map((tab) => <NavItem key={tab.id} tab={tab} active={active} onChange={onChange} />)}

        {/* Center FAB */}
        <button
          onClick={onFab}
          className="flex flex-col items-center justify-center w-14 h-14 rounded-full -mt-5 shadow-lg transition-transform active:scale-95 md:w-12 md:h-12 md:mt-0"
          style={{ background: "#FF6B4A", boxShadow: "0 6px 20px rgba(255,107,74,0.4)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>

        {TABS.slice(2).map((tab) => <NavItem key={tab.id} tab={tab} active={active} onChange={onChange} />)}
      </div>
    </div>
  );
}

function NavItem({ tab, active, onChange }: { tab: typeof TABS[0]; active: MainTab; onChange: (t: MainTab) => void }) {
  const isActive = active === tab.id;
  return (
    <button
      onClick={() => onChange(tab.id)}
      className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-[54px] hover:bg-[#F8FAFC] md:min-w-[76px]"
    >
      {tab.icon(isActive)}
      <span className="text-[10px] font-semibold transition-colors" style={{ color: isActive ? "#FF6B4A" : "#94A3B8" }}>
        {tab.label}
      </span>
    </button>
  );
}
