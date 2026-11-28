import { useState } from "react";
import ConsentFields, { missingConsent } from "../components/ConsentFields";
import DeleteAccountSheet from "../components/DeleteAccountSheet";
import LegalViewer from "../components/LegalViewer";
import LogoMark from "../components/Logo";
import type { LegalDocumentId } from "../legal/documents";
import { acceptTerms, type AgeDeclaration, type AuthSession } from "../services/authApi";

interface Props {
  onAccepted: (session: AuthSession) => void;
  onLogout: () => void;
  onAccountDeleted: () => void;
}

/** Cuentas sin autorización vigente: se pide una vez antes de usar la app. Se puede salir o eliminar la cuenta. */
export default function ConsentScreen({ onAccepted, onLogout, onAccountDeleted }: Props) {
  const [age, setAge] = useState<AgeDeclaration | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [reading, setReading] = useState<LegalDocumentId | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const missing = missingConsent(age, accepted);
    if (missing || !age) {
      setError(missing);
      return;
    }
    try {
      setSaving(true);
      setError(null);
      onAccepted(await acceptTerms(age));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar tu autorización");
      setSaving(false);
    }
  }

  return (
    <div className="relative h-dvh bg-paper">
      <main className="h-full overflow-y-auto px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col">
          <LogoMark size={44} className="rounded-md" />
          <h1 className="mt-5 font-display text-[32px] font-semibold leading-none text-ink">Antes de continuar</h1>
          <p className="mt-2 mb-5 text-[14px] leading-relaxed text-ink-2">Necesitamos tu autorización para guardar y usar tus datos en MyOrbit. Lee los documentos y responde.</p>
          <ConsentFields age={age} onAge={(value) => { setAge(value); setError(null); }} accepted={accepted} onAccepted={(value) => { setAccepted(value); setError(null); }} onRead={setReading} />
          {error && <p role="alert" className="mt-3 text-[14px] font-semibold text-danger">{error}</p>}
          <button type="submit" disabled={saving} className="mt-4 min-h-[48px] w-full rounded-md bg-coral text-[14px] font-bold text-night transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50">
            {saving ? "Guardando..." : "Aceptar y continuar"}
          </button>
          <button type="button" onClick={onLogout} className="mt-3 min-h-[44px] w-full rounded-md bg-wash text-[14px] font-bold text-ink-2">Cerrar sesión</button>
          <button type="button" onClick={() => setDeleteOpen(true)} className="mt-2 min-h-[44px] self-center px-3 text-[14px] font-semibold text-danger">Eliminar mi cuenta</button>
        </form>
      </main>
      <DeleteAccountSheet open={deleteOpen} onClose={() => setDeleteOpen(false)} onDeleted={onAccountDeleted} />
      {reading && <LegalViewer documentId={reading} onClose={() => setReading(null)} />}
    </div>
  );
}
