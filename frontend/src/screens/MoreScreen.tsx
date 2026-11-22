import { useEffect, useState } from "react";
import { Avatar, PageTitle } from "../components/shared";
import { fetchUserProfile, type UserProfile } from "../services/profileApi";

interface Props {
  userName: string;
  onHabits: () => void;
  onProfile: () => void;
  onCategories: () => void;
  onNotifications: () => void;
  unreadCount: number;
  onAdmin: () => void;
  isAdmin: boolean;
}


export default function MoreScreen({ userName, onHabits, onProfile, onCategories, onNotifications, unreadCount, onAdmin, isAdmin }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchUserProfile().then(setProfile).catch(() => setProfile(null));
  }, []);

  const detail = [profile?.program, profile?.semester].filter(Boolean).join(" · ");
  const rows: { label: string; badge?: number; action: () => void }[] = [
    { label: "Hábitos", action: onHabits },
    { label: "Notificaciones", badge: unreadCount, action: onNotifications },
    { label: "Categorías", action: onCategories },
    ...(isAdmin ? [{ label: "Usuarios", action: onAdmin }] : []),
  ];

  return (
    <div className="flex h-full flex-col bg-paper">
      <header className="flex-shrink-0 px-4 pt-3 pb-2 lg:px-8 lg:pt-8">
        <PageTitle>Más</PageTitle>
      </header>

      <div className="no-scrollbar flex flex-1 flex-col overflow-y-auto px-4 py-3 lg:mx-0 lg:max-w-[640px] lg:px-8 [&>*]:shrink-0">
        {/* Una sola lista: tu perfil primero, luego lo demás. Sin tarjetas por destino ni iconos de color. */}
        <ul className="overflow-hidden rounded-md bg-card">
          <li>
            <button onClick={onProfile} className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left active:bg-wash">
              <Avatar name={userName} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px] font-semibold text-ink">{userName}</span>
                <span className="block truncate text-[14px] text-ink-2">{detail || "Completa tu perfil"}</span>
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-line-strong)" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" className="flex-shrink-0"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </li>
          {rows.map((row) => (
            <li key={row.label} className="border-t border-line">
              <button onClick={row.action} className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left active:bg-wash">
                <span className="flex-1 text-[16px] font-semibold text-ink">{row.label}</span>
                {(row.badge ?? 0) > 0 && <span aria-label={`${row.badge} sin leer`} className="num text-[16px] font-semibold text-coral-ink">{(row.badge ?? 0) > 99 ? "99+" : row.badge}</span>}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-line-strong)" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" className="flex-shrink-0"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
