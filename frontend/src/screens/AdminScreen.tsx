import { useState } from "react";
import { ScreenHeader, Badge } from "../components/shared";
import { IconSearch, IconUsers, IconShield, IconUser } from "../components/icons";

interface Props { onBack: () => void; }

const USERS = [
  { id: "u1", name: "Daniela García",  email: "d.garcia@uni.edu",  role: "admin",   status: "activo",   initials: "DG", colorIdx: 0 },
  { id: "u2", name: "Mateo López",     email: "m.lopez@uni.edu",   role: "usuario",  status: "activo",   initials: "ML", colorIdx: 1 },
  { id: "u3", name: "Valentina Ruiz",  email: "v.ruiz@uni.edu",    role: "usuario",  status: "activo",   initials: "VR", colorIdx: 2 },
  { id: "u4", name: "Andrés Moreno",   email: "a.moreno@uni.edu",  role: "usuario",  status: "inactivo", initials: "AM", colorIdx: 3 },
  { id: "u5", name: "Camila Torres",   email: "c.torres@uni.edu",  role: "usuario",  status: "activo",   initials: "CT", colorIdx: 4 },
];

const AVATAR_COLORS = ["#7A5AF8", "#FF6B4A", "#2E90FA", "#F79009", "#12B76A"];

export default function AdminScreen({ onBack }: Props) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = USERS.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: "Total",   val: USERS.length,                                   color: "#172033", icon: <IconUsers size={14} color="#172033" /> },
    { label: "Activos", val: USERS.filter((u) => u.status === "activo").length, color: "#12B76A", icon: <IconUser size={14} color="#12B76A" /> },
    { label: "Admins",  val: USERS.filter((u) => u.role === "admin").length,  color: "#FF6B4A", icon: <IconShield size={14} color="#FF6B4A" /> },
  ];

  return (
    <div className="h-full flex flex-col bg-[#F7F8FA]">
      <ScreenHeader title="Panel Admin" subtitle="Gestión de usuarios" onBack={onBack} />

      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
        <div className="px-4 pb-3 bg-white border-b border-[#F2F4F7] flex-shrink-0 flex flex-col gap-3">
          {/* Stats */}
          <div className="flex gap-2">
            {stats.map((s) => (
              <div key={s.label} className="flex-1 bg-[#F7F8FA] border border-[#E4E7EC] rounded-2xl p-3">
                <div className="flex items-center gap-1.5 mb-1">{s.icon}<span className="text-[11px] text-[#94A3B8]">{s.label}</span></div>
                <p className="text-[22px] font-extrabold leading-none" style={{ color: s.color }}>{s.val}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-[#F7F8FA] border border-[#E4E7EC] rounded-xl px-3 py-2.5">
            <IconSearch size={15} color="#D0D5DD" />
            <input
              className="flex-1 bg-transparent text-[13px] text-[#172033] placeholder-[#D0D5DD] outline-none"
              placeholder="Buscar usuario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="px-4 pt-4 flex flex-col gap-3 pb-8">
          {/* CTA */}
          <button
            className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-[14px] font-bold text-white active:scale-[0.98] transition-transform"
            style={{ background: "linear-gradient(135deg, #101828, #1D3461)", boxShadow: "0 4px 16px rgba(16,24,40,0.2)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Crear nuevo usuario
          </button>

          <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest px-1">Usuarios ({filtered.length})</p>

          {filtered.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-2xl overflow-hidden"
              style={{ boxShadow: "0 1px 4px rgba(16,24,40,0.07), 0 0 0 1px rgba(16,24,40,0.04)" }}
            >
              <button
                className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left"
                onClick={() => setExpanded(expanded === user.id ? null : user.id)}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-extrabold text-white flex-shrink-0"
                  style={{ background: AVATAR_COLORS[user.colorIdx] }}
                >
                  {user.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-[#172033] truncate">{user.name}</p>
                  <p className="text-[12px] text-[#94A3B8] truncate">{user.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge label={user.role === "admin" ? "Admin" : "Usuario"} color={user.role === "admin" ? "coral" : "gray"} />
                  <div className="w-2 h-2 rounded-full" style={{ background: user.status === "activo" ? "#12B76A" : "#D0D5DD" }} />
                </div>
              </button>

              {expanded === user.id && (
                <div className="border-t border-[#F7F8FA] px-4 py-3 flex gap-2">
                  <ActionBtn label="Editar" color="#172033" bg="#F2F4F7" icon={
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                  } />
                  <ActionBtn label="Desactivar" color="#F79009" bg="#FFFAEB" icon={
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M10 9h4v6h-4z" fill="currentColor" stroke="none" /></svg>
                  } />
                  <ActionBtn label="Eliminar" color="#FF6B4A" bg="#FFF0EC" icon={
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6M9 6V4h6v2" /></svg>
                  } />
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-10 text-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-[#F2F4F7] flex items-center justify-center">
                <IconSearch size={24} color="#D0D5DD" />
              </div>
              <p className="text-[14px] font-bold text-[#172033]">Sin resultados</p>
              <p className="text-[12px] text-[#94A3B8]">Intenta con otro término de búsqueda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ label, color, bg, icon }: { label: string; color: string; bg: string; icon: React.ReactNode }) {
  return (
    <button
      className="flex-1 py-2 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
      style={{ color, background: bg }}
    >
      <span style={{ color }}>{icon}</span>
      {label}
    </button>
  );
}
