interface Props {
  name: string;
  onClose: () => void;
  onCreateTask: () => void;
  onConfigureProfile: () => void;
  onConfigureHabits: () => void;
}

export default function WelcomeOnboarding({ name, onClose, onCreateTask, onConfigureProfile, onConfigureHabits }: Props) {
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-[#101828]/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <section className="w-full max-w-[540px] overflow-hidden rounded-[24px] bg-white shadow-2xl">
        <div className="relative overflow-hidden bg-[#101828] px-6 pb-7 pt-6 text-white sm:px-8">
          <div className="absolute -right-12 -top-24 h-56 w-56 rounded-full border border-white/15" />
          <div className="absolute right-14 top-5 h-28 w-28 rounded-full border border-white/10" />
          <div className="relative flex items-start justify-between gap-5">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF6B4A] text-[19px] font-extrabold">O</div>
              <h1 id="welcome-title" className="mt-5 text-[25px] font-extrabold leading-tight">Bienvenida a tu órbita, {name}</h1>
              <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[#CBD5E1]">No necesitas configurar todo ahora. Empieza por lo que te resulte útil y completa tu espacio cuando quieras.</p>
            </div>
            <button onClick={onClose} title="Continuar sin configurar" className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-[22px] leading-none text-white transition-colors hover:bg-white/20">×</button>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <p className="mb-3 text-[12px] font-extrabold uppercase tracking-wide text-[#98A2B3]">Elige por dónde comenzar</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <StartOption icon="✓" color="#FF6B4A" background="#FFF0EC" title="Primera tarea" description="Organiza lo próximo." onClick={onCreateTask} />
            <StartOption icon="◎" color="#7A5AF8" background="#F4F3FF" title="Mis hábitos" description="Crea una rutina." onClick={onConfigureHabits} />
            <StartOption icon="◒" color="#2E90FA" background="#EFF8FF" title="Mi perfil" description="Añade tu contexto." onClick={onConfigureProfile} />
          </div>
          <button onClick={onClose} className="mt-5 w-full py-2.5 text-[13px] font-bold text-[#667085] transition-colors hover:text-[#172033]">Explorar MyOrbit por ahora</button>
        </div>
      </section>
    </div>
  );
}

function StartOption({ icon, color, background, title, description, onClick }: { icon: string; color: string; background: string; title: string; description: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-2xl border border-[#EAECF0] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#D0D5DD] hover:shadow-md">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl text-[19px] font-extrabold" style={{ color, background }}>{icon}</div>
      <p className="mt-4 text-[14px] font-extrabold text-[#172033]">{title}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-[#667085]">{description}</p>
    </button>
  );
}