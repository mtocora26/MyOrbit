import { useEffect, useState } from "react";
import { fetchNotificationPreferences, updateNotificationPreferences, type NotificationPreferences } from "../services/notificationsApi";
import { ScreenHeader, Toggle } from "../components/shared";
import { useTheme } from "../hooks/useTheme";
import { IconCalendar, IconMoon, IconBell, IconKey, IconUser, IconSettings } from "../components/icons";
import type { AuthSession } from "../services/authApi";
import { updateName, changePassword, updateTimeZone, availableTimeZones, detectTimeZone } from "../services/authApi";
import { fetchUserProfile, saveUserProfile, type UserProfile } from "../services/profileApi";

interface Props { onBack: () => void; user: AuthSession; onLogout: () => void; onUserUpdated?: (user: AuthSession) => void; }

export default function ProfileScreen({ onBack, user, onLogout, onUserUpdated }: Props) {
  const { theme, toggle: toggleTheme } = useTheme();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [zoneError, setZoneError] = useState<string | null>(null);
  const [savingZone, setSavingZone] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [draft, setDraft] = useState({ program: "", semester: "", gradeTarget: "" });
  const [editingAccount, setEditingAccount] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(user.name);
  const [draftName, setDraftName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setDisplayName(user.name);
    setDraftName(user.name);
  }, [user.name]);

  useEffect(() => {
    fetchUserProfile().then((data) => {
      setProfile(data);
      if (data) setDraft(data);
    }).catch((error: unknown) => setProfileError(error instanceof Error ? error.message : "No fue posible cargar tu perfil"));
  }, []);

  function beginEdit() {
    setDraft(profile ?? { program: "", semester: "", gradeTarget: "" });
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

  function beginEditAccount() {
    setDraftName(displayName);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setAccountError(null);
    setAccountMessage(null);
    setEditingAccount(true);
  }

  async function saveAccount() {
    const name = draftName.trim();
    if (!name) {
      setAccountError("El nombre es obligatorio");
      return;
    }
    if (name.length > 100) {
      setAccountError("El nombre es demasiado largo");
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setAccountError("Las contraseñas nuevas no coinciden");
      return;
    }
    try {
      setSavingAccount(true);
      setAccountError(null);
      setAccountMessage(null);
      if (name !== displayName) {
        const updated = await updateName(name);
        const next = { ...user, name: updated.name, email: updated.email, role: updated.role };
        onUserUpdated?.(next);
        setDisplayName(updated.name);
      }
      if (newPassword) {
        await changePassword(currentPassword, newPassword);
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setEditingAccount(false);
      setAccountMessage(newPassword ? "Nombre y contraseña actualizados." : "Nombre actualizado.");
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "No fue posible actualizar tu cuenta");
    } finally {
      setSavingAccount(false);
    }
  }

  function loadPrefs() {
    setPrefsError(null);
    fetchNotificationPreferences().then(setPrefs).catch((err) => setPrefsError(err instanceof Error ? err.message : "No fue posible cargar tus preferencias"));
  }

  useEffect(() => { loadPrefs(); }, []);

  // Se muestra el cambio al instante y se revierte si el servidor no lo guarda.
  async function changeZone(zone: string) {
    if (savingZone) return;
    try {
      setSavingZone(true);
      setZoneError(null);
      onUserUpdated?.(await updateTimeZone(zone));
    } catch (err) {
      setZoneError(err instanceof Error ? err.message : "No fue posible guardar tu zona horaria");
    } finally {
      setSavingZone(false);
    }
  }

  async function changePref(key: keyof NotificationPreferences) {
    if (!prefs || savingPrefs) return;
    const previous = prefs;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setPrefsError(null);
    setSavingPrefs(true);
    try {
      setPrefs(await updateNotificationPreferences(next));
    } catch (err) {
      setPrefs(previous);
      setPrefsError(err instanceof Error ? err.message : "No fue posible guardar tus preferencias");
    } finally {
      setSavingPrefs(false);
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
            <p className="text-[18px] font-bold text-ink">{displayName}</p>
            <p className="text-[13px] text-ink-3">{user.email}</p>
          </div>
        </div>

        {/* Account */}
        <Section title="Cuenta">
          {editingAccount ? (
            <div className="p-4 flex flex-col gap-3">
              <ProfileInput label="Nombre" value={draftName} onChange={setDraftName} placeholder="Tu nombre" />
              <p className="text-[12px] text-ink-3">Correo: {user.email} (no se puede cambiar)</p>
              <div className="border-t border-line pt-3 flex flex-col gap-3">
                <p className="text-[13px] font-bold text-ink">Cambiar contraseña <span className="font-normal text-ink-3">(opcional)</span></p>
                <ProfileInput label="Contraseña actual" value={currentPassword} onChange={setCurrentPassword} placeholder="La que usas ahora" />
                <ProfileInput label="Contraseña nueva" value={newPassword} onChange={setNewPassword} placeholder="Mínimo 8 caracteres" />
                <ProfileInput label="Confirmar contraseña nueva" value={confirmPassword} onChange={setConfirmPassword} placeholder="Repítela" />
                <p className="text-[12px] text-ink-3">Al cambiarla se cierran tus otras sesiones; esta permanece activa.</p>
              </div>
              {accountError && <p role="alert" className="text-[13px] font-semibold text-danger">{accountError}</p>}
              <div className="flex gap-2">
                <button onClick={saveAccount} disabled={savingAccount} className="rounded-md bg-coral px-3 py-2 text-[13px] font-bold text-white disabled:opacity-50">{savingAccount ? "Guardando..." : "Guardar cambios"}</button>
                <button onClick={() => setEditingAccount(false)} disabled={savingAccount} className="rounded-md bg-wash px-3 py-2 text-[13px] font-bold text-ink-2">Cancelar</button>
              </div>
            </div>
          ) : (
            <>
              <Row label="Nombre" value={displayName} />
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[13px] text-ink-2">Contraseña</span>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-ink-3">••••••••</span>
                  <button onClick={beginEditAccount} className="text-[13px] font-bold text-blue-ink">Editar cuenta</button>
                </div>
              </div>
              {accountMessage && <p role="status" className="px-4 py-2 text-[13px] font-semibold text-green-ink">{accountMessage}</p>}
            </>
          )}
        </Section>

        {/* Academic info */}
        <Section title="Información académica">
          {editingProfile ? (
            <div className="p-4 flex flex-col gap-3">
              <ProfileInput label="Programa" value={draft.program} onChange={(value) => setDraft({ ...draft, program: value })} />
              <ProfileInput label="Semestre" value={draft.semester} onChange={(value) => setDraft({ ...draft, semester: value })} />
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
          {prefs ? (
            <>
              <ToggleRow icon={<IconBell size={16} color="var(--color-amber)" />} iconBg="var(--color-amber-wash)" label="Fechas límite" sub="Al crear una tarea con fecha y 24 h antes" on={prefs.deadline} onChange={() => changePref("deadline")} />
              <ToggleRow icon={<IconBell size={16} color="var(--color-green)" />} iconBg="var(--color-green-wash)" label="Tareas completadas" sub="Aviso al terminar una tarea" on={prefs.event} onChange={() => changePref("event")} />
              <ToggleRow icon={<IconBell size={16} color="var(--color-violet)" />} iconBg="var(--color-violet-wash)" label="Hábitos pendientes" sub="Recordatorio diario de lo que falta hoy" on={prefs.habit} onChange={() => changePref("habit")} />
            </>
          ) : (
            <div className="px-4 py-3 min-h-[60px] flex items-center">
              {prefsError
                ? <div role="alert" className="flex w-full items-center justify-between gap-3"><p className="text-[14px] font-semibold text-danger">{prefsError}</p><button onClick={loadPrefs} className="min-h-[44px] flex-shrink-0 px-2 text-[14px] font-semibold text-coral-ink">Reintentar</button></div>
                : <p className="text-[14px] text-ink-2">Cargando preferencias...</p>}
            </div>
          )}
          {prefs && prefsError && <p role="alert" className="px-4 py-2 text-[14px] font-semibold text-danger">{prefsError}</p>}
        </Section>

        {/* Integrations */}
        <Section title="Integraciones">
          {/* Sin estado propio: no se muestra una cuenta ni una conexión hasta que exista la integración real (#47). */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={{ background: "var(--color-blue-wash)" }}>
              <IconCalendar size={16} color="var(--color-blue)" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-ink">Google Calendar</p>
              <p className="text-[13px] text-ink-3">Sincroniza tus fechas límite con tu calendario</p>
            </div>
            <span className="flex-shrink-0 rounded-[3px] bg-wash px-1.5 py-[3px] text-[13px] font-semibold leading-none text-ink-2">Próximamente</span>
          </div>
        </Section>

        {/* Time zone */}
        <Section title="Zona horaria">
          <div className="flex flex-col gap-2 px-4 py-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[14px] text-ink-2">Los recordatorios y «hoy» se calculan con esta zona</span>
              <select value={user.timeZone ?? detectTimeZone() ?? "America/Bogota"} onChange={(event) => changeZone(event.target.value)} disabled={savingZone} aria-label="Zona horaria" className="rounded-md border border-line bg-card px-3 py-3 text-[16px] text-ink outline-none focus:border-coral disabled:opacity-50">
                {zoneOptions(user.timeZone ?? detectTimeZone()).map((zone) => <option key={zone} value={zone}>{zone.replace(/_/g, " ")}</option>)}
              </select>
            </label>
            {!user.timeZone && <p className="text-[13px] text-ink-3">Aún no está guardada: se muestra la de tu dispositivo.</p>}
            {zoneError && <p role="alert" className="text-[14px] font-semibold text-danger">{zoneError}</p>}
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
      <Toggle on={on} onChange={onChange} label={label} />
    </div>
  );
}

/** Zonas para el selector; incluye la actual aunque el navegador no la liste. */
function zoneOptions(current: string | null): string[] {
  const zones = availableTimeZones();
  return current && !zones.includes(current) ? [current, ...zones] : zones;
}
