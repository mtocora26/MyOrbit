import type { GradeTone } from "../services/academicApi";

const TONE: Record<GradeTone, { color: string; bg: string; mark: string }> = {
  ok: { color: "var(--color-green-ink)", bg: "var(--color-green-wash)", mark: "✓" },
  need: { color: "var(--color-blue-ink)", bg: "var(--color-blue-wash)", mark: "→" },
  risk: { color: "var(--color-danger)", bg: "var(--color-danger-wash)", mark: "!" },
  idle: { color: "var(--color-ink-2)", bg: "var(--color-wash)", mark: "·" },
};

/** Estado de la meta: color + símbolo + texto, nunca solo color. */
export default function GradeStatusLine({ tone, children }: { tone: GradeTone; children: string }) {
  const style = TONE[tone];
  return (
    <p className="inline-flex items-start gap-2 rounded-[4px] px-2 py-1.5 text-[14px] font-semibold leading-snug" style={{ background: style.bg, color: style.color }}>
      <span aria-hidden="true" className="num flex-shrink-0">{style.mark}</span>
      <span>{children}</span>
    </p>
  );
}
