import { ScreenHeader, Badge, ProgressBar, ProgressRing } from "../components/shared";
import { IconCalendar, IconDocument, IconClipboard } from "../components/icons";

interface Props { onBack: () => void; onGrades: () => void; }

const SCHEDULE = [
  { day: "Lunes",     time: "8:00 – 9:30 AM",  room: "302-B" },
  { day: "Miércoles", time: "8:00 – 9:30 AM",  room: "302-B" },
  { day: "Viernes",   time: "10:00 – 11:00 AM", room: "Lab 201" },
];

const EVALS = [
  { name: "Parcial 1", date: "22 mar", pct: 30, nota: 4.3,  done: true },
  { name: "Taller 1",  date: "10 abr", pct: 10, nota: 4.8,  done: true },
  { name: "Parcial 2", date: "5 sep",  pct: 30, nota: null, done: false },
  { name: "Final",     date: "10 oct", pct: 30, nota: null, done: false },
];

// Simple triangle/compass SVG icon for Math
function IconMath({ size = 28, color = "#7A5AF8" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20L12 4l9 16H3z" />
      <path d="M8 20v-6h8v6" />
      <path d="M12 14v6" />
    </svg>
  );
}

export default function SubjectDetailScreen({ onBack, onGrades }: Props) {
  const avg = 4.2;
  const goal = 4.5;

  return (
    <div className="h-full flex flex-col bg-[#F7F8FA]">
      <ScreenHeader title="Análisis Numérico" subtitle="IIN-421 · 3 créditos" onBack={onBack} />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-1 pb-8 flex flex-col gap-4">
        {/* Info */}
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(16,24,40,0.07), 0 0 0 1px rgba(16,24,40,0.04)" }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#F4F3FF] flex items-center justify-center flex-shrink-0">
              <IconMath />
            </div>
            <div>
              <p className="text-[15px] font-extrabold text-[#172033]">Análisis Numérico</p>
              <p className="text-[13px] text-[#94A3B8]">Dr. Carlos Ramírez</p>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                <Badge label="IIN-421" color="purple" />
                <Badge label="3 créditos" color="gray" />
              </div>
            </div>
          </div>
        </div>

        {/* Grade */}
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(16,24,40,0.07), 0 0 0 1px rgba(16,24,40,0.04)" }}>
          <div className="flex items-center gap-4">
            <ProgressRing value={(avg / 5) * 100} size={66} stroke={5.5} color="#7A5AF8" trackColor="#F4F3FF">
              <span className="text-[15px] font-extrabold text-[#172033]">{avg}</span>
            </ProgressRing>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-[#172033]">Promedio actual</p>
              <p className="text-[12px] text-[#94A3B8] mt-0.5">
                Meta: {goal} · Diferencia: <span className="text-[#FF6B4A] font-bold">+{(goal - avg).toFixed(1)}</span>
              </p>
              <ProgressBar value={(avg / goal) * 100} color="#7A5AF8" height={5} bg="#F4F3FF" />
            </div>
          </div>
          <button
            onClick={onGrades}
            className="mt-3 w-full py-2.5 rounded-xl text-[13px] font-bold active:scale-[0.98] transition-transform"
            style={{ background: "#F4F3FF", color: "#7A5AF8" }}
          >
            Ver notas y proyección →
          </button>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(16,24,40,0.07), 0 0 0 1px rgba(16,24,40,0.04)" }}>
          <p className="text-[14px] font-bold text-[#172033] mb-3">Horario</p>
          {SCHEDULE.map((s) => (
            <div key={s.day} className="flex items-center justify-between py-2.5 border-b border-[#F7F8FA] last:border-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#7A5AF8]" />
                <span className="text-[13px] font-bold text-[#172033]">{s.day}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#94A3B8]">
                <IconCalendar size={12} color="#94A3B8" />
                <span className="text-[12px]">{s.time} · {s.room}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Evaluations */}
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(16,24,40,0.07), 0 0 0 1px rgba(16,24,40,0.04)" }}>
          <p className="text-[14px] font-bold text-[#172033] mb-3">Evaluaciones</p>
          {EVALS.map((e) => (
            <div key={e.name} className="flex items-center gap-3 py-2.5 border-b border-[#F7F8FA] last:border-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${e.done ? "bg-[#ECFDF3]" : "bg-[#F7F8FA]"}`}>
                {e.done
                  ? <svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="#12B76A" strokeWidth="2" strokeLinecap="round"><path d="M1 6l4 4L13 1" /></svg>
                  : <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#D0D5DD" strokeWidth="1.8"><circle cx="7" cy="7" r="5.5" /><path d="M7 4v3l2 2" /></svg>
                }
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-[#172033]">{e.name}</p>
                <p className="text-[11px] text-[#94A3B8]">{e.pct}% · {e.date}</p>
              </div>
              {e.done && e.nota !== null
                ? <span className="text-[16px] font-extrabold text-[#172033]">{e.nota}</span>
                : <Badge label="Pendiente" color="gray" />
              }
            </div>
          ))}
        </div>

        {/* Tasks */}
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(16,24,40,0.07), 0 0 0 1px rgba(16,24,40,0.04)" }}>
          <p className="text-[14px] font-bold text-[#172033] mb-3">Tareas pendientes</p>
          {[
            { label: "Taller de interpolación", due: "2 sep" },
            { label: "Informe método de Newton", due: "8 sep" },
          ].map((t) => (
            <div key={t.label} className="flex items-center gap-3 py-2.5 border-b border-[#F7F8FA] last:border-0">
              <IconDocument size={14} color="#FF6B4A" />
              <p className="text-[13px] font-semibold text-[#172033] flex-1">{t.label}</p>
              <div className="flex items-center gap-1 text-[#94A3B8]">
                <IconCalendar size={11} color="#94A3B8" />
                <span className="text-[12px]">{t.due}</span>
              </div>
            </div>
          ))}
          <button className="flex items-center gap-2 mt-3 text-[13px] font-bold text-[#FF6B4A]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Agregar tarea
          </button>
        </div>
      </div>
    </div>
  );
}
