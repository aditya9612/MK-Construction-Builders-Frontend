import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quotationService } from '../../services/api/quotationService';
import { useQuotationStore } from '../../store/quotationStore';
import { QuotationWizard } from '../../features/quotations/QuotationWizard';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSkeleton, ErrorState } from '../../components/common/States';
import { ChevronLeft } from 'lucide-react';
import { extractErrorMessage } from '../../services/api/authService';

export default function EditQuotationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const loadQuotation = useQuotationStore((s) => s.loadQuotation);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    quotationService
      .getById(id)
      .then((row) => {
        if (!isMounted) return;
        if (!row) setError('Quotation not found.');
        else loadQuotation(row);
      })
      .catch((err) => {
        if (isMounted) setError(extractErrorMessage(err, 'Failed to load quotation for editing'));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, loadQuotation]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          type="button"
          onClick={() => navigate(`/quotations/${id}`)}
          className="inline-flex items-center gap-1 hover:text-slate-900 font-semibold cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to Quotation Detail</span>
        </button>
      </div>

      <PageHeader
        eyebrow="Commercial"
        title="Edit Quotation"
        description="Update structural items, site dimensions, rates, and terms. Recalculates dynamically."
      />
      <QuotationWizard mode="edit" quotationId={id} />
    </div>
  );
}
