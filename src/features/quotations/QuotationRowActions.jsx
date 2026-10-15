import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  Pencil,
  Copy,
  Printer,
  Download,
  Trash2,
  MoreHorizontal,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Calculator,
  FileText,
} from 'lucide-react';
import { quotationService } from '../../services/api/quotationService';
import { toast, useUiStore } from '../../store/uiStore';
import { QuotationSummaryModal } from './QuotationSummaryModal';
import { QuotationPreviewModal } from './QuotationPreviewModal';
import { extractErrorMessage } from '../../services/api/authService';

export function QuotationRowActions({ row, onChanged }) {
  const navigate = useNavigate();
  const openConfirm = useUiStore((s) => s.openConfirm);

  const [menuOpen, setMenuOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  // 6. Duplicate quotation: POST /api/v1/quotations/:id/duplicate
  const handleDuplicate = async () => {
    setMenuOpen(false);
    try {
      setLoadingAction(true);
      const copy = await quotationService.duplicate(row.id);
      toast('Quotation duplicated successfully!', 'success');
      onChanged?.();
      navigate(`/quotations/${copy.id}/edit`);
    } catch (err) {
      toast(extractErrorMessage(err, 'Failed to duplicate quotation'), 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // 7. Send quotation: POST /api/v1/quotations/:id/send
  const handleSend = () => {
    setMenuOpen(false);
    openConfirm({
      title: 'Send Quotation',
      message: `Send quotation "${row.quotation_number || row.quotationNumber}" to customer? This updates status to SENT.`,
      confirmLabel: 'Send Quotation',
      onConfirm: async () => {
        try {
          await quotationService.send(row.id);
          toast('Quotation marked as Sent!', 'success');
          onChanged?.();
        } catch (err) {
          toast(extractErrorMessage(err, 'Failed to send quotation'), 'error');
        }
      },
    });
  };

  // 8. Approve quotation: POST /api/v1/quotations/:id/approve
  const handleApprove = () => {
    setMenuOpen(false);
    openConfirm({
      title: 'Approve Quotation',
      message: `Approve quotation "${row.quotation_number || row.quotationNumber}"? This confirms client acceptance.`,
      confirmLabel: 'Approve Quotation',
      onConfirm: async () => {
        try {
          await quotationService.approve(row.id);
          toast('Quotation approved successfully!', 'success');
          onChanged?.();
        } catch (err) {
          toast(extractErrorMessage(err, 'Failed to approve quotation'), 'error');
        }
      },
    });
  };

  // 9. Reject quotation: POST /api/v1/quotations/:id/reject
  const handleReject = () => {
    setMenuOpen(false);
    openConfirm({
      title: 'Reject Quotation',
      message: `Reject quotation "${row.quotation_number || row.quotationNumber}"?`,
      confirmLabel: 'Reject Quotation',
      danger: true,
      onConfirm: async () => {
        try {
          await quotationService.reject(row.id);
          toast('Quotation rejected', 'info');
          onChanged?.();
        } catch (err) {
          toast(extractErrorMessage(err, 'Failed to reject quotation'), 'error');
        }
      },
    });
  };

  // 10. Expire quotation: POST /api/v1/quotations/:id/expire
  const handleExpire = () => {
    setMenuOpen(false);
    openConfirm({
      title: 'Expire Quotation',
      message: `Mark quotation "${row.quotation_number || row.quotationNumber}" as Expired?`,
      confirmLabel: 'Mark Expired',
      danger: true,
      onConfirm: async () => {
        try {
          await quotationService.expire(row.id);
          toast('Quotation marked as Expired', 'info');
          onChanged?.();
        } catch (err) {
          toast(extractErrorMessage(err, 'Failed to expire quotation'), 'error');
        }
      },
    });
  };

  // 5. Delete quotation: DELETE /api/v1/quotations/:id
  const handleDelete = () => {
    setMenuOpen(false);
    openConfirm({
      title: 'Delete Quotation',
      message: `Are you sure you want to permanently delete quotation "${row.quotation_number || row.quotationNumber}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          await quotationService.delete(row.id);
          toast('Quotation deleted successfully', 'success');
          onChanged?.();
        } catch (err) {
          toast(extractErrorMessage(err, 'Failed to delete quotation'), 'error');
        }
      },
    });
  };

  const status = (row.status || '').toUpperCase();

  return (
    <div className="relative flex items-center justify-end gap-1">
      {/* 1. Quick View Details button */}
      <button
        type="button"
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700 border border-sky-100 transition-all cursor-pointer"
        onClick={() => navigate(`/quotations/${row.id}`)}
        aria-label="View Details"
        title="View Quotation Details"
      >
        <Eye className="h-3.5 w-3.5" />
      </button>

      {/* 2. Quick Edit button */}
      <button
        type="button"
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 border border-amber-100 transition-all cursor-pointer"
        onClick={() => navigate(`/quotations/${row.id}/edit`)}
        aria-label="Edit Quotation"
        title="Edit Quotation"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>

      {/* 3. Quick Calculation Summary modal button */}
      <button
        type="button"
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-100 transition-all cursor-pointer"
        onClick={() => setSummaryOpen(true)}
        aria-label="Calculation Summary"
        title="Quotation Calculation Summary (API)"
      >
        <Calculator className="h-3.5 w-3.5" />
      </button>

      {/* 4. Quick Preview modal button */}
      <button
        type="button"
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 border border-indigo-100 transition-all cursor-pointer"
        onClick={() => setPreviewOpen(true)}
        aria-label="Preview Document"
        title="Live Preview Document (API)"
      >
        <FileText className="h-3.5 w-3.5" />
      </button>

      {/* 5. More Actions Dropdown Trigger */}
      <button
        type="button"
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200 transition-all cursor-pointer"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="More lifecycle actions"
        title="Quotation Lifecycle Actions"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>

      {/* Dropdown Menu */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-8 z-30 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-fade-in text-xs">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Lifecycle Actions
            </div>

            {status !== 'SENT' && status !== 'APPROVED' && (
              <MenuItem
                icon={Send}
                label="Send Quotation"
                onClick={handleSend}
                colorClass="text-sky-700 hover:bg-sky-50"
              />
            )}

            {status !== 'APPROVED' && (
              <MenuItem
                icon={CheckCircle2}
                label="Approve Quotation"
                onClick={handleApprove}
                colorClass="text-emerald-700 hover:bg-emerald-50"
              />
            )}

            {status !== 'REJECTED' && (
              <MenuItem
                icon={XCircle}
                label="Reject Quotation"
                onClick={handleReject}
                colorClass="text-rose-700 hover:bg-rose-50"
              />
            )}

            {status !== 'EXPIRED' && (
              <MenuItem
                icon={Clock}
                label="Mark as Expired"
                onClick={handleExpire}
                colorClass="text-slate-700 hover:bg-slate-100"
              />
            )}

            <div className="my-1 border-t border-slate-100" />
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Manage & Export
            </div>

            <MenuItem
              icon={Copy}
              label="Duplicate (Copy)"
              onClick={handleDuplicate}
            />

            <MenuItem
              icon={Calculator}
              label="View Summary"
              onClick={() => {
                setMenuOpen(false);
                setSummaryOpen(true);
              }}
            />

            <MenuItem
              icon={FileText}
              label="Document Preview"
              onClick={() => {
                setMenuOpen(false);
                setPreviewOpen(true);
              }}
            />

            <div className="my-1 border-t border-slate-100" />

            <MenuItem
              icon={Trash2}
              label="Delete Quotation"
              onClick={handleDelete}
              danger
            />
          </div>
        </>
      )}

      {/* Summary Modal (GET /api/v1/quotations/:id/summary) */}
      <QuotationSummaryModal
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        quotationId={row.id}
        quotationNumber={row.quotation_number || row.quotationNumber}
      />

      {/* Preview Modal (GET /api/v1/quotations/:id/preview) */}
      <QuotationPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        quotation={row}
        quotationId={row.id}
      />
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger, colorClass }) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12px] font-medium transition cursor-pointer ${
        danger
          ? 'text-rose-600 hover:bg-rose-50'
          : colorClass || 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
      }`}
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
    </button>
  );
}
