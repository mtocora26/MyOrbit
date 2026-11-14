/**
 * Logo de MyOrbit: la órbita de ruta. La estación llena (izquierda) es lo hecho y la hueca lo pendiente.
 * Los colores son fijos en ambos temas (logo-coral / logo-night): el logo no cambia con el tema.
 * Fuente de verdad: docs/brand/ y el brand kit.
 */

interface GlyphProps {
  size?: number;
}

/** Solo el glifo, a una tinta (currentColor). */
export function LogoGlyph({ size = 24 }: GlyphProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="currentColor" stroke="currentColor" aria-hidden="true">
      <path d="M8.33 11.28A9 9 0 0 1 23.67 11.28M8.33 20.72A9 9 0 0 0 23.67 20.72" fill="none" strokeWidth={3} />
      <circle cx="7" cy="16" r="4.9" stroke="none" />
      <circle cx="25" cy="16" r="3.4" fill="none" strokeWidth={3} />
    </svg>
  );
}

interface LogoMarkProps {
  /** Lado de la placa en px. */
  size?: number;
  /** Radio u otras clases; por defecto rounded-md. */
  className?: string;
}

/** Placa coral con el glifo: el ícono de la app. */
export default function LogoMark({ size = 36, className = "rounded-md" }: LogoMarkProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center bg-logo-coral text-logo-night ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <LogoGlyph size={Math.round(size * 0.72)} />
    </span>
  );
}
