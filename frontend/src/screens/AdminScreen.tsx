import { useEffect, useMemo, useState } from "react";
import { ScreenHeader, Badge, BottomSheet, InputField, Skeleton } from "../components/shared";
import { IconSearch } from "../components/icons";
import { createAdminUser, deleteAdminUser, fetchAdminUsers, updateAdminUser, type AdminUser, type UserRole } from "../services/adminApi";
import { getSession } from "../services/authApi";

interface Props { onBack: () => void; }

const AVATAR_COLORS = ["var(--color-violet)", "var(--color-coral)", "var(--color-blue)", "var(--color-amber)", "var(--color-green)"];

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
}

function avatarColor(id: string): string {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export default function AdminScreen({ onBack }: Props) {
  const me = getSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetchAdminUsers()
      .then((data) => { if (!ignore) setUsers(data); })
      .catch((err) => { if (!ignore) setError(err instanceof Error ? err.message : "No fue posible cargar los usuarios"); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => !term || user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term));
  }, [users, search]);

  const stats = [
    { label: "Total", value: users.length },
    { label: "Activos", value: users.filter((user) => user.active).length },
    { label: "Admins", value: users.filter((user) => user.role === "ADMIN").length },
  ];

  async function change(user: AdminUser, input: { role?: UserRole; active?: boolean }) {
    try {
      setBusyId(user.id);
      setError(null);
      const updated = await updateAdminUser(user.id, input);
      setUsers((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible actualizar el usuario");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(user: AdminUser) {
    try {
      setBusyId(user.id);
      setError(null);
      await deleteAdminUser(user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setConfirmDelete(null);
      setExpanded(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible eliminar el usuario");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="h-full flex flex-col bg-paper">
      <ScreenHeader
        title="Usuarios"
        subtitle="Gestión de cuentas"
        onBack={onBack}
        right={<button onClick={() => setCreating(true)} className="flex min-h-[44px] items-center gap-2 rounded-md bg-coral px-4 text-[15px] font-semibold text-night">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          Nuevo
        </button>}
      />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-8 flex flex-col gap-4 lg:px-8">
        <dl className="grid grid-cols-3 divide-x divide-line rounded-md border border-line bg-card">
          {stats.map((stat) => (
            <div key={stat.label} className="px-3 py-3">
              <dt className="text-[13px] font-medium text-ink-2">{stat.label}</dt>
              <dd className="num mt-1 text-[28px] font-semibold leading-none text-ink">{loading ? "–" : stat.value}</dd>
            </div>
          ))}
        </dl>

        <label className="flex items-center gap-2 rounded-md border border-line bg-card px-3 py-2.5 transition-colors focus-within:border-coral">
          <IconSearch size={16} color="var(--color-ink-3)" />
          <input
            className="flex-1 bg-transparent text-[16px] text-ink outline-none"
            placeholder="Buscar por nombre o correo"
            aria-label="Buscar usuario"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        {error && <p role="alert" className="rounded-md border border-danger-line bg-danger-wash px-3 py-2 text-[14px] font-medium text-danger">{error}</p>}

        <h2 className="px-1 font-display text-[20px] font-semibold leading-none text-ink">Cuentas ({filtered.length})</h2>

        {loading ? (
          <div className="flex flex-col gap-2" aria-busy="true">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[68px]" />)}</div>
        ) : (
          <ul className="flex flex-col gap-2 lg:max-w-[760px]">
            {filtered.map((user) => {
              const isMe = user.id === me?.id;
              const open = expanded === user.id;
              const busy = busyId === user.id;
              return (
                <li key={user.id} className="overflow-hidden rounded-md border border-line bg-card">
                  <button className="flex w-full items-center gap-3.5 px-4 py-3 text-left" onClick={() => { setExpanded(open ? null : user.id); setConfirmDelete(null); }} aria-expanded={open}>
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-[15px] font-semibold text-night" style={{ background: avatarColor(user.id) }} aria-hidden="true">{initials(user.name)}</span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[16px] font-semibold ${user.active ? "text-ink" : "text-ink-3"}`}>{user.name}{isMe && <span className="ml-2 text-[13px] font-medium text-ink-2">(tú)</span>}</span>
                      <span className="block truncate text-[14px] text-ink-2">{user.email}</span>
                    </span>
                    <span className="flex flex-shrink-0 items-center gap-2">
                      {user.role === "ADMIN" && <Badge label="Admin" color="coral" />}
                      {!user.active && <Badge label="Inactivo" color="gray" />}
                    </span>
                  </button>

                  {open && (
                    <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
                      <ActionButton disabled={busy || isMe} onClick={() => change(user, { role: user.role === "ADMIN" ? "USER" : "ADMIN" })}>
                        {user.role === "ADMIN" ? "Quitar admin" : "Hacer admin"}
                      </ActionButton>
                      <ActionButton disabled={busy || isMe} onClick={() => change(user, { active: !user.active })}>
                        {user.active ? "Desactivar" : "Reactivar"}
                      </ActionButton>
                      {confirmDelete === user.id ? (
                        <>
                          <ActionButton danger disabled={busy} onClick={() => remove(user)}>{busy ? "Eliminando" : "Confirmar eliminación"}</ActionButton>
                          <ActionButton onClick={() => setConfirmDelete(null)}>Cancelar</ActionButton>
                        </>
                      ) : (
                        <ActionButton danger disabled={busy || isMe} onClick={() => setConfirmDelete(user.id)}>Eliminar</ActionButton>
                      )}
                      {isMe && <p className="w-full text-[14px] text-ink-2">No puedes cambiar tu propio rol ni tu estado desde aquí.</p>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {!loading && filtered.length === 0 && !error && (
          <div className="py-10 text-center">
            <p className="font-display text-[22px] font-semibold leading-none text-ink">Sin resultados</p>
            <p className="mt-2 text-[14px] text-ink-2">{users.length === 0 ? "Aún no hay cuentas." : "Prueba con otro nombre o correo."}</p>
          </div>
        )}
      </div>

      <NewUserSheet
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(user) => { setUsers((current) => [...current, user]); setCreating(false); }}
      />
    </div>
  );
}

function ActionButton({ children, onClick, disabled, danger }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[44px] rounded-md border px-4 text-[14px] font-semibold transition-colors duration-150 disabled:opacity-40 ${danger ? "border-danger-line text-danger" : "border-line-strong text-ink"}`}
    >
      {children}
    </button>
  );
}

function NewUserSheet({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (user: AdminUser) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("USER");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    try {
      setSaving(true);
      setError(null);
      const user = await createAdminUser({ name, email, password, role });
      setName(""); setEmail(""); setPassword(""); setRole("USER");
      onCreated(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible crear el usuario");
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Nuevo usuario">
      <div className="flex flex-col gap-3">
        <InputField autoFocus label="Nombre" value={name} onChange={setName} />
        <InputField label="Correo" type="email" value={email} onChange={setEmail} />
        <InputField label="Contraseña inicial" type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={setPassword} />
        <div role="radiogroup" aria-label="Rol" className="flex gap-1 rounded-md border border-line bg-paper p-1">
          {(["USER", "ADMIN"] as const).map((option) => (
            <button key={option} role="radio" aria-checked={role === option} onClick={() => setRole(option)}
              className="min-h-[44px] flex-1 rounded-sm text-[15px] font-semibold transition-colors duration-150"
              style={{ background: role === option ? "var(--color-card)" : "transparent", color: role === option ? "var(--color-ink)" : "var(--color-ink-2)" }}>
              {option === "USER" ? "Usuario" : "Administrador"}
            </button>
          ))}
        </div>
        {error && <p role="alert" className="text-[14px] font-medium text-danger">{error}</p>}
        <button onClick={submit} disabled={saving || !name.trim() || !email.trim() || password.length < 8}
          className="mt-1 min-h-[48px] rounded-md bg-coral text-[16px] font-semibold text-night disabled:opacity-50">
          {saving ? "Creando..." : "Crear usuario"}
        </button>
      </div>
    </BottomSheet>
  );
}
