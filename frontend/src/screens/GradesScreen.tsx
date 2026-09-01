import { ScreenHeader, ProgressBar, Badge } from "../components/shared";
import { IconTrendUp, IconTarget } from "../components/icons";

interface Props { onBack: () => void; }

const CORTES = [
  { name: "Corte 1", pct: 30, nota: 4.3, done: true },
  { name: "Corte 2", pct: 30, nota: null, done: false },
  { name: "Corte 3 (Final)", pct: 40, nota: null, done: false },
];

const WEIGHTED = [
  { sub: "Análisis Numérico", avg: 4.2, credits: 3 },
  { sub: "Desarrollo Móvil",  avg: 4.7, credits: 3 },
  { sub: "Redes de Comp.",    avg: 3.9, credits: 3 },
  { sub: "Gestión Proyectos", avg: 4.5, credits: 2 },
];

const AVG = 4.2;
const GOAL = 4.5;
const NEEDED = 4.62;
const CHART = [
  { label: "C1", val: 4.3,    done: true },
  { label: "C2", val: NEEDED, done: false },
  { label: "C3", val: NEEDED, done: false },
];

export default function GradesScreen({ onBack }: Props) {
  return (
    <div className="h-full flex flex-col bg-[#F7F8FA]">
      <ScreenHeader title="Notas y metas" subtitle="Análisis Numérico" onBack={onBack} />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-1 pb-8 flex flex-col gap-4">
        {/* Goal hero */}
        <div
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{ background: "linear-gradient(150deg, #101828 0%, #1D3461 100%)" }}
        >
          <svg className="absolute top-0 right-0 opacity-10" width="120" height="100" viewBox="0 0 120 100">
            <ellipse cx="80" cy="50" rx="75" ry="40" fill="none" stroke="white" strokeWidth="1.5" />
            <ellipse cx="50" cy="50" rx="40" ry="22" fill="none" stroke="white" strokeWidth="1" />
            <circle cx="115" cy="15" r="5" fill="white" />
          </svg>

          <p className="text-[11px] text-[#64748B] font-semibold uppercase tracking-wider relative z-10">Proyección académica</p>
          <div className="flex items-end gap-5 mt-3 relative z-10">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <IconTrendUp size={14} color="#94A3BF" />
                <p className="text-[10px] text-[#64748B] font-medium">Actual</p>
              </div>
              <p className="text-[32px] font-extrabold text-white leading-none">{AVG}</p>
            </div>
            <svg width="20" height="16" viewBox="0 0 20 16" fill="none" className="mb-1">
              <path d="M1 8h17M13 2l6 6-6 6" stroke="#4A5568" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <IconTarget size={14} color="#FF6B4A" />
                <p className="text-[10px] text-[#64748B] font-medium">Meta</p>
              </div>
              <p className="text-[32px] font-extrabold text-[#FF6B4A] leading-none">{GOAL}</p>
            </div>
          </div>

          <div className="mt-4 bg-white/[0.08] border border-white/10 rounded-2xl p-3 relative z-10">
            <p className="text-[13px] text-white font-semibold leading-relaxed">
              Necesitas aproximadamente{" "}
              <span className="text-[#FF6B4A] font-extrabold">{NEEDED}</span>{" "}
              en los próximos cortes para alcanzar tu meta de {GOAL}.
            </p>
          </div>
        </div>

        {/* Bar chart */}
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(16,24,40,0.07), 0 0 0 1px rgba(16,24,40,0.04)" }}>
          <p className="text-[14px] font-bold text-[#172033] mb-4">Progreso por corte</p>
          <div className="flex items-end gap-3" style={{ height: 110 }}>
            {CHART.map((b) => {
              const h = Math.round((b.val / 5) * 85);
              return (
                <div key={b.label} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[12px] font-extrabold tabular-nums" style={{ color: b.done ? "#7A5AF8" : "#FF6B4A" }}>
                    {b.val.toFixed(1)}
                  </span>
                  <div className="w-full relative rounded-t-xl overflow-hidden" style={{ height: 85, background: "#F7F8FA" }}>
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-t-xl"
                      style={{
                        height: h,
                        background: b.done
                          ? "linear-gradient(180deg, #7A5AF8 0%, #9E8AF5 100%)"
                          : "repeating-linear-gradient(135deg, rgba(255,107,74,0.15), rgba(255,107,74,0.15) 4px, rgba(255,107,74,0.3) 4px, rgba(255,107,74,0.3) 8px)",
                        border: b.done ? "none" : "1.5px dashed #FF6B4A",
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-[#94A3B8]">{b.label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#F7F8FA]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#7A5AF8]" />
              <span className="text-[11px] text-[#94A3B8]">Obtenida</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm border border-dashed border-[#FF6B4A]" style={{ background: "rgba(255,107,74,0.15)" }} />
              <span className="text-[11px] text-[#94A3B8]">Necesaria (proyección)</span>
            </div>
          </div>
        </div>

        {/* Cortes */}
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(16,24,40,0.07), 0 0 0 1px rgba(16,24,40,0.04)" }}>
          <p className="text-[14px] font-bold text-[#172033] mb-3">Notas por corte</p>
          {CORTES.map((c) => (
            <div key={c.name} className="mb-3.5 last:mb-0">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: c.done ? "#7A5AF8" : "#E4E7EC" }} />
                  <span className="text-[13px] font-semibold text-[#172033]">{c.name}</span>
                  <span className="text-[11px] text-[#94A3B8]">{c.pct}%</span>
                </div>
                {c.done && c.nota !== null
                  ? <span className="text-[15px] font-extrabold text-[#172033] tabular-nums">{c.nota}</span>
                  : <span className="text-[13px] font-bold text-[#FF6B4A] tabular-nums">{NEEDED} *</span>
                }
              </div>
              <ProgressBar
                value={c.done && c.nota ? (c.nota / 5) * 100 : (NEEDED / 5) * 100}
                color={c.done ? "#7A5AF8" : "#FF6B4A"}
                height={6}
                bg={c.done ? "#F4F3FF" : "#FFF0EC"}
              />
            </div>
          ))}
          <p className="text-[10px] text-[#D0D5DD] mt-3">* Nota mínima estimada para alcanzar la meta</p>
        </div>

        {/* Weighted avg */}
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(16,24,40,0.07), 0 0 0 1px rgba(16,24,40,0.04)" }}>
          <p className="text-[14px] font-bold text-[#172033] mb-3">Promedio semestral ponderado</p>
          {WEIGHTED.map((r) => (
            <div key={r.sub} className="flex items-center justify-between py-2.5 border-b border-[#F7F8FA] last:border-0">
              <div>
                <p className="text-[13px] font-semibold text-[#172033]">{r.sub}</p>
                <p className="text-[11px] text-[#94A3B8]">{r.credits} créditos</p>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-extrabold text-[#172033] tabular-nums">{r.avg}</p>
                <p className="text-[11px] text-[#94A3B8] tabular-nums">× {r.credits} = {(r.avg * r.credits).toFixed(1)}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3 mt-1 border-t-2 border-[#E4E7EC]">
            <div className="flex items-center gap-1.5">
              <IconTrendUp size={16} color="#FF6B4A" />
              <span className="text-[14px] font-bold text-[#172033]">Promedio ponderado</span>
            </div>
            <span className="text-[22px] font-extrabold text-[#FF6B4A] tabular-nums">4.35</span>
          </div>
        </div>
      </div>
    </div>
  );
}
