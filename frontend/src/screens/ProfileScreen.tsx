import { useEffect, useState } from "react";
import { ScreenHeader, Toggle } from "../components/shared";
import { IconCalendar, IconGoogle, IconMoon, IconBell, IconKey, IconUser, IconSettings } from "../components/icons";
import type { AuthSession } from "../services/authApi";
import { fetchUserProfile, saveUserProfile, type UserProfile } from "../services/profileApi";

interface Props { onBack: () => void; user: AuthSession; onLogout: () => void; }

export default function ProfileScreen({ onBack, user, onLogout }: Props) {
  const [darkMode, setDarkMode] = useState(false);
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
    <div className="h-full flex flex-col bg-[#F7F8FA]">
      <ScreenHeader title="Perfil" bg="#F7F8FA" onBack={onBack} />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-8 flex flex-col gap-4">
        {/* Avatar */}
        <div className="flex flex-col items-center py-4 gap-3">
          <div className="relative">
            <div
              className="rounded-full flex items-center justify-center font-extrabold text-white text-[26px]"
              style={{ width: 88, height: 88, background: "linear-gradient(135deg, #101828 0%, #1D3461 60%, #FF6B4A 100%)", boxShadow: "0 8px 24px rgba(255,107,74,0.3)" }}
            >
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <button
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "#FF6B4A", boxShadow: "0 2px 8px rgba(255,107,74,0.4)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
          </div>
          <div className="text-center">
            <p className="text-[18px] font-extrabold text-[#172033]">{user.name}</p>
            <p className="text-[13px] text-[#94A3B8]">{user.email}</p>
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
              {profileError && <p className="text-[12px] font-semibold text-[#B42318]">{profileError}</p>}
              <div className="flex gap-2">
                <button onClick={saveProfile} disabled={savingProfile} className="rounded-xl bg-[#FF6B4A] px-3 py-2 text-[12px] font-bold text-white disabled:opacity-50">{savingProfile ? "Guardando..." : "Guardar"}</button>
                <button onClick={() => setEditingProfile(false)} disabled={savingProfile} className="rounded-xl bg-[#F2F4F7] px-3 py-2 text-[12px] font-bold text-[#667085]">Cancelar</button>
              </div>
            </div>
          ) : (
            <>
              <Row label="Programa" value={profile?.program || "Sin configurar"} />
              <Row label="Semestre" value={profile?.semester || "Sin configurar"} />
              <Row label="Código" value={profile?.studentCode || "Sin configurar"} />
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[13px] text-[#667085]">Meta de promedio</span>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-extrabold text-[#FF6B4A]">{profile?.gradeTarget || "Sin configurar"}</span>
                  <button onClick={beginEdit} className="text-[11px] font-bold text-[#2E90FA]">{profile ? "Editar" : "Configurar"}</button>
                </div>
              </div>
            </>
          )}
        </Section>

        {/* Notifications */}
        <Section title="Notificaciones">
          <ToggleRow icon={<IconBell size={16} color="#FF6B4A" />} iconBg="#FFF0EC" label="Notificaciones push" sub="Alertas generales" on={pushNotifs} onChange={() => setPushNotifs(!pushNotifs)} />
          <ToggleRow icon={<IconBell size={16} color="#7A5AF8" />} iconBg="#F4F3FF" label="Recordatorios de hábitos" sub="Radar diario" on={habitNotifs} onChange={() => setHabitNotifs(!habitNotifs)} />
        </Section>

        {/* Integrations */}
        <Section title="Integraciones">
          <ToggleRow icon={<IconCalendar size={16} color="#2E90FA" />} iconBg="#EFF8FF" label="Google Calendar" sub={gcal ? "Conectado" : "No conectado"} on={gcal} onChange={() => setGcal(!gcal)} />
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-[#F7F8FA] flex items-center justify-center flex-shrink-0">
              <IconGoogle size={16} />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-[#172033]">Cuenta Google</p>
              <p className="text-[12px] text-[#94A3B8]">daniela.garcia@gmail.com</p>
            </div>
            <span className="text-[12px] font-bold text-[#12B76A]">Activa</span>
          </div>
        </Section>

        {/* Appearance */}
        <Section title="Apariencia">
          <ToggleRow icon={<IconMoon size={16} color="#172033" />} iconBg="#F2F4F7" label="Modo oscuro" sub="Tema oscuro de la interfaz" on={darkMode} onChange={() => setDarkMode(!darkMode)} />
        </Section>

        <button onClick={onLogout} className="w-full py-3.5 rounded-2xl border-2 border-[#E4E7EC] text-[14px] font-bold text-[#667085] active:scale-[0.98] transition-transform mt-2">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest mb-2 px-1">{title}</p>
      <div className="bg-white rounded-2xl overflow-hidden divide-y divide-[#F7F8FA]" style={{ boxShadow: "0 1px 4px rgba(16,24,40,0.07), 0 0 0 1px rgba(16,24,40,0.04)" }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-[13px] text-[#667085]">{label}</span>
      <span className="text-[13px] font-semibold text-[#172033]">{value}</span>
    </div>
  );
}

function ProfileInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="flex flex-col gap-1"><span className="text-[11px] font-bold text-[#667085]">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="rounded-xl border border-[#E4E7EC] bg-[#F7F8FA] px-3 py-2 text-[13px] text-[#172033] outline-none focus:border-[#FF6B4A]" /></label>;
}

function ToggleRow({ label, sub, on, onChange, icon, iconBg }: { label: string; sub: string; on: boolean; onChange: () => void; icon: React.ReactNode; iconBg: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[14px] font-bold text-[#172033]">{label}</p>
        <p className="text-[12px] text-[#94A3B8]">{sub}</p>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}
