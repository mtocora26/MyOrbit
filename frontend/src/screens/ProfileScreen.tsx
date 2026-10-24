import { useEffect, useState } from "react";
import { ScreenHeader, Toggle } from "../components/shared";
import { useTheme } from "../hooks/useTheme";
import { IconCalendar, IconGoogle, IconMoon, IconBell, IconKey, IconUser, IconSettings } from "../components/icons";
import type { AuthSession } from "../services/authApi";
import { fetchUserProfile, saveUserProfile, type UserProfile } from "../services/profileApi";

interface Props { onBack: () => void; user: AuthSession; onLogout: () => void; }

export default function ProfileScreen({ onBack, user, onLogout }: Props) {
  const { theme, toggle: toggleTheme } = useTheme();
  const [pushNotifs, setPushNotifs] = useState(true);
  const [habitNotifs, setHabitNotifs] = useState(true);
  const [gcal, setGcal] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [draft, setDraft] = useState({ program: "", semester: "", studentCode: "", gradeTarget: "" });

  useEffect(() => {
    fetchUserProfile().then((data) => {
      setProfile(data);
      if (data) setDraft(data);
    }).catch((error: unknown) => setProfileError(error instanceof Error ? error.message : "No fue posible cargar tu perfil"));
  }, []);

  function beginEdit() {
    setDraft(profile ?? { program: "", semester: "", studentCode: "", gradeTarget: "" });
    setProfileError(null);
    setEditingProfile(true);
  }

  async function saveProfile() {
    try {
      setSavingProfile(true);
      setProfileError(null);
      const saved = await saveUserProfile(draft);
      setProfile(saved);
      setEditingProfile(false);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "No fue posible guardar tu perfil");
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <div className="h-full flex flex-col bg-paper">
      <ScreenHeader title="Perfil" bg="var(--color-paper)" onBack={onBack} />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-8 flex flex-col gap-4">
        {/* Avatar */}
        <div className="flex flex-col items-center py-4 gap-3">
          <div className="relative">
            <div
              className="rounded-full flex items-center justify-center font-bold text-white text-[26px]"
              style={{ width: 88, height: 88, background: "var(--color-night)" }}
            >
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <button
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "var(--color-coral)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
          </div>
          <div className="text-center">
            <p className="text-[18px] font-bold text-ink">{user.name}</p>
            <p className="text-[13px] text-ink-3">{user.email}</p>
          </div>
        </div>

        {/* Academic info */}
        <Section title="Información académica">
          {editingProfile ? (
            <div className="p-4 flex flex-col gap-3">
              <ProfileInput label="Programa" value={draft.program} onChange={(value) => setDraft({ ...draft, program: value })} />
              <div className="grid grid-cols-2 gap-2">
                <ProfileInput label="Semestre" value={draft.semester} onChange={(value) => setDraft({ ...draft, semester: value })} />
                <ProfileInput label="Código" value={draft.studentCode} onChange={(value) => setDraft({ ...draft, studentCode: value })} />
              </div>
              <ProfileInput label="Meta de promedio" value={draft.gradeTarget} onChange={(value) => setDraft({ ...draft, gradeTarget: value })} placeholder="Ej. 4.5" />
              {profileError && <p className="text-[13px] font-semibold text-danger">{profileError}</p>}
              <div className="flex gap-2">
                <button onClick={saveProfile} disabled={savingProfile} className="rounded-md bg-coral px-3 py-2 text-[13px] font-bold text-white disabled:opacity-50">{savingProfile ? "Guardando..." : "Guardar"}</button>
                <button onClick={() => setEditingProfile(false)} disabled={savingProfile} className="rounded-md bg-wash px-3 py-2 text-[13px] font-bold text-ink-2">Cancelar</button>
              </div>
            </div>
          ) : (
            <>
              <Row label="Programa" value={profile?.program || "Sin configurar"} />
              <Row label="Semestre" value={profile?.semester || "Sin configurar"} />
              <Row label="Código" value={profile?.studentCode || "Sin configurar"} />
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[13px] text-ink-2">Meta de promedio</span>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold text-coral-ink">{profile?.gradeTarget || "Sin configurar"}</span>
                  <button onClick={beginEdit} className="text-[13px] font-bold text-blue-ink">{profile ? "Editar" : "Configurar"}</button>
                </div>
              </div>
            </>
          )}
        </Section>

        {/* Notifications */}
        <Section title="Notificaciones">
          <ToggleRow icon={<IconBell size={16} color="var(--color-coral)" />} iconBg="var(--color-coral-wash)" label="Notificaciones push" sub="Alertas generales" on={pushNotifs} onChange={() => setPushNotifs(!pushNotifs)} />
          <ToggleRow icon={<IconBell size={16} color="var(--color-violet)" />} iconBg="var(--color-violet-wash)" label="Recordatorios de hábitos" sub="Radar diario" on={habitNotifs} onChange={() => setHabitNotifs(!habitNotifs)} />
        </Section>

        {/* Integrations */}
        <Section title="Integraciones">
          <ToggleRow icon={<IconCalendar size={16} color="var(--color-blue)" />} iconBg="var(--color-blue-wash)" label="Google Calendar" sub={gcal ? "Conectado" : "No conectado"} on={gcal} onChange={() => setGcal(!gcal)} />
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-paper flex items-center justify-center flex-shrink-0">
              <IconGoogle size={16} />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-ink">Cuenta Google</p>
              <p className="text-[13px] text-ink-3">daniela.garcia@gmail.com</p>
            </div>
            <span className="text-[13px] font-bold text-green-ink">Activa</span>
          </div>
        </Section>

        {/* Appearance */}
        <Section title="Apariencia">
          <ToggleRow icon={<IconMoon size={16} color="var(--color-ink)" />} iconBg="var(--color-wash)" label="Modo oscuro" sub="Tema oscuro de la interfaz" on={theme === "dark"} onChange={toggleTheme} />
        </Section>

        <button onClick={onLogout} className="w-full py-3.5 rounded-lg border-2 border-line text-[14px] font-bold text-ink-2 active:scale-[0.98] transition-transform mt-2">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-display text-[20px] font-semibold text-ink mb-2 px-1">{title}</p>
      <div className="bg-card rounded-lg overflow-hidden divide-y divide-paper">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-[13px] text-ink-2">{label}</span>
      <span className="text-[13px] font-semibold text-ink">{value}</span>
    </div>
  );
}

function ProfileInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="flex flex-col gap-1"><span className="text-[13px] font-bold text-ink-2">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="rounded-md border border-line bg-paper px-3 py-2 text-[13px] text-ink outline-none focus:border-coral" /></label>;
}

function ToggleRow({ label, sub, on, onChange, icon, iconBg }: { label: string; sub: string; on: boolean; onChange: () => void; icon: React.ReactNode; iconBg: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 min-h-[60px]">
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center text-ink-2" data-icon-bg={iconBg}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[16px] font-semibold text-ink">{label}</p>
        <p className="text-[14px] text-ink-2">{sub}</p>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}
