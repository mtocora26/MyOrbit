import { useState } from "react";
import { IconGoogle, IconBell } from "../components/icons";

const DAYS = ["L", "M", "X", "J", "V", "S", "D"];
const DATES = [25, 26, 27, 28, 29, 30, 31];
const TODAY = 3;

const EVENTS = [
  { id: "1", time: "8:00",  end: "9:30",  title: "Análisis Numérico", loc: "Salón 302-B",   type: "clase",    color: "var(--color-violet-ink)", line: "var(--color-violet)" },
  { id: "2", time: "10:30", end: "11:59", title: "Entrega proy. Móviles", loc: "Plataforma LMS", type: "deadline", color: "var(--color-coral-ink)", line: "var(--color-coral)" },
  { id: "3", time: "12:00", end: "14:00", title: "Almuerzo con equipo", loc: "Cafetería",    type: "personal", color: "var(--color-green-ink)", line: "var(--color-green)" },
  { id: "4", time: "15:00", end: "16:00", title: "Tutoría de Móviles",  loc: "Google Meet",  type: "tutoría",  color: "var(--color-blue-ink)", line: "var(--color-blue)" },
  { id: "5", time: "19:00", end: "19:30", title: "Hábito: Estudiar",    loc: "",             type: "hábito",   color: "var(--color-amber-ink)", line: "var(--color-amber)" },
];

const toMinutes = (time: string) => { const [h, m] = time.split(":").map(Number); return h * 60 + m; };
const nowMinutes = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };

const TYPE_LABEL: Record<string, string> = {
  clase: "Clase", deadline: "Entrega", personal: "Personal",
  tutoría: "Tutoría", hábito: "Hábito", reunión: "Reunión",
};

export default function AgendaScreen({ onFab }: { onFab?: () => void }) {
  const [sel, setSel] = useState(TODAY);
  const [view, setView] = useState<"día" | "semana">("día");

  return (
    <div className="h-full flex flex-col bg-paper">
      {/* Header */}
      <div className="bg-paper border-b border-line flex-shrink-0">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 lg:px-8 lg:pt-8">
          <div>
            <h1 className="font-display text-[28px] font-semibold leading-none text-ink lg:text-[44px]">Agenda</h1>
            <p className="mt-1 text-[14px] text-ink-2">Agosto 2026</p>
          </div>
          <div className="flex gap-1 bg-paper rounded-md p-1 border border-line">
            {(["día", "semana"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3 py-1.5 rounded-lg text-[13px] font-bold capitalize transition-all"
                style={{
                  background: view === v ? "var(--color-card)" : "transparent",
                  color: view === v ? "var(--color-ink)" : "var(--color-ink-3)",
                                  }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Week strip */}
        <div className="flex px-3 pb-3 gap-1 lg:px-8 lg:max-w-[760px]">
          {DAYS.map((d, i) => {
            const isToday = i === TODAY;
            const isSel = i === sel;
            return (
              <button
                key={d}
                onClick={() => setSel(i)}
                className="flex-1 flex flex-col items-center py-2 rounded-lg transition-all"
                style={{ background: isSel ? "var(--color-night)" : "transparent" }}
              >
                <span className="text-[13px] font-semibold" style={{ color: isSel ? "rgba(255,255,255,0.6)" : "var(--color-ink-3)" }}>{d}</span>
                <span className="text-[16px] font-bold mt-0.5" style={{ color: isSel ? "white" : isToday ? "var(--color-coral)" : "var(--color-ink)" }}>
                  {DATES[i]}
                </span>
                {isToday && !isSel && <div className="w-1 h-1 rounded-full bg-coral mt-0.5" />}
              </button>
            );
          })}
        </div>

        {/* Google Calendar CTA */}
        <div className="mx-4 mb-3 lg:mx-8 lg:max-w-[760px] px-3 py-2.5 bg-blue-wash border border-line rounded-md flex items-center gap-2.5">
          <IconGoogle size={16} />
          <span className="text-[13px] font-semibold text-blue-ink flex-1">Conectar Google Calendar</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
        </div>
      </div>

      {/* Línea de tiempo: el día como una ruta, con el marcador "ahora" */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-24 lg:px-8"><div className="lg:max-w-[760px]">
        <h2 className="mb-3 font-display text-[20px] font-semibold leading-none text-ink">Miércoles, 28 de agosto</h2>

        <ol>
          {EVENTS.map((ev, index) => {
            const startsAfterNow = toMinutes(ev.time) > nowMinutes();
            const showNow = sel === TODAY && startsAfterNow && (index === 0 || toMinutes(EVENTS[index - 1].time) <= nowMinutes());
            const last = index === EVENTS.length - 1;
            return (
              <li key={ev.id}>
                {showNow && (
                  <div className="flex items-center gap-3 py-1" aria-label="Ahora">
                    <span className="num w-12 flex-shrink-0 text-right text-[15px] font-semibold text-coral-ink">Ahora</span>
                    <span className="relative flex h-6 w-7 items-center justify-center"><span className="orbit-pulse absolute h-3 w-3 rounded-full bg-coral" /><span className="relative h-3 w-3 rounded-full bg-coral" /></span>
                    <span className="h-[2px] flex-1 bg-coral" />
                  </div>
                )}
                <div className="orbit-rise flex gap-3" style={{ ["--i" as string]: index }}>
                  <div className="flex w-12 flex-shrink-0 flex-col items-end pt-2.5">
                    <span className="num text-[17px] font-semibold leading-none text-ink">{ev.time}</span>
                    <span className="num mt-1 text-[14px] leading-none text-ink-3">{ev.end}</span>
                  </div>
                  <div className="relative flex w-7 flex-shrink-0 justify-center">
                    {!last && <span className="absolute left-1/2 top-[26px] bottom-0 w-[3px] -translate-x-1/2" style={{ background: ev.line }} />}
                    <span className="relative z-10 mt-[13px] h-[18px] w-[18px] rounded-full border-[3px] bg-paper" style={{ borderColor: ev.line }} />
                  </div>
                  <button className="mb-1 min-w-0 flex-1 rounded-md px-1 py-2 text-left transition-colors duration-150 active:bg-wash">
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold leading-none" style={{ color: ev.color }}>
                      <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: ev.line }} aria-hidden="true" />
                      {TYPE_LABEL[ev.type]}
                    </span>
                    <p className="mt-1.5 text-[16px] font-semibold leading-snug text-ink">{ev.title}</p>
                    {ev.loc && <p className="mt-0.5 text-[14px] text-ink-2">{ev.loc}</p>}
                  </button>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-4 flex items-center gap-3 rounded-md border border-coral bg-card px-4 py-3">
          <IconBell size={18} color="var(--color-coral-ink)" />
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-ink">Tutoría Análisis, en 30 minutos</p>
            <p className="text-[14px] text-ink-2">3:00 PM · Google Meet</p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
