import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { quotationService } from '../../services/mock';
import { useQuotationStore } from '../../store/quotationStore';
import { QuotationWizard } from '../../features/quotations/QuotationWizard';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSkeleton, ErrorState } from '../../components/common/States';

export default function EditQuotationPage() {
  const { id } = useParams();
  const loadQuotation = useQuotationStore((s) => s.loadQuotation);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    quotationService.getById(id).then((row) => {
      if (!row) setError('Quotation not found.');
      else loadQuotation(row);
    }).finally(() => setLoading(false));
  }, [id, loadQuotation]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <PageHeader eyebrow="Quotations" title="Edit quotation" description="Update items, rates and terms. Totals recalculate instantly." />
      <QuotationWizard mode="edit" />
    </div>
  );
}
