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
function IconMath({ size = 28, color = "var(--color-violet)" }: { size?: number; color?: string }) {
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
    <div className="h-full flex flex-col bg-paper">
      <ScreenHeader title="Análisis Numérico" subtitle="IIN-421 · 3 créditos" onBack={onBack} />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-1 pb-8 flex flex-col gap-4">
        {/* Info */}
        <div className="bg-card rounded-lg p-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-violet-wash flex items-center justify-center flex-shrink-0">
              <IconMath />
            </div>
            <div>
              <p className="text-[15px] font-bold text-ink">Análisis Numérico</p>
              <p className="text-[13px] text-ink-3">Dr. Carlos Ramírez</p>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                <Badge label="IIN-421" color="purple" />
                <Badge label="3 créditos" color="gray" />
              </div>
            </div>
          </div>
        </div>

        {/* Grade */}
        <div className="bg-card rounded-lg p-4">
          <div className="flex items-center gap-4">
            <ProgressRing value={(avg / 5) * 100} size={66} stroke={5.5} color="var(--color-violet)" trackColor="var(--color-violet-wash)">
              <span className="text-[15px] font-bold text-ink">{avg}</span>
            </ProgressRing>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-ink">Promedio actual</p>
              <p className="text-[13px] text-ink-3 mt-0.5">
                Meta: {goal} · Diferencia: <span className="text-coral-ink font-bold">+{(goal - avg).toFixed(1)}</span>
              </p>
              <ProgressBar value={(avg / goal) * 100} color="var(--color-violet)" height={5} bg="var(--color-violet-wash)" />
            </div>
          </div>
          <button
            onClick={onGrades}
            className="mt-3 w-full py-2.5 rounded-md text-[13px] font-bold active:scale-[0.98] transition-transform"
            style={{ background: "var(--color-violet-wash)", color: "var(--color-violet-ink)" }}
          >
            Ver notas y proyección →
          </button>
        </div>

        {/* Schedule */}
        <div className="bg-card rounded-lg p-4">
          <p className="text-[14px] font-bold text-ink mb-3">Horario</p>
          {SCHEDULE.map((s) => (
            <div key={s.day} className="flex items-center justify-between py-2.5 border-b border-paper last:border-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet" />
                <span className="text-[13px] font-bold text-ink">{s.day}</span>
              </div>
              <div className="flex items-center gap-1.5 text-ink-3">
                <IconCalendar size={12} color="var(--color-ink-3)" />
                <span className="text-[13px]">{s.time} · {s.room}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Evaluations */}
        <div className="bg-card rounded-lg p-4">
          <p className="text-[14px] font-bold text-ink mb-3">Evaluaciones</p>
          {EVALS.map((e) => (
            <div key={e.name} className="flex items-center gap-3 py-2.5 border-b border-paper last:border-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${e.done ? "bg-green-wash" : "bg-paper"}`}>
                {e.done
                  ? <svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="var(--color-green)" strokeWidth="2" strokeLinecap="round"><path d="M1 6l4 4L13 1" /></svg>
                  : <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--color-line-strong)" strokeWidth="1.8"><circle cx="7" cy="7" r="5.5" /><path d="M7 4v3l2 2" /></svg>
                }
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-ink">{e.name}</p>
                <p className="text-[13px] text-ink-3">{e.pct}% · {e.date}</p>
              </div>
              {e.done && e.nota !== null
                ? <span className="text-[16px] font-bold text-ink">{e.nota}</span>
                : <Badge label="Pendiente" color="gray" />
              }
            </div>
          ))}
        </div>

        {/* Tasks */}
        <div className="bg-card rounded-lg p-4">
          <p className="text-[14px] font-bold text-ink mb-3">Tareas pendientes</p>
          {[
            { label: "Taller de interpolación", due: "2 sep" },
            { label: "Informe método de Newton", due: "8 sep" },
          ].map((t) => (
            <div key={t.label} className="flex items-center gap-3 py-2.5 border-b border-paper last:border-0">
              <IconDocument size={14} color="var(--color-coral)" />
              <p className="text-[13px] font-semibold text-ink flex-1">{t.label}</p>
              <div className="flex items-center gap-1 text-ink-3">
                <IconCalendar size={11} color="var(--color-ink-3)" />
                <span className="text-[13px]">{t.due}</span>
              </div>
            </div>
          ))}
          <button className="flex items-center gap-2 mt-3 text-[13px] font-bold text-coral-ink">
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
