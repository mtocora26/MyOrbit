import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
const prefersReducedMotion = () => window.matchMedia(QUERY).matches;

interface Props {
  /** Lado de la placa en px. */
  size?: number;
  className?: string;
}

/**
 * El logo (placa coral con la órbita de ruta) en movimiento: los arcos se trazan, la estación recorre la línea
 * hasta cerrar la órbita y vuelve a empezar. Con movimiento reducido (o «eliminar animaciones» de Android) queda
 * el logo quieto. Se anima con SMIL dentro del SVG: sin CSS que cargar, y listo desde el primer pintado.
 * Colores fijos (logo-coral / logo-night): el logo no cambia con el tema.
 */
export default function OrbitLoader({ size = 120, className }: Props) {
  const still = useSyncExternalStore(subscribe, prefersReducedMotion, () => true);
  const loop = { dur: "1.8s", repeatCount: "indefinite" } as const;
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="var(--color-logo-coral)" />
      <g transform="translate(16 16) scale(0.72) translate(-16 -16)" fill="var(--color-logo-night)" stroke="var(--color-logo-night)">
        <path d="M8.33 11.28A9 9 0 0 1 23.67 11.28M8.33 20.72A9 9 0 0 0 23.67 20.72" fill="none" strokeWidth="3" strokeDasharray="24" strokeDashoffset="0">
          {!still && <animate attributeName="stroke-dashoffset" values="24;0;0;24" keyTimes="0;0.35;0.85;1" {...loop} />}
        </path>
        <circle cx="7" cy="16" r="4.9" stroke="none" />
        <circle cx="25" cy="16" r="3.4" fill="none" strokeWidth="3" />
        {!still && (
          <circle r="1.7" fill="var(--color-logo-coral)" stroke="none">
            <animateMotion path="M16 7A9 9 0 1 1 15.99 7" keyPoints="0;1;1" keyTimes="0;0.7;1" calcMode="linear" {...loop} />
          </circle>
        )}
      </g>
    </svg>
  );
}
