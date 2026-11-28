import type { LegalDocumentId } from "../legal/documents";
import type { AgeDeclaration } from "../services/authApi";
import LegalLinks from "./LegalLinks";
import { ChoiceChip } from "./shared";

const AGE_OPTIONS: { value: AgeDeclaration; label: string }[] = [
  { value: "ADULT", label: "Soy mayor de edad" },
  { value: "MINOR_AUTHORIZED", label: "Soy menor y mi representante legal autoriza" },
];

/** Qué falta para poder autorizar, en palabras; null si está completo. */
export function missingConsent(age: AgeDeclaration | null, accepted: boolean): string | null {
  if (!age) return "Indica si eres mayor de edad o tienes autorización.";
  if (!accepted) return "Marca la casilla para aceptar los términos y autorizar tus datos.";
  return null;
}

interface Props {
  age: AgeDeclaration | null;
  onAge: (value: AgeDeclaration) => void;
  accepted: boolean;
  onAccepted: (value: boolean) => void;
  onRead: (id: LegalDocumentId) => void;
}

/** Declaración de edad y autorización. Nada viene preseleccionado: las dos respuestas las da la persona. */
export default function ConsentFields({ age, onAge, accepted, onAccepted, onRead }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="Tu edad" className="flex flex-col gap-2">
        {AGE_OPTIONS.map((option) => (
          <ChoiceChip key={option.value} selected={age === option.value} onClick={() => onAge(option.value)} className="w-full justify-start py-2 text-left">
            {option.label}
          </ChoiceChip>
        ))}
      </div>
      <div>
        <label className="flex min-h-[44px] cursor-pointer items-start gap-3 py-2">
          <input type="checkbox" checked={accepted} onChange={(event) => onAccepted(event.target.checked)} className="mt-0.5 h-5 w-5 flex-shrink-0 accent-coral" />
          <span className="text-[14px] leading-snug text-ink">Acepto los términos y condiciones y autorizo el tratamiento de mis datos personales.</span>
        </label>
        <LegalLinks onRead={onRead} />
      </div>
    </div>
  );
}
