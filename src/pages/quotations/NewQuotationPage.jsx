import { useEffect } from 'react';
import { useQuotationStore } from '../../store/quotationStore';
import { QuotationWizard } from '../../features/quotations/QuotationWizard';
import { PageHeader } from '../../components/common/PageHeader';

export default function NewQuotationPage() {
  const resetNew = useQuotationStore((s) => s.resetNew);
  const hydrateFromDraft = useQuotationStore((s) => s.hydrateFromDraft);

  useEffect(() => {
    const hadDraft = hydrateFromDraft();
    if (!hadDraft) resetNew();
  }, [hydrateFromDraft, resetNew]);

  return (
    <div>
      <PageHeader eyebrow="Quotations" title="New quotation" description="Create and manage a professional construction estimate." />
      <QuotationWizard mode="create" />
    </div>
  );
}
