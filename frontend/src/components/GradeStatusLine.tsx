import type { GradeTone } from "../services/academicApi";

const TONE: Record<GradeTone, { color: string; mark: string }> = {
  ok: { color: "var(--color-green-ink)", mark: "✓" },
  need: { color: "var(--color-blue-ink)", mark: "→" },
  risk: { color: "var(--color-danger)", mark: "!" },
  idle: { color: "var(--color-ink-2)", mark: "·" },
};

/** Estado de la meta: color + símbolo + texto, nunca solo color. */
export default function GradeStatusLine({ tone, children }: { tone: GradeTone; children: string }) {
  const style = TONE[tone];
  return (
    <p className="flex items-start gap-2 text-[14px] font-semibold leading-snug" style={{ color: style.color }}>
      <span aria-hidden="true" className="num flex-shrink-0">{style.mark}</span>
      <span>{children}</span>
    </p>
  );
}
