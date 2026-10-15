import { useEffect, useState } from 'react';
import { Modal } from '../../components/modals/Modal';
import { Button } from '../../components/common/Button';
import { quotationService } from '../../services/api/quotationService';
import { formatCurrency, formatNumber, cn } from '../../utils/formatting';
import { Calculator, RefreshCw, Layers, DollarSign, Percent, ShieldCheck } from 'lucide-react';

export function QuotationSummaryModal({ open, onClose, quotationId, quotationNumber }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadSummary = async () => {
    if (!quotationId) return;
    setLoading(true);
    setError('');
    try {
      const data = await quotationService.getSummary(quotationId);
      setSummary(data);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load calculation summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && quotationId) {
      loadSummary();
    }
  }, [open, quotationId]);

  if (!open) return null;

  const itemCategories = [
    { label: 'Construction Work', key: 'construction_total', icon: Layers },
    { label: 'Additional Work', key: 'additional_total', icon: Layers },
    { label: 'Electrical Work', key: 'electrical_total', icon: Layers },
    { label: 'Plumbing Work', key: 'plumbing_total', icon: Layers },
    { label: 'Doors Work', key: 'door_total', icon: Layers },
    { label: 'Windows Work', key: 'window_total', icon: Layers },
    { label: 'Tiles Work', key: 'tile_total', icon: Layers },
    { label: 'Granite Work', key: 'granite_total', icon: Layers },
    { label: 'Painting Work', key: 'painting_total', icon: Layers },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0284c7] flex items-center justify-center border border-sky-100">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Quotation Calculation Summary</h3>
            <p className="text-xs text-slate-400 font-normal">
              Live backend summary for <span className="font-mono font-semibold text-slate-700">{quotationNumber || `#${quotationId}`}</span>
            </p>
          </div>
        </div>
      }
      className="max-w-2xl"
    >
      <div className="space-y-5">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#0284c7]" />
            <p className="text-xs font-medium">Fetching summary calculations from server...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
            <span>{error}</span>
            <Button size="sm" variant="secondary" onClick={loadSummary}>Retry</Button>
          </div>
        ) : summary ? (
          <>
            {/* Category Breakdown Cards */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Category Totals</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {itemCategories.map((cat) => (
                  <div key={cat.key} className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between">
                    <span className="text-slate-500 text-xs font-medium">{cat.label}</span>
                    <span className="text-sm font-bold text-slate-800 mt-1 tabular-nums">
                      {formatCurrency(summary[cat.key])}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subtotal & Deductions / Taxes */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Subtotal Amount</span>
                <span className="font-semibold text-slate-800 tabular-nums text-sm">{formatCurrency(summary.subtotal)}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1">
                  <span>Discount</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                    {formatNumber(summary.discount_percentage, 1)}%
                  </span>
                </span>
                <span className="font-semibold text-rose-600 tabular-nums">− {formatCurrency(summary.discount_amount)}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Taxable Amount</span>
                <span className="font-semibold text-slate-800 tabular-nums">{formatCurrency(summary.taxable_amount)}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1">
                  <span>Goods & Services Tax (GST)</span>
                  <span className="text-[10px] bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded font-mono">
                    {formatNumber(summary.gst_percentage, 1)}%
                  </span>
                </span>
                <span className="font-semibold text-emerald-600 tabular-nums">+ {formatCurrency(summary.gst_amount)}</span>
              </div>

              {/* Grand Total Banner */}
              <div className="mt-3 pt-3 flex justify-between items-center bg-gradient-to-r from-sky-50 to-indigo-50/50 p-3.5 rounded-xl border border-sky-100">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 block">Grand Total</span>
                  <span className="text-[10px] text-sky-600">Final estimated value</span>
                </div>
                <span className="text-xl font-extrabold text-[#0284c7] tabular-nums">
                  {formatCurrency(summary.grand_total)}
                </span>
              </div>
            </div>
          </>
        ) : null}

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={loadSummary}
            disabled={loading}
            className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            <span>Recalculate live</span>
          </button>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}
