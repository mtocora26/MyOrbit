import { useState } from "react";
import { IconGraduation, IconDocument, IconUser, IconBuilding, IconHabit, IconGoogle, IconBell } from "../components/icons";

const DAYS = ["L", "M", "X", "J", "V", "S", "D"];
const DATES = [25, 26, 27, 28, 29, 30, 31];
const TODAY = 3;

const EVENTS = [
  { id: "1", time: "8:00",  end: "9:30",  title: "Análisis Numérico", loc: "Salón 302-B",   type: "clase",    color: "#7A5AF8", bg: "#F4F3FF", icon: <IconGraduation size={16} /> },
  { id: "2", time: "10:30", end: "11:59", title: "Entrega proy. Móviles", loc: "Plataforma LMS", type: "deadline", color: "#FF6B4A", bg: "#FFF0EC", icon: <IconDocument  size={16} /> },
  { id: "3", time: "12:00", end: "14:00", title: "Almuerzo con equipo", loc: "Cafetería",    type: "personal", color: "#12B76A", bg: "#ECFDF3", icon: <IconUser      size={16} /> },
  { id: "4", time: "15:00", end: "16:00", title: "Tutoría de Móviles",  loc: "Google Meet",  type: "tutoría",  color: "#2E90FA", bg: "#EFF8FF", icon: <IconBuilding  size={16} /> },
  { id: "5", time: "19:00", end: "19:30", title: "Hábito: Estudiar",    loc: "",             type: "hábito",   color: "#F79009", bg: "#FFFAEB", icon: <IconHabit     size={16} /> },
];

const TYPE_LABEL: Record<string, string> = {
  clase: "Clase", deadline: "Entrega", personal: "Personal",
  tutoría: "Tutoría", hábito: "Hábito", reunión: "Reunión",
};

export default function AgendaScreen({ onFab }: { onFab?: () => void }) {
  const [sel, setSel] = useState(TODAY);
  const [view, setView] = useState<"día" | "semana">("día");

  return (
    <div className="h-full flex flex-col bg-[#F7F8FA]">
      {/* Header */}
      <div className="bg-white flex-shrink-0" style={{ boxShadow: "0 1px 0 #F2F4F7" }}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div>
            <h1 className="text-[20px] font-extrabold text-[#172033]">Agenda</h1>
            <p className="text-[12px] text-[#94A3B8]">Agosto 2026</p>
          </div>
          <div className="flex gap-1 bg-[#F7F8FA] rounded-xl p-1 border border-[#E4E7EC]">
            {(["día", "semana"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-bold capitalize transition-all"
                style={{
                  background: view === v ? "white" : "transparent",
                  color: view === v ? "#172033" : "#94A3B8",
                  boxShadow: view === v ? "0 1px 4px rgba(16,24,40,0.08)" : "none",
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Week strip */}
        <div className="flex px-3 pb-3 gap-1">
          {DAYS.map((d, i) => {
            const isToday = i === TODAY;
            const isSel = i === sel;
            return (
              <button
                key={d}
                onClick={() => setSel(i)}
                className="flex-1 flex flex-col items-center py-2 rounded-2xl transition-all"
                style={{ background: isSel ? "#101828" : "transparent" }}
              >
                <span className="text-[10px] font-semibold" style={{ color: isSel ? "rgba(255,255,255,0.6)" : "#94A3B8" }}>{d}</span>
                <span className="text-[16px] font-extrabold mt-0.5" style={{ color: isSel ? "white" : isToday ? "#FF6B4A" : "#172033" }}>
                  {DATES[i]}
                </span>
                {isToday && !isSel && <div className="w-1 h-1 rounded-full bg-[#FF6B4A] mt-0.5" />}
              </button>
            );
          })}
        </div>

        {/* Google Calendar CTA */}
        <div className="mx-4 mb-3 px-3 py-2.5 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl flex items-center gap-2.5">
          <IconGoogle size={16} />
          <span className="text-[12px] font-semibold text-[#0284C7] flex-1">Conectar Google Calendar</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-2.5 pb-24">
        <p className="text-[12px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">Miércoles, 28 agosto</p>

        {EVENTS.map((ev) => (
          <div key={ev.id} className="flex gap-3 items-stretch cursor-pointer active:opacity-80 transition-opacity">
            {/* Time */}
            <div className="flex flex-col items-end w-14 flex-shrink-0 pt-3.5">
              <span className="text-[12px] font-bold text-[#172033] tabular-nums">{ev.time}</span>
              <span className="text-[10px] text-[#94A3B8] tabular-nums">{ev.end}</span>
            </div>

            {/* Card */}
            <div
              className="flex-1 rounded-2xl flex overflow-hidden"
              style={{ boxShadow: "0 1px 4px rgba(16,24,40,0.07), 0 0 0 1px rgba(16,24,40,0.04)" }}
            >
              <div className="w-1 flex-shrink-0" style={{ background: ev.color }} />
              <div className="flex-1 p-3.5 bg-white">
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: ev.bg, color: ev.color }}
                  >
                    {ev.icon}
                  </div>
                  <div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-0.5"
                      style={{ background: ev.bg, color: ev.color }}
                    >
                      {TYPE_LABEL[ev.type]}
                    </span>
                    <p className="text-[14px] font-bold text-[#172033] leading-snug">{ev.title}</p>
                    {ev.loc && (
                      <p className="text-[12px] text-[#94A3B8] mt-0.5 flex items-center gap-1">
                        <svg width="10" height="11" viewBox="0 0 10 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M5 1a3 3 0 0 1 3 3c0 3-3 6-3 6S2 7 2 4a3 3 0 0 1 3-3z" /><circle cx="5" cy="4" r="1" />
                        </svg>
                        {ev.loc}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Alert */}
        <div className="mt-2 rounded-2xl px-4 py-3.5 flex items-center gap-3" style={{ background: "#FFF0EC", border: "1px solid #FFD5CB" }}>
          <div className="w-9 h-9 rounded-full bg-[#FF6B4A] flex items-center justify-center flex-shrink-0">
            <IconBell size={16} color="white" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-[#172033]">Tutoría Análisis — en 30 minutos</p>
            <p className="text-[12px] text-[#94A3B8]">3:00 PM · Google Meet</p>
          </div>
        </div>
      </div>
    </div>
  );
}
