import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { quotationService } from '../../services/api/quotationService';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Card, SectionCard } from '../../components/cards/Card';
import { LoadingSkeleton, ErrorState } from '../../components/common/States';
import { formatCurrency, formatDate, cn } from '../../utils/formatting';
import { QuotationDocument } from '../../components/quotation/QuotationDocument';
import { QuotationSummaryModal } from '../../features/quotations/QuotationSummaryModal';
import { QuotationPreviewModal } from '../../features/quotations/QuotationPreviewModal';
import { generateQuotationPdf } from '../../utils/pdf/generateQuotationPdf';
import { getQuotationStatusBadge } from './QuotationsPage';
import { toast, useUiStore } from '../../store/uiStore';
import { extractErrorMessage } from '../../services/api/authService';
import {
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Pencil,
  Trash2,
  Printer,
  Download,
  Calculator,
  FileText,
  User,
  Building2,
  MapPin,
  RefreshCw,
  Phone,
  Mail,
  ChevronLeft,
} from 'lucide-react';

export default function QuotationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const openConfirm = useUiStore((s) => s.openConfirm);

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Load quotation data from API #3: GET /api/v1/quotations/:id
  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await quotationService.getById(id);
      if (!data) {
        setError('Quotation not found.');
      } else {
        setQuotation(data);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to fetch quotation details'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lifecycle action handlers
  const handleSend = () => {
    openConfirm({
      title: 'Send Quotation',
      message: `Send quotation "${quotation.quotation_number || quotation.quotationNumber}" to customer? This updates status to SENT.`,
      confirmLabel: 'Send Quotation',
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await quotationService.send(quotation.id);
          toast('Quotation marked as Sent!', 'success');
          loadData();
        } catch (err) {
          toast(extractErrorMessage(err, 'Failed to send quotation'), 'error');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleApprove = () => {
    openConfirm({
      title: 'Approve Quotation',
      message: `Approve quotation "${quotation.quotation_number || quotation.quotationNumber}"? This confirms client agreement.`,
      confirmLabel: 'Approve Quotation',
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await quotationService.approve(quotation.id);
          toast('Quotation approved successfully!', 'success');
          loadData();
        } catch (err) {
          toast(extractErrorMessage(err, 'Failed to approve quotation'), 'error');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleReject = () => {
    openConfirm({
      title: 'Reject Quotation',
      message: `Mark quotation "${quotation.quotation_number || quotation.quotationNumber}" as Rejected?`,
      confirmLabel: 'Reject Quotation',
      danger: true,
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await quotationService.reject(quotation.id);
          toast('Quotation rejected', 'info');
          loadData();
        } catch (err) {
          toast(extractErrorMessage(err, 'Failed to reject quotation'), 'error');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleExpire = () => {
    openConfirm({
      title: 'Expire Quotation',
      message: `Mark quotation "${quotation.quotation_number || quotation.quotationNumber}" as Expired?`,
      confirmLabel: 'Mark Expired',
      danger: true,
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await quotationService.expire(quotation.id);
          toast('Quotation marked as Expired', 'info');
          loadData();
        } catch (err) {
          toast(extractErrorMessage(err, 'Failed to expire quotation'), 'error');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleDuplicate = async () => {
    try {
      setActionLoading(true);
      const copy = await quotationService.duplicate(quotation.id);
      toast('Quotation duplicated successfully!', 'success');
      navigate(`/quotations/${copy.id}/edit`);
    } catch (err) {
      toast(extractErrorMessage(err, 'Failed to duplicate quotation'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = () => {
    openConfirm({
      title: 'Delete Quotation',
      message: `Are you sure you want to permanently delete quotation "${quotation.quotation_number || quotation.quotationNumber}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await quotationService.delete(quotation.id);
          toast('Quotation deleted successfully', 'success');
          navigate('/quotations');
        } catch (err) {
          toast(extractErrorMessage(err, 'Failed to delete quotation'), 'error');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  if (loading && !quotation) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Commercial" title="Loading Quotation..." />
        <LoadingSkeleton />
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Commercial" title="Quotation Not Found" />
        <ErrorState message={error || 'Quotation not found'} onRetry={loadData} />
      </div>
    );
  }

  const qNum = quotation.quotation_number || quotation.quotationNumber;
  const status = (quotation.status || '').toUpperCase();
  const summary = quotation.calculation_summary || quotation.calculationSummary || {};

  return (
    <div className="space-y-6">
      {/* Back button and Header */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
        <button
          type="button"
          onClick={() => navigate('/quotations')}
          className="inline-flex items-center gap-1 hover:text-slate-900 font-semibold cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to All Quotations</span>
        </button>
      </div>

      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <span>{qNum}</span>
            {getQuotationStatusBadge(quotation.status)}
          </div>
        }
        description={`${quotation.customer?.name || 'Customer'} · ${quotation.project?.name || 'Site'} · Date: ${formatDate(quotation.quotation_date || quotation.quotationDate)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Action 1: Send (if not sent or approved) */}
            {status !== 'SENT' && status !== 'APPROVED' && (
              <Button
                variant="secondary"
                disabled={actionLoading}
                onClick={handleSend}
                className="text-sky-700 bg-sky-50 hover:bg-sky-100 border-sky-200"
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                <span>Send</span>
              </Button>
            )}

            {/* Action 2: Approve (if not already approved) */}
            {status !== 'APPROVED' && (
              <Button
                variant="secondary"
                disabled={actionLoading}
                onClick={handleApprove}
                className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                <span>Approve</span>
              </Button>
            )}

            {/* Action 3: Reject (if not rejected) */}
            {status !== 'REJECTED' && (
              <Button
                variant="secondary"
                disabled={actionLoading}
                onClick={handleReject}
                className="text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                <span>Reject</span>
              </Button>
            )}

            {/* Action 4: Expire (if not expired) */}
            {status !== 'EXPIRED' && (
              <Button
                variant="secondary"
                disabled={actionLoading}
                onClick={handleExpire}
                className="text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200"
              >
                <Clock className="w-3.5 h-3.5 mr-1" />
                <span>Expire</span>
              </Button>
            )}

            {/* Action 5: Live Summary Modal Button */}
            <Button
              variant="secondary"
              onClick={() => setSummaryOpen(true)}
              className="text-slate-700 bg-white hover:bg-slate-50 border-slate-200"
            >
              <Calculator className="w-3.5 h-3.5 mr-1 text-[#0284c7]" />
              <span>Summary</span>
            </Button>

            {/* Action 6: Backend Preview Modal Button */}
            <Button
              variant="secondary"
              onClick={() => setPreviewOpen(true)}
              className="text-slate-700 bg-white hover:bg-slate-50 border-slate-200"
            >
              <FileText className="w-3.5 h-3.5 mr-1 text-indigo-600" />
              <span>Preview</span>
            </Button>

            {/* Action 7: Duplicate */}
            <Button
              variant="secondary"
              disabled={actionLoading}
              onClick={handleDuplicate}
            >
              <Copy className="w-3.5 h-3.5 mr-1" />
              <span>Duplicate</span>
            </Button>

            {/* Action 8: Edit */}
            <Button
              onClick={() => navigate(`/quotations/${quotation.id}/edit`)}
              className="bg-[#0284c7] hover:bg-[#0369a1] text-white"
            >
              <Pencil className="w-3.5 h-3.5 mr-1" />
              <span>Edit</span>
            </Button>

            {/* Action 9: Print & Download */}
            <Button variant="ghost" onClick={() => window.print()} title="Print document">
              <Printer className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => generateQuotationPdf(document.getElementById('quotation-preview'), qNum)}
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </Button>

            {/* Action 10: Delete */}
            <Button
              variant="danger"
              disabled={actionLoading}
              onClick={handleDelete}
              title="Delete Quotation"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        }
      />

      {/* Highlights Bar */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Customer Card */}
        <Card className="p-4 border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-2 text-slate-400 mb-1.5">
            <User className="w-4 h-4 text-[#0284c7]" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Customer</p>
          </div>
          <p className="font-bold text-slate-900 text-base">{quotation.customer?.name || 'Unnamed Client'}</p>
          <div className="mt-1 space-y-0.5 text-xs text-slate-600">
            {quotation.customer?.mobile && (
              <p className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{quotation.customer.mobile}</span>
              </p>
            )}
            {quotation.customer?.email && (
              <p className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-slate-400" />
                <span>{quotation.customer.email}</span>
              </p>
            )}
            <p className="text-[11px] text-slate-400">Type: {quotation.customer?.customer_type || quotation.customer?.type || 'INDIVIDUAL'}</p>
          </div>
        </Card>

        {/* Project Card */}
        <Card className="p-4 border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-2 text-slate-400 mb-1.5">
            <Building2 className="w-4 h-4 text-[#0284c7]" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Project / Site</p>
          </div>
          <p className="font-bold text-slate-900 text-base">{quotation.project?.project_name || quotation.project?.name || 'Site'}</p>
          <div className="mt-1 space-y-0.5 text-xs text-slate-600">
            <p className="flex items-start gap-1.5">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
              <span>{quotation.project?.site_address || quotation.project?.siteAddress || 'No address registered'}</span>
            </p>
            <p className="text-[11px] text-slate-400">
              Built-up: {Number(quotation.project?.construction_area ?? quotation.project?.constructionArea ?? 0).toLocaleString('en-IN')} sqft · Floors: {quotation.project?.floor_type || quotation.project?.floors || 'G+1'}
            </p>
          </div>
        </Card>

        {/* Grand Total Card */}
        <Card className="p-4 border-slate-200/90 bg-gradient-to-br from-white via-sky-50/30 to-indigo-50/40 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-800">Estimated Project Total</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900">
              {formatCurrency(quotation.grand_total ?? quotation.grandTotal)}
            </p>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60">
            <span>GST ({Number(quotation.gst_percentage ?? quotation.gst ?? 18)}%): {formatCurrency(quotation.gst_amount ?? quotation.gstAmount)}</span>
            <span className="font-medium text-emerald-600">
              Subtotal: {formatCurrency(quotation.subtotal)}
            </span>
          </div>
        </Card>
      </div>

      {/* Pricing Breakdown Breakdown Grid */}
      <SectionCard
        title="Quotation Summary Breakdown"
        description="Calculation summary from backend API / calculation engine."
        action={
          <Button size="sm" variant="secondary" onClick={() => setSummaryOpen(true)}>
            <Calculator className="w-3.5 h-3.5 mr-1 text-[#0284c7]" />
            <span>Open API Summary</span>
          </Button>
        }
      >
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2 text-xs">
          {[
            ['Construction Work', summary.construction_total ?? quotation.calculation_summary?.construction_total],
            ['Additional Work', summary.additional_total ?? quotation.calculation_summary?.additional_total],
            ['Electrical Work', summary.electrical_total ?? quotation.calculation_summary?.electrical_total],
            ['Plumbing Work', summary.plumbing_total ?? quotation.calculation_summary?.plumbing_total],
            ['Doors Total', summary.door_total ?? quotation.calculation_summary?.door_total],
            ['Windows Total', summary.window_total ?? quotation.calculation_summary?.window_total],
            ['Tiles Total', summary.tile_total ?? quotation.calculation_summary?.tile_total],
            ['Granite Total', summary.granite_total ?? quotation.calculation_summary?.granite_total],
            ['Painting Total', summary.painting_total ?? quotation.calculation_summary?.painting_total],
            ['Subtotal', quotation.subtotal],
            [`Discount (${quotation.discount_percentage ?? 0}%)`, quotation.discount_amount ?? quotation.discountAmount],
            [`GST (${quotation.gst_percentage ?? 18}%)`, quotation.gst_amount ?? quotation.gstAmount],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-slate-100 py-2">
              <dt className="text-slate-500 font-medium">{k}</dt>
              <dd className="font-semibold text-slate-800 tabular-nums">{formatCurrency(v)}</dd>
            </div>
          ))}
        </dl>
      </SectionCard>

      {/* Official Printable Quotation Document */}
      <div id="quotation-print-root" className="mt-6 overflow-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <QuotationDocument quotation={quotation} />
      </div>

      {/* Summary Modal (API #11) */}
      <QuotationSummaryModal
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        quotationId={quotation.id}
        quotationNumber={qNum}
      />

      {/* Preview Modal (API #12) */}
      <QuotationPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        quotation={quotation}
        quotationId={quotation.id}
      />
    </div>
  );
}
