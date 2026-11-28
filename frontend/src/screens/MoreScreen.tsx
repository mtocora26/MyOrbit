import { useEffect, useState } from "react";
import { Avatar, PageTitle, SummaryList, SummaryRow } from "../components/shared";
import { IconBell, IconDocument, IconHabit, IconShield, IconTag } from "../components/icons";
import { fetchUserProfile, type UserProfile } from "../services/profileApi";

interface Props {
  userName: string;
  onHabits: () => void;
  onProfile: () => void;
  onCategories: () => void;
  onNotifications: () => void;
  onLegal: () => void;
  unreadCount: number;
  onAdmin: () => void;
  isAdmin: boolean;
}


export default function MoreScreen({ userName, onHabits, onProfile, onCategories, onNotifications, onLegal, unreadCount, onAdmin, isAdmin }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchUserProfile().then(setProfile).catch(() => setProfile(null));
  }, []);

  const detail = [profile?.program, profile?.semester].filter(Boolean).join(" · ");
  const rows: { label: string; icon: React.ReactNode; badge?: number; action: () => void }[] = [
    { label: "Hábitos", icon: <IconHabit size={24} />, action: onHabits },
    { label: "Notificaciones", icon: <IconBell size={24} />, badge: unreadCount, action: onNotifications },
    { label: "Categorías", icon: <IconTag size={24} />, action: onCategories },
    ...(isAdmin ? [{ label: "Usuarios", icon: <IconShield size={24} />, action: onAdmin }] : []),
    { label: "Términos y privacidad", icon: <IconDocument size={24} />, action: onLegal },
  ];

  return (
    <div className="flex h-full flex-col bg-paper">
      <header className="flex-shrink-0 px-4 pt-3 pb-2 lg:px-8 lg:pt-8">
        <PageTitle>Más</PageTitle>
      </header>

      <div className="no-scrollbar flex flex-1 flex-col overflow-y-auto px-4 py-3 lg:mx-0 lg:max-w-[640px] lg:px-8 [&>*]:shrink-0">
        {/* Una sola lista: tu perfil primero, luego lo demás. Iconos planos, sin tarjetas de color. */}
        <SummaryList>
          <SummaryRow lead={<Avatar name={userName} />} title={userName} detail={detail || "Completa tu perfil"} onClick={onProfile} />
          {rows.map((row) => <SummaryRow key={row.label} title={row.label} icon={row.icon} badge={row.badge} onClick={row.action} />)}
        </SummaryList>
      </div>
    </div>
  );
}
