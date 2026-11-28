import { useState } from "react";
import LegalViewer from "../components/LegalViewer";
import { ScreenHeader, SummaryList, SummaryRow } from "../components/shared";
import { LEGAL_DATE, LEGAL_DOCUMENTS, LEGAL_VERSION, type LegalDocumentId } from "../legal/documents";

export default function LegalScreen({ onBack }: { onBack: () => void }) {
  const [reading, setReading] = useState<LegalDocumentId | null>(null);

  return (
    <div className="flex h-full flex-col bg-paper">
      <ScreenHeader title="Términos y privacidad" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-8">
        <SummaryList label="Documentos legales">
          {Object.values(LEGAL_DOCUMENTS).map((item) => <SummaryRow key={item.id} title={item.shortTitle} onClick={() => setReading(item.id)} />)}
        </SummaryList>
        <p className="num mt-3 text-[13px] text-ink-3">Versión {LEGAL_VERSION} · {LEGAL_DATE}</p>
      </div>
      {reading && <LegalViewer documentId={reading} onClose={() => setReading(null)} />}
    </div>
  );
}
