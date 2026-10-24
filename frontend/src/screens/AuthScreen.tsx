import { useState } from "react";
import { login, register, type AuthSession } from "../services/authApi";

interface Props {
  onAuthenticated: (session: AuthSession, isNewAccount: boolean) => void;
}

export default function AuthScreen({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    try {
      setSaving(true);
      setError(null);
      const session = mode === "login"
        ? await login(email, password)
        : await register(name, email, password);
      onAuthenticated(session, mode === "register");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible acceder a tu cuenta");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-dvh grid lg:grid-cols-[1.15fr_0.85fr] bg-paper">
      <section className="hidden lg:flex relative overflow-hidden bg-night p-12 items-end">
        <div className="absolute -top-28 -right-20 w-[440px] h-[440px] rounded-full border border-white/15" />
        <div className="absolute top-16 right-24 w-[280px] h-[280px] rounded-full border border-white/10" />
        <div className="relative max-w-lg">
          <div className="w-12 h-12 rounded-lg bg-coral flex items-center justify-center text-night"><svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><circle cx="7" cy="16" r="3.2" /><circle cx="25" cy="16" r="3.2" /><path d="M10.2 16h11.6" /></svg></div>
          <h1 className="mt-8 font-display text-[56px] leading-none font-semibold text-white">MyOrbit</h1>
          <p className="mt-3 text-[18px] leading-relaxed text-ink-3">Tu espacio personal para organizar lo importante y avanzar a tu ritmo.</p>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <div className="lg:hidden mb-10">
            <div className="w-11 h-11 rounded-lg bg-coral flex items-center justify-center text-night"><svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><circle cx="7" cy="16" r="3.2" /><circle cx="25" cy="16" r="3.2" /><path d="M10.2 16h11.6" /></svg></div>
            <p className="mt-4 text-[28px] font-bold text-ink">MyOrbit</p>
          </div>
          <p className="font-display text-[34px] font-semibold leading-none text-ink">{mode === "login" ? "Bienvenida de nuevo" : "Crea tu espacio"}</p>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{mode === "login" ? "Ingresa para continuar con tu organización." : "Tu cuenta separa tus tareas y configuración personal."}</p>

          <div className="mt-7 flex rounded-md bg-line p-1">
            {(["login", "register"] as const).map((item) => (
              <button key={item} type="button" onClick={() => { setMode(item); setError(null); }} className="flex-1 rounded-lg py-2 text-[13px] font-bold" style={{ background: mode === item ? "white" : "transparent", color: mode === item ? "var(--color-ink)" : "var(--color-ink-2)" }}>
                {item === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {mode === "register" && <Field label="Nombre" value={name} onChange={setName} placeholder="Tu nombre" autoComplete="name" />}
            <Field label="Correo electrónico" value={email} onChange={setEmail} placeholder="tu@correo.com" type="email" autoComplete="email" />
            <Field label="Contraseña" value={password} onChange={setPassword} placeholder="Mínimo 8 caracteres" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </div>

          {error && <p className="mt-4 text-[13px] font-semibold text-danger">{error}</p>}
          <button disabled={saving} className="mt-6 w-full rounded-md py-3.5 text-[14px] font-bold text-white disabled:opacity-50" style={{ background: "var(--color-coral)" }}>
            {saving ? "Procesando..." : mode === "login" ? "Entrar a MyOrbit" : "Crear mi cuenta"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", autoComplete }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; autoComplete: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-bold text-ink">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} autoComplete={autoComplete} required className="rounded-md border border-line-strong bg-card px-3.5 py-3 text-[14px] text-ink outline-none focus:border-coral" />
    </label>
  );
}