import { LEGAL_DOCUMENTS, type LegalDocumentId } from "../legal/documents";

/** Los dos documentos como enlaces de 44 px; quien los usa decide cómo mostrarlos. */
export default function LegalLinks({ onRead }: { onRead: (id: LegalDocumentId) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4">
      {Object.values(LEGAL_DOCUMENTS).map((item) => (
        <button key={item.id} type="button" onClick={() => onRead(item.id)} className="min-h-[44px] px-1 text-[13px] font-semibold text-ink-2 underline underline-offset-4">
          {item.shortTitle}
        </button>
      ))}
    </div>
  );
}
