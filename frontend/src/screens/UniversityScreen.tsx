import { Badge, ProgressBar } from "../components/shared";
import { IconCalendar } from "../components/icons";

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
  { id: "s1", name: "Análisis Numérico",     code: "IIN-421", credits: 3, teacher: "Dr. Ramírez",  avg: 4.2, goal: 4.5, color: "var(--color-violet-ink)", line: "var(--color-violet)", bg: "var(--color-violet-wash)", nextEval: "Parcial 2 · 5 sep",    tasks: 2, SubjectIcon: IconMath },
  { id: "s2", name: "Desarrollo Móvil",      code: "IIN-450", credits: 3, teacher: "Ing. Torres",  avg: 4.7, goal: 4.8, color: "var(--color-coral-ink)", line: "var(--color-coral)", bg: "var(--color-coral-wash)", nextEval: "Proy. Final · 29 ago", tasks: 3, SubjectIcon: IconPhone },
  { id: "s3", name: "Redes de Computadores", code: "IIN-410", credits: 3, teacher: "Ing. Medina",  avg: 3.9, goal: 4.0, color: "var(--color-blue-ink)", line: "var(--color-blue)", bg: "var(--color-blue-wash)", nextEval: "Parcial 2 · 30 ago",   tasks: 1, SubjectIcon: IconNetwork },
  { id: "s4", name: "Gestión de Proyectos",  code: "ADM-310", credits: 2, teacher: "Dra. Ospina",  avg: 4.5, goal: 4.5, color: "var(--color-green-ink)", line: "var(--color-green)", bg: "var(--color-green-wash)", nextEval: "Quiz 3 · 3 sep",        tasks: 0, SubjectIcon: IconBriefcase },
];

export default function UniversityScreen({ onSubjectTap }: Props) {
  const totalCredits = SUBJECTS.reduce((s, sub) => s + sub.credits, 0);
  const weightedAvg = SUBJECTS.reduce((s, sub) => s + sub.avg * sub.credits, 0) / totalCredits;

  return (
    <div className="h-full flex flex-col bg-paper">
      <header className="flex-shrink-0 border-b border-line px-4 pt-5 pb-4 lg:px-8 lg:pt-8">
        <h1 className="font-display text-[34px] font-semibold leading-none tracking-tight text-ink lg:text-[44px]">Universidad</h1>
        <p className="mt-1.5 text-[14px] text-ink-2">Semestre 2026-1</p>
        <dl className="mt-4 grid grid-cols-3 lg:max-w-[560px] divide-x divide-line rounded-md border border-line bg-card">
          <Stat label="Promedio" value={weightedAvg.toFixed(2)} sub="/5.0" />
          <Stat label="Meta" value="4.50" sub="/5.0" accent />
          <Stat label="Créditos" value={String(totalCredits)} />
        </dl>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-3 pb-6 lg:px-8">
        {/* Upcoming evals */}
        <div className="rounded-md border border-line bg-card p-4">
          <h2 className="mb-2 font-display text-[20px] font-semibold leading-none text-ink">Próximas evaluaciones</h2>
          {[
            { name: "Proyecto Final — Móviles", date: "Hoy",           urgent: true,  color: "var(--color-coral-ink)" },
            { name: "Parcial 2 — Redes",        date: "Mañana",        urgent: false, color: "var(--color-blue-ink)" },
            { name: "Parcial 2 — Análisis",     date: "En 8 días",     urgent: false, color: "var(--color-violet-ink)" },
          ].map((e) => (
            <div key={e.name} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
              <p className="text-[15px] font-semibold text-ink flex-1">{e.name}</p>
              {e.urgent
                ? <Badge label={e.date} color="coral" />
                : <div className="flex items-center gap-1 text-ink-3"><IconCalendar size={11} color="var(--color-ink-3)" /><span className="text-[13px]">{e.date}</span></div>
              }
            </div>
          ))}
        </div>

        <h2 className="px-1 pt-2 font-display text-[20px] font-semibold leading-none text-ink">Materias ({SUBJECTS.length})</h2>

        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2">
        {SUBJECTS.map((sub) => {
          const gap = sub.goal - sub.avg;
          const { SubjectIcon } = sub;
          return (
            <div
              key={sub.id}
              onClick={onSubjectTap}
              className="cursor-pointer rounded-md border border-line bg-card p-4 transition-transform duration-150 ease-out active:scale-[0.985]"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-[68px] flex-shrink-0 rounded-sm border-[3px] py-2 text-center" style={{ borderColor: sub.line }}><span className="font-display text-[20px] font-semibold leading-none tracking-wide text-ink">{sub.code.split("-")[0]}</span><span className="num mt-0.5 block text-[14px] leading-none text-ink-2">{sub.code.split("-")[1]}</span></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-[16px] font-semibold text-ink leading-snug">{sub.name}</p>
                      <p className="text-[13px] text-ink-3 mt-0.5">{sub.teacher} · {sub.credits} créditos</p>
                    </div>
                    <span className="num text-[30px] font-semibold leading-none text-ink">{sub.avg}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span
                      className="rounded-sm px-1.5 py-1 text-[13px] font-semibold leading-none"
                      style={{ background: sub.bg, color: sub.color }}
                    >
                      Meta {sub.goal}{gap > 0 ? ` (+${gap.toFixed(1)})` : " · al día"}
                    </span>
                    {sub.tasks > 0 && <Badge label={`${sub.tasks} ${sub.tasks === 1 ? "tarea" : "tareas"}`} color="coral" />}
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 text-ink-3">
                    <IconCalendar size={11} color="var(--color-ink-3)" />
                    <span className="text-[13px]">{sub.nextEval}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        </div>
        <div className="h-2" />
      </div>
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="px-3 py-3">
      <dt className="text-[13px] font-medium text-ink-2">{label}</dt>
      <dd className="mt-1 flex items-baseline gap-0.5">
        <span className={`num text-[28px] font-semibold leading-none ${accent ? "text-coral-ink" : "text-ink"}`}>{value}</span>
        {sub && <span className="num text-[14px] text-ink-3">{sub}</span>}
      </dd>
    </div>
  );
}
