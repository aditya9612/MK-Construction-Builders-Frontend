import { Download, Eye, Printer } from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';
import { calculateQuotationTotals } from '../../utils/calculations';
import { Button } from '../common/Button';
import { storage } from '../../utils/storage/localStorage';
import { STORAGE_KEYS } from '../../constants';
import { formatDate } from '../../utils/formatting';

export function QuotationSummary({ quotation, onChange, onPreview, onDraft, onSave, onPdf, onPrint, sticky = true }) {
  const totals = calculateQuotationTotals(quotation);
  const draftMeta = storage.get(STORAGE_KEYS.wizardDraft, null);
  const rows = [
    ['Construction', totals.constructionTotal],
    ['Additional Works', totals.additionalWorkTotal],
    ['Electrical', totals.electricalTotal],
    ['Plumbing', totals.plumbingTotal],
    ['Doors & Windows', totals.doorsWindowsTotal],
    ['Tiles & Granite', totals.tilesGraniteTotal],
    ['Painting', totals.paintingTotal],
  ];

  return (
    <aside className={sticky ? 'rounded-[12px] border border-[#E1E8EF] bg-white p-5 shadow-card lg:sticky lg:top-24' : 'rounded-[12px] border border-[#E1E8EF] bg-white p-5 shadow-card'}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Estimate summary</p>
          <p className="mt-1 text-[13px] font-medium text-ink">Current quotation</p>
        </div>
        <span className="rounded-md bg-surface px-2 py-0.5 text-[11px] font-medium text-muted">{quotation.status || 'Draft'}</span>
      </div>
      {draftMeta?.savedAt ? <p className="mt-2 text-[11px] text-faint">Last saved {formatDate(draftMeta.savedAt)}</p> : null}
      <dl className="mt-5 space-y-2.5 text-[13px]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <dt className="text-muted">{label}</dt>
            <dd className="font-medium tabular-nums money text-ink">{formatCurrency(value)}</dd>
          </div>
        ))}
      </dl>
      <div className="my-4 h-px bg-line" />
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-muted">Subtotal</span>
        <span className="font-semibold tabular-nums money">{formatCurrency(totals.subtotal)}</span>
      </div>
      <label className="mt-3 flex items-center justify-between gap-3 text-[13px]">
        <span className="text-muted">Discount %</span>
        <input
          type="number"
          min="0"
          max="100"
          className="h-9 w-16 rounded-md border border-line px-2 text-right text-sm tabular-nums transition duration-ui focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
          value={quotation.discount ?? 0}
          onChange={(e) => onChange({ discount: Number(e.target.value) })}
        />
      </label>
      <p className="mt-1 text-right text-[11px] tabular-nums money text-faint">− {formatCurrency(totals.discountAmount)}</p>
      <label className="mt-3 flex items-center justify-between gap-3 text-[13px]">
        <span className="text-muted">GST %</span>
        <input
          type="number"
          min="0"
          max="100"
          className="h-9 w-16 rounded-md border border-line px-2 text-right text-sm tabular-nums transition duration-ui focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
          value={quotation.gst ?? 0}
          onChange={(e) => onChange({ gst: Number(e.target.value) })}
        />
      </label>
      <p className="mt-1 text-right text-[11px] tabular-nums money text-faint">+ {formatCurrency(totals.gstAmount)}</p>
      <div className="mt-4 rounded-[10px] border-l-[3px] border-brand bg-brand-pale px-3 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">Estimated project value</p>
        <p className="mt-1.5 text-[28px] font-semibold leading-none tracking-tight tabular-nums money text-brand-navy">{formatCurrency(totals.grandTotal)}</p>
        <p className="mt-2 text-[11px] text-faint">{Number(quotation.gst) > 0 ? 'Includes GST' : 'Excluding GST'}</p>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-2">
        <Button onClick={onSave}>Save quotation</Button>
        <Button variant="secondary" onClick={onDraft}>Save draft</Button>
        <Button variant="ghost" onClick={onPreview}><Eye className="h-4 w-4" /> Preview</Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onPdf}><Download className="h-4 w-4" /> PDF</Button>
          <Button variant="secondary" onClick={onPrint}><Printer className="h-4 w-4" /> Print</Button>
        </div>
      </div>
    </aside>
  );
}
