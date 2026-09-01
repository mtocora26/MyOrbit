import { Badge, ProgressRing, OrbitDecor } from "../components/shared";
import { IconGraduation, IconTarget, IconTrendUp, IconCalendar } from "../components/icons";

interface Props { onSubjectTap: () => void; }

// Subject-specific icons as minimal SVGs
function IconMath({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20L12 4l9 16H3z" />
      <path d="M9 20v-5h6v5" />
    </svg>
  );
}
function IconPhone({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="2" width="10" height="20" rx="3" />
      <path d="M10 17h4" />
    </svg>
  );
}
function IconNetwork({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
      <path d="M12 7v5l-5.3 5M12 12l5.3 5" />
    </svg>
  );
}
function IconBriefcase({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <path d="M12 12v3M8 12v1M16 12v1" />
    </svg>
  );
}

const SUBJECTS = [
  { id: "s1", name: "Análisis Numérico",     code: "IIN-421", credits: 3, teacher: "Dr. Ramírez",  avg: 4.2, goal: 4.5, color: "#7A5AF8", bg: "#F4F3FF", nextEval: "Parcial 2 · 5 sep",    tasks: 2, SubjectIcon: IconMath },
  { id: "s2", name: "Desarrollo Móvil",      code: "IIN-450", credits: 3, teacher: "Ing. Torres",  avg: 4.7, goal: 4.8, color: "#FF6B4A", bg: "#FFF0EC", nextEval: "Proy. Final · 29 ago", tasks: 3, SubjectIcon: IconPhone },
  { id: "s3", name: "Redes de Computadores", code: "IIN-410", credits: 3, teacher: "Ing. Medina",  avg: 3.9, goal: 4.0, color: "#2E90FA", bg: "#EFF8FF", nextEval: "Parcial 2 · 30 ago",   tasks: 1, SubjectIcon: IconNetwork },
  { id: "s4", name: "Gestión de Proyectos",  code: "ADM-310", credits: 2, teacher: "Dra. Ospina",  avg: 4.5, goal: 4.5, color: "#12B76A", bg: "#ECFDF3", nextEval: "Quiz 3 · 3 sep",        tasks: 0, SubjectIcon: IconBriefcase },
];

export default function UniversityScreen({ onSubjectTap }: Props) {
  const totalCredits = SUBJECTS.reduce((s, sub) => s + sub.credits, 0);
  const weightedAvg = SUBJECTS.reduce((s, sub) => s + sub.avg * sub.credits, 0) / totalCredits;

  return (
    <div className="h-full flex flex-col bg-[#F7F8FA]">
      {/* Hero */}
      <div
        className="relative px-5 pt-2 pb-6 overflow-hidden flex-shrink-0"
        style={{ background: "linear-gradient(160deg, #101828 0%, #1D3461 100%)", borderRadius: "0 0 28px 28px" }}
      >
        <OrbitDecor className="absolute top-0 right-0" />
        <p className="text-[12px] text-[#64748B] font-medium relative z-10">Semestre 2026-1</p>
        <h1 className="text-[22px] font-extrabold text-white mt-0.5 relative z-10">Universidad</h1>

        <div className="flex gap-3 mt-4 relative z-10">
          <StatCard label="Promedio" value={weightedAvg.toFixed(2)} sub="/5.0" icon={<IconTrendUp size={13} color="#94A3BF" />} valueColor="white" />
          <StatCard label="Meta" value="4.50" sub="/5.0" icon={<IconTarget size={13} color="#FF6B4A" />} valueColor="#FF6B4A" />
          <div className="bg-white/[0.08] border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center">
            <p className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider">Créditos</p>
            <span className="text-[26px] font-extrabold text-white leading-none mt-1">{totalCredits}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-3 pb-6">
        {/* Upcoming evals */}
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(16,24,40,0.07), 0 0 0 1px rgba(16,24,40,0.04)" }}>
          <p className="text-[14px] font-bold text-[#172033] mb-3">Próximas evaluaciones</p>
          {[
            { name: "Proyecto Final — Móviles", date: "Hoy",           urgent: true,  color: "#FF6B4A" },
            { name: "Parcial 2 — Redes",        date: "Mañana",        urgent: false, color: "#2E90FA" },
            { name: "Parcial 2 — Análisis",     date: "En 8 días",     urgent: false, color: "#7A5AF8" },
          ].map((e) => (
            <div key={e.name} className="flex items-center gap-3 py-2.5 border-b border-[#F7F8FA] last:border-0">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
              <p className="text-[13px] font-semibold text-[#172033] flex-1">{e.name}</p>
              {e.urgent
                ? <Badge label={e.date} color="coral" />
                : <div className="flex items-center gap-1 text-[#94A3B8]"><IconCalendar size={11} color="#94A3B8" /><span className="text-[11px]">{e.date}</span></div>
              }
            </div>
          ))}
        </div>

        <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider px-1">Materias ({SUBJECTS.length})</p>

        {SUBJECTS.map((sub) => {
          const gap = sub.goal - sub.avg;
          const { SubjectIcon } = sub;
          return (
            <div
              key={sub.id}
              onClick={onSubjectTap}
              className="bg-white rounded-2xl p-4 cursor-pointer active:scale-[0.985] transition-transform"
              style={{ boxShadow: "0 1px 4px rgba(16,24,40,0.07), 0 0 0 1px rgba(16,24,40,0.04)" }}
            >
              <div className="flex items-start gap-3.5">
                <ProgressRing value={(sub.avg / 5) * 100} size={54} stroke={4.5} color={sub.color} trackColor="#F2F4F7">
                  <span className="text-[12px] font-extrabold" style={{ color: sub.color }}>{sub.avg}</span>
                </ProgressRing>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-[14px] font-bold text-[#172033] leading-snug">{sub.name}</p>
                      <p className="text-[12px] text-[#94A3B8] mt-0.5">{sub.teacher} · {sub.credits} créditos</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D0D5DD" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{ background: sub.bg, color: sub.color }}
                    >
                      Meta {sub.goal}{gap > 0 ? ` (+${gap.toFixed(1)})` : " ✓"}
                    </span>
                    {sub.tasks > 0 && <Badge label={`${sub.tasks} tareas`} color="coral" />}
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 text-[#94A3B8]">
                    <IconCalendar size={11} color="#94A3B8" />
                    <span className="text-[11px]">{sub.nextEval}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div className="h-2" />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, valueColor }: { label: string; value: string; sub: string; icon: React.ReactNode; valueColor: string }) {
  return (
    <div className="flex-1 bg-white/[0.08] border border-white/10 rounded-2xl p-3">
      <div className="flex items-center gap-1.5 mb-1">{icon}<p className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider">{label}</p></div>
      <div className="flex items-end gap-0.5">
        <span className="text-[26px] font-extrabold leading-none tabular-nums" style={{ color: valueColor }}>{value}</span>
        <span className="text-[12px] text-[#64748B] mb-0.5">{sub}</span>
      </div>
    </div>
  );
}
