import { useTheme } from "../hooks/useTheme";
import { IconMoon, IconSun } from "./icons";

/** Alterna entre tema claro y oscuro. Recuerda la elección; sin ella sigue al sistema. */
export default function ThemeToggle({ className = "", withLabel = false }: { className?: string; withLabel?: boolean }) {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={dark ? "Modo claro" : "Modo oscuro"}
      className={`flex min-h-[44px] min-w-[44px] items-center justify-center gap-3 rounded-md text-ink-2 transition-colors duration-150 hover:bg-wash hover:text-ink ${className}`}
    >
      {dark ? <IconSun size={20} /> : <IconMoon size={20} />}
      {withLabel && <span className="text-[15px] font-semibold">{dark ? "Modo claro" : "Modo oscuro"}</span>}
    </button>
  );
}
