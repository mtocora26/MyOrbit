import { useEffect, useState } from "react";
import { Avatar, PageTitle, SummaryList, SummaryRow } from "../components/shared";
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
        <SummaryList>
          <SummaryRow lead={<Avatar name={userName} />} title={userName} detail={detail || "Completa tu perfil"} onClick={onProfile} />
          {rows.map((row) => <SummaryRow key={row.label} title={row.label} badge={row.badge} onClick={row.action} />)}
        </SummaryList>
      </div>
    </div>
  );
}
