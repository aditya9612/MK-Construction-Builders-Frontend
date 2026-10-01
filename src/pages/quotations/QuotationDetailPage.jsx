import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { quotationService, companyService } from '../../services/mock';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Card, SectionCard } from '../../components/cards/Card';
import { StatusBadge } from '../../components/common/Badge';
import { LoadingSkeleton, ErrorState } from '../../components/common/States';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { calculateQuotationTotals } from '../../utils/calculations';
import { QuotationDocument } from '../../components/quotation/QuotationDocument';
import { generateQuotationPdf } from '../../utils/pdf/generateQuotationPdf';
import { toast, useUiStore } from '../../store/uiStore';

export default function QuotationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState(null);
  const [company, setCompany] = useState(null);
  const [error, setError] = useState('');
  const openConfirm = useUiStore((s) => s.openConfirm);

  useEffect(() => {
    quotationService.getById(id).then((data) => {
      if (!data) setError('Quotation not found.');
      else setRow(data);
    });
    companyService.get().then(setCompany);
  }, [id]);

  if (!row && !error) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} />;

  const totals = calculateQuotationTotals(row);

  return (
    <div>
      <PageHeader
        title={row.quotationNumber}
        description={`${row.customer?.name} · ${row.project?.name} · ${formatDate(row.quotationDate)}`}
        actions={
          <>
            <StatusBadge status={row.status} />
            <Button onClick={() => navigate(`/quotations/${row.id}/edit`)}>Edit</Button>
            <Button
              variant="secondary"
              onClick={async () => {
                const copy = await quotationService.duplicate(row.id);
                toast('Quotation duplicated successfully');
                navigate(`/quotations/${copy.id}/edit`);
              }}
            >
              Duplicate
            </Button>
            <Button variant="ghost" onClick={() => window.print()}>Print</Button>
            <Button variant="ghost" onClick={() => generateQuotationPdf(document.getElementById('quotation-preview'), row.quotationNumber)}>Download</Button>
            <Button
              variant="danger"
              onClick={() =>
                openConfirm({
                  title: 'Delete quotation',
                  message: 'Are you sure you want to delete this quotation?',
                  confirmLabel: 'Delete',
                  danger: true,
                  onConfirm: async () => {
                    await quotationService.delete(row.id);
                    toast('Quotation deleted');
                    navigate('/quotations');
                  },
                })
              }
            >
              Delete
            </Button>
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">Customer</p>
          <p className="mt-2 font-semibold text-ink">{row.customer?.name}</p>
          <p className="text-sm text-muted">{row.customer?.mobile}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">Project</p>
          <p className="mt-2 font-semibold text-ink">{row.project?.name}</p>
          <p className="text-sm text-muted">{row.project?.siteAddress}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">Grand total</p>
          <p className="mt-2 text-[26px] font-semibold tabular-nums money text-brand-navy">{formatCurrency(totals.grandTotal)}</p>
        </Card>
      </div>
      <SectionCard className="mt-4" title="Quotation summary">
        <dl className="grid gap-2 sm:grid-cols-2 text-sm">
          {Object.entries({
            Construction: totals.constructionTotal,
            'Additional work': totals.additionalWorkTotal,
            Electrical: totals.electricalTotal,
            Plumbing: totals.plumbingTotal,
            'Doors & windows': totals.doorsWindowsTotal,
            'Tiles & granite': totals.tilesGraniteTotal,
            Painting: totals.paintingTotal,
            Subtotal: totals.subtotal,
            Discount: totals.discountAmount,
            GST: totals.gstAmount,
          }).map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-line py-1.5 text-[13px]">
              <dt className="text-muted">{k}</dt>
              <dd className="font-medium tabular-nums">{formatCurrency(v)}</dd>
            </div>
          ))}
        </dl>
      </SectionCard>
      <div id="quotation-print-root" className="mt-6 overflow-auto rounded-[12px] border border-line bg-surface p-6">
        <QuotationDocument quotation={row} company={company} />
      </div>
    </div>
  );
}
