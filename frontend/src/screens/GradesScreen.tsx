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
    <div className="h-full flex flex-col bg-paper">
      <ScreenHeader title="Notas y metas" subtitle="Análisis Numérico" onBack={onBack} />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-1 pb-8 flex flex-col gap-4">
        {/* Goal hero */}
        <div
          className="rounded-lg p-5 relative overflow-hidden"
          style={{ background: "var(--color-night)" }}
        >
          <svg className="absolute top-0 right-0 opacity-10" width="120" height="100" viewBox="0 0 120 100">
            <ellipse cx="80" cy="50" rx="75" ry="40" fill="none" stroke="white" strokeWidth="1.5" />
            <ellipse cx="50" cy="50" rx="40" ry="22" fill="none" stroke="white" strokeWidth="1" />
            <circle cx="115" cy="15" r="5" fill="white" />
          </svg>

          <p className="font-display text-[18px] text-ink-2 font-semibold relative z-10">Proyección académica</p>
          <div className="flex items-end gap-5 mt-3 relative z-10">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <IconTrendUp size={14} color="var(--color-ink-3)" />
                <p className="text-[13px] text-ink-3 font-medium">Actual</p>
              </div>
              <p className="text-[32px] font-bold text-white leading-none">{AVG}</p>
            </div>
            <svg width="20" height="16" viewBox="0 0 20 16" fill="none" className="mb-1">
              <path d="M1 8h17M13 2l6 6-6 6" stroke="var(--color-ink-2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <IconTarget size={14} color="var(--color-coral)" />
                <p className="text-[13px] text-ink-3 font-medium">Meta</p>
              </div>
              <p className="text-[32px] font-bold text-coral-ink leading-none">{GOAL}</p>
            </div>
          </div>

          <div className="mt-4 bg-white/[0.08] border border-white/10 rounded-lg p-3 relative z-10">
            <p className="text-[13px] text-white font-semibold leading-relaxed">
              Necesitas aproximadamente{" "}
              <span className="text-coral-ink font-bold">{NEEDED}</span>{" "}
              en los próximos cortes para alcanzar tu meta de {GOAL}.
            </p>
          </div>
        </div>

        {/* Bar chart */}
        <div className="bg-card rounded-lg p-4">
          <p className="text-[14px] font-bold text-ink mb-4">Progreso por corte</p>
          <div className="flex items-end gap-3" style={{ height: 110 }}>
            {CHART.map((b) => {
              const h = Math.round((b.val / 5) * 85);
              return (
                <div key={b.label} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[13px] font-bold tabular-nums" style={{ color: b.done ? "var(--color-violet)" : "var(--color-coral)" }}>
                    {b.val.toFixed(1)}
                  </span>
                  <div className="w-full relative rounded-t-xl overflow-hidden" style={{ height: 85, background: "var(--color-paper)" }}>
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-t-xl"
                      style={{
                        height: h,
                        background: b.done
                          ? "var(--color-violet)"
                          : "var(--color-coral-wash)",
                        border: b.done ? "none" : "1.5px dashed var(--color-coral)",
                      }}
                    />
                  </div>
                  <span className="text-[13px] font-semibold text-ink-3">{b.label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-paper">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-violet" />
              <span className="text-[13px] text-ink-3">Obtenida</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm border border-dashed border-coral" style={{ background: "rgba(255,107,74,0.15)" }} />
              <span className="text-[13px] text-ink-3">Necesaria (proyección)</span>
            </div>
          </div>
        </div>

        {/* Cortes */}
        <div className="bg-card rounded-lg p-4">
          <p className="text-[14px] font-bold text-ink mb-3">Notas por corte</p>
          {CORTES.map((c) => (
            <div key={c.name} className="mb-3.5 last:mb-0">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: c.done ? "var(--color-violet)" : "var(--color-line)" }} />
                  <span className="text-[13px] font-semibold text-ink">{c.name}</span>
                  <span className="text-[13px] text-ink-3">{c.pct}%</span>
                </div>
                {c.done && c.nota !== null
                  ? <span className="text-[15px] font-bold text-ink tabular-nums">{c.nota}</span>
                  : <span className="text-[13px] font-bold text-coral-ink tabular-nums">{NEEDED} *</span>
                }
              </div>
              <ProgressBar
                value={c.done && c.nota ? (c.nota / 5) * 100 : (NEEDED / 5) * 100}
                color={c.done ? "var(--color-violet)" : "var(--color-coral)"}
                height={6}
                bg={c.done ? "var(--color-violet-wash)" : "var(--color-coral-wash)"}
              />
            </div>
          ))}
          <p className="text-[13px] text-ink-3 mt-3">* Nota mínima estimada para alcanzar la meta</p>
        </div>

        {/* Weighted avg */}
        <div className="bg-card rounded-lg p-4">
          <p className="text-[14px] font-bold text-ink mb-3">Promedio semestral ponderado</p>
          {WEIGHTED.map((r) => (
            <div key={r.sub} className="flex items-center justify-between py-2.5 border-b border-paper last:border-0">
              <div>
                <p className="text-[13px] font-semibold text-ink">{r.sub}</p>
                <p className="text-[13px] text-ink-3">{r.credits} créditos</p>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-bold text-ink tabular-nums">{r.avg}</p>
                <p className="text-[13px] text-ink-3 tabular-nums">× {r.credits} = {(r.avg * r.credits).toFixed(1)}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3 mt-1 border-t-2 border-line">
            <div className="flex items-center gap-1.5">
              <IconTrendUp size={16} color="var(--color-coral)" />
              <span className="text-[14px] font-bold text-ink">Promedio ponderado</span>
            </div>
            <span className="text-[22px] font-bold text-coral-ink tabular-nums">4.35</span>
          </div>
        </div>
      </div>
    </div>
  );
}
