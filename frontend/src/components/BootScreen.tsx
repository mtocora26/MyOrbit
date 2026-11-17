import OrbitLoader from "./OrbitLoader";

interface Props {
  /** Cubre la app ya montada (volver del segundo plano) en vez de ocupar el lugar de la pantalla. */
  overlay?: boolean;
  label?: string;
}

/**
 * Pantalla de arranque: toma el relevo del splash nativo (mismo fondo, logo de 120 px centrado) y sigue la
 * animación mientras se confirma la sesión. Solo se muestra mientras hay una espera real.
 */
export default function BootScreen({ overlay = false, label = "Abriendo MyOrbit" }: Props) {
  return (
    <div role="status" aria-label={label} className={`${overlay ? "fixed inset-0 z-[60]" : "h-dvh"} flex items-center justify-center bg-paper`}>
      <OrbitLoader size={120} />
    </div>
  );
}
