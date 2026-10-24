import { IconPencil, IconHabit, IconUser } from "./icons";
interface Props {
  name: string;
  onClose: () => void;
  onCreateTask: () => void;
  onConfigureProfile: () => void;
  onConfigureHabits: () => void;
}

export default function WelcomeOnboarding({ name, onClose, onCreateTask, onConfigureProfile, onConfigureHabits }: Props) {
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-night/55 p-4" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <section className="w-full max-w-[540px] overflow-hidden rounded-[24px] bg-card ">
        <div className="relative overflow-hidden bg-night px-6 pb-7 pt-6 text-white sm:px-8">
          <div className="absolute -right-12 -top-24 h-56 w-56 rounded-full border border-white/15" />
          <div className="absolute right-14 top-5 h-28 w-28 rounded-full border border-white/10" />
          <div className="relative flex items-start justify-between gap-5">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-coral text-[19px] font-bold">O</div>
              <h1 id="welcome-title" className="mt-5 text-[25px] font-bold leading-tight">Bienvenida a tu órbita, {name}</h1>
              <p className="mt-2 max-w-md text-[14px] leading-relaxed text-ink-3">No necesitas configurar todo ahora. Empieza por lo que te resulte útil y completa tu espacio cuando quieras.</p>
            </div>
            <button onClick={onClose} title="Continuar sin configurar" aria-label="Continuar sin configurar" className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white/10 text-white transition-colors hover:bg-white/20"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <p className="mb-3 font-display text-[20px] font-semibold text-ink">Elige por dónde comenzar</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <StartOption icon={<IconPencil size={20} />} color="var(--color-coral)" background="var(--color-coral-wash)" title="Primera tarea" description="Organiza lo próximo." onClick={onCreateTask} />
            <StartOption icon={<IconHabit size={20} />} color="var(--color-violet)" background="var(--color-violet-wash)" title="Mis hábitos" description="Crea una rutina." onClick={onConfigureHabits} />
            <StartOption icon={<IconUser size={20} />} color="var(--color-blue)" background="var(--color-blue-wash)" title="Mi perfil" description="Añade tu contexto." onClick={onConfigureProfile} />
          </div>
          <button onClick={onClose} className="mt-5 w-full py-2.5 text-[13px] font-bold text-ink-2 transition-colors hover:text-ink">Explorar MyOrbit por ahora</button>
        </div>
      </section>
    </div>
  );
}

function StartOption({ icon, color, background, title, description, onClick }: { icon: React.ReactNode; color: string; background: string; title: string; description: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-lg border border-line p-4 text-left transition-all hover:-translate-y-0.5 hover:border-line-strong hover:">
      <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ color, background }}>{icon}</div>
      <p className="mt-4 text-[14px] font-bold text-ink">{title}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{description}</p>
    </button>
  );
}