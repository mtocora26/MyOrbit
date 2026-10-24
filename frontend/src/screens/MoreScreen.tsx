import { useEffect, useState } from "react";
import { IconHabit, IconRadar, IconUser, IconShield } from "../components/icons";
import { fetchUserProfile, type UserProfile } from "../services/profileApi";

interface Props {
  userName: string;
  onHabits: () => void;
  onRadar: () => void;
  onProfile: () => void;
  onAdmin: () => void;
  isAdmin: boolean;
}

const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

export default function MoreScreen({ userName, onHabits, onRadar, onProfile, onAdmin, isAdmin }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchUserProfile().then(setProfile).catch(() => setProfile(null));
  }, []);

  const detail = [profile?.program, profile?.semester].filter(Boolean).join(" · ");
  const tiles = [
    { icon: <IconHabit size={24} />, label: "Hábitos", color: "var(--color-violet-ink)", bg: "var(--color-violet-wash)", action: onHabits },
    { icon: <IconRadar size={24} />, label: "Radar", color: "var(--color-blue-ink)", bg: "var(--color-blue-wash)", action: onRadar },
    { icon: <IconUser size={24} />, label: "Perfil", color: "var(--color-coral-ink)", bg: "var(--color-coral-wash)", action: onProfile },
    ...(isAdmin ? [{ icon: <IconShield size={24} />, label: "Usuarios", color: "var(--color-ink-2)", bg: "var(--color-wash)", action: onAdmin }] : []),
  ];

  return (
    <div className="flex h-full flex-col bg-paper">
      <header className="flex-shrink-0 px-4 pt-3 pb-2 lg:px-8 lg:pt-8">
        <h1 className="font-display text-[30px] font-semibold leading-none tracking-tight text-ink lg:text-[44px]">Más</h1>
      </header>

      <div className="no-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-3 lg:mx-0 lg:max-w-[640px] lg:px-8">
        <button onClick={onProfile} className="flex min-h-[64px] items-center gap-3 rounded-md border border-line bg-card p-3 text-left active:bg-wash">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md bg-coral font-display text-[20px] font-semibold text-night" aria-hidden="true">{initials(userName)}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[16px] font-semibold text-ink">{userName}</span>
            <span className="block truncate text-[14px] text-ink-2">{detail || "Completa tu perfil"}</span>
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-line-strong)" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
        </button>

        <div className="grid grid-cols-2 gap-3">
          {tiles.map((tile) => (
            <button key={tile.label} onClick={tile.action} className="flex min-h-[96px] flex-col items-start justify-between rounded-md border border-line bg-card p-3.5 text-left active:bg-wash">
              <span className="flex h-10 w-10 items-center justify-center rounded-md" style={{ background: tile.bg, color: tile.color }}>{tile.icon}</span>
              <span className="text-[16px] font-semibold text-ink">{tile.label}</span>
            </button>
          ))}
        </div>

        <p className="mt-auto pt-2 text-center text-[13px] text-ink-3">MyOrbit v1.0</p>
      </div>
    </div>
  );
}
