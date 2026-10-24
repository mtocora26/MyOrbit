import type { MainTab } from "../App";
import { TABS } from "./BottomNav";
import ThemeToggle from "./ThemeToggle";

interface Props {
  active: MainTab;
  userName: string;
  onChange: (tab: MainTab) => void;
  onFab: () => void;
  onProfile: () => void;
}

/** Navegación de escritorio: la misma red, en vertical. Visible desde lg. */
export default function SideNav({ active, userName, onChange, onFab, onProfile }: Props) {
  return (
    <nav aria-label="Principal" className="hidden w-[232px] flex-shrink-0 flex-col border-r border-line bg-card px-3 py-5 lg:flex">
      <div className="flex items-center gap-2.5 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-coral text-night" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><circle cx="7" cy="16" r="3.2" /><circle cx="25" cy="16" r="3.2" /><path d="M10.2 16h11.6" /></svg>
        </span>
        <span className="font-display text-[26px] font-semibold leading-none tracking-tight text-ink">MyOrbit</span>
      </div>

      <button
        onClick={onFab}
        className="mt-6 flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-coral px-4 text-[15px] font-semibold text-night"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        Añadir
      </button>

      <ul className="mt-5 flex flex-col gap-1">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <li key={tab.id}>
              <button
                onClick={() => onChange(tab.id)}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex min-h-[44px] w-full items-center gap-3 rounded-md px-3 text-left text-[16px] font-semibold transition-colors duration-150 hover:bg-wash ${isActive ? "bg-wash text-ink" : "text-ink-2"}`}
              >
                <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-[2px] bg-coral transition-transform duration-300 ease-out" style={{ transform: isActive ? "scaleY(1)" : "scaleY(0)" }} />
                <span className={isActive ? "text-coral-ink" : ""}>{tab.icon}</span>
                {tab.label === "Hoy" ? "Hoy" : tab.label === "Uni" ? "Universidad" : tab.label}
              </button>
            </li>
          );
        })}
      </ul>

      <ThemeToggle withLabel className="mt-auto w-full justify-start px-3" />
      <button onClick={onProfile} className="mt-1 flex min-h-[48px] items-center gap-3 rounded-md px-3 text-left transition-colors duration-150 hover:bg-wash">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-wash font-display text-[16px] font-semibold text-ink" aria-hidden="true">{userName.slice(0, 1).toUpperCase()}</span>
        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">{userName}</span>
      </button>
    </nav>
  );
}
