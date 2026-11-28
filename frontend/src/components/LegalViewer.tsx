import { useEffect, useRef } from "react";
import { LEGAL_DATE, LEGAL_DOCUMENTS, LEGAL_VERSION, type LegalDocumentId } from "../legal/documents";
import { registerBackHandler } from "../hooks/useNativeApp";
import { ScreenHeader } from "./shared";

/**
 * Lectura de un documento legal a pantalla completa, por encima de lo que haya (así no se pierde lo escrito en un
 * formulario). Se cierra con «Volver», «atrás» de Android o Escape. El texto va en el paquete: funciona sin conexión.
 */
export default function LegalViewer({ documentId, onClose }: { documentId: LegalDocumentId; onClose: () => void }) {
  const document_ = LEGAL_DOCUMENTS[documentId];
  const close = useRef(onClose);
  close.current = onClose;
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close.current(); };
    window.addEventListener("keydown", onKey);
    const removeBackHandler = registerBackHandler(() => { close.current(); return true; });
    return () => {
      window.removeEventListener("keydown", onKey);
      removeBackHandler();
      previous?.focus();
    };
  }, []);

  return (
    <div ref={dialog} role="dialog" aria-modal="true" aria-label={document_.title} tabIndex={-1} className="orbit-push fixed inset-0 z-[60] flex flex-col bg-paper pt-[env(safe-area-inset-top)] outline-none">
      <ScreenHeader title={document_.shortTitle} onBack={onClose} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <article className="mx-auto flex max-w-[640px] flex-col gap-5">
          <div>
            <h2 className="font-display text-[24px] font-semibold leading-tight text-ink">{document_.title}</h2>
            <p className="num mt-1 text-[13px] text-ink-3">Versión {LEGAL_VERSION} · {LEGAL_DATE}</p>
            <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{document_.intro}</p>
          </div>
          {document_.sections.map((section) => (
            <section key={section.heading} className="flex flex-col gap-2">
              <h3 className="font-display text-[20px] font-semibold leading-tight text-ink">{section.heading}</h3>
              {section.paragraphs?.map((text) => <p key={text} className="break-words text-[16px] leading-relaxed text-ink-2">{text}</p>)}
              {section.bullets && (
                <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[16px] leading-relaxed text-ink-2">
                  {section.bullets.map((text) => <li key={text}>{text}</li>)}
                </ul>
              )}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
