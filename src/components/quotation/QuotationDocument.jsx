import { formatCurrency, formatDate } from '../../utils/formatting';
import { calculateQuotationTotals } from '../../utils/calculations';
import { BrandLogo } from '../common/BrandLogo';

function SectionTable({ title, items, extraCols }) {
  const visible = (items || []).filter((i) => Number(i.quantity) > 0 || Number(i.amount) > 0);
  if (!visible.length) return null;
  return (
    <section className="print-break mb-6">
      <h3 className="mb-2 border-b border-[#0B1F3A] pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0B1F3A]">{title}</h3>
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500">
            <th className="border-b border-slate-200 py-1.5 pr-2">#</th>
            <th className="border-b border-slate-200 py-1.5 pr-2">Description</th>
            <th className="border-b border-slate-200 py-1.5 pr-2 text-right">Qty</th>
            <th className="border-b border-slate-200 py-1.5 pr-2">Unit</th>
            <th className="border-b border-slate-200 py-1.5 pr-2 text-right">Rate</th>
            <th className="border-b border-slate-200 py-1.5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((item, index) => (
            <tr key={item.id || index}>
              <td className="border-b border-slate-100 py-1.5 pr-2 text-slate-500">{index + 1}</td>
              <td className="border-b border-slate-100 py-1.5 pr-2">
                {item.description}
                {extraCols?.(item)}
              </td>
              <td className="border-b border-slate-100 py-1.5 pr-2 text-right tabular-nums">{item.quantity}</td>
              <td className="border-b border-slate-100 py-1.5 pr-2">{item.unit}</td>
              <td className="border-b border-slate-100 py-1.5 pr-2 text-right tabular-nums">{formatCurrency(item.rate)}</td>
              <td className="border-b border-slate-100 py-1.5 text-right tabular-nums font-medium">{formatCurrency(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function QuotationDocument({ quotation, company }) {
  const totals = calculateQuotationTotals(quotation);
  const c = company || {};

  return (
    <article id="quotation-preview" className="mx-auto w-full max-w-a4 bg-white px-10 py-9 text-slate-800 shadow-paper print:max-w-none print:px-0 print:py-0 print:shadow-none">
      <header className="print-break mb-7 flex items-start justify-between gap-6 border-b border-[#0A1B33] pb-5">
        <div className="min-w-0">
          {c.logoDataUrl ? (
            <img src={c.logoDataUrl} alt="MK Construction & Builders" className="h-auto max-h-[88px] w-[160px] object-contain object-left" />
          ) : (
            <BrandLogo variant="quotation" className="object-left" />
          )}
          <div className="mt-3 text-[11px] leading-relaxed text-slate-600">
            <p>{c.address}</p>
            <p>
              Mob: {c.mobile}
              {c.altMobile ? ` / ${c.altMobile}` : ''} · {c.email}
            </p>
            {c.gstNumber ? <p>GSTIN: {c.gstNumber}</p> : null}
          </div>
        </div>
        <div className="text-right text-[12px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Quotation</p>
          <p className="mt-1 text-[16px] font-semibold text-[#0B1F3A]">{quotation.quotationNumber}</p>
          <p className="mt-1 text-[11px] text-slate-600">Date: {formatDate(quotation.quotationDate)}</p>
          <p className="text-[11px] text-slate-600">Status: {quotation.status}</p>
        </div>
      </header>

      <section className="print-break mb-6 grid grid-cols-2 gap-8 text-[12px]">
        <div>
          <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Customer</h3>
          <p className="font-medium text-[#0B1F3A]">{quotation.customer?.name}</p>
          <p>{quotation.customer?.mobile}</p>
          <p>{quotation.customer?.email}</p>
          <p>{quotation.customer?.type}</p>
        </div>
        <div>
          <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Project</h3>
          <p className="font-medium text-[#0B1F3A]">{quotation.project?.name}</p>
          <p>{quotation.project?.siteAddress}</p>
          <p>
            Plot: {quotation.project?.plotArea || '—'} sqft · Built-up: {quotation.project?.constructionArea || '—'} sqft · Floors: {quotation.project?.floors}
          </p>
        </div>
      </section>

      <SectionTable title="Construction Work" items={quotation.constructionItems} />
      <SectionTable title="Additional Work" items={quotation.additionalWorks} />
      <SectionTable title="Electrical" items={quotation.electricalItems} />
      <SectionTable title="Plumbing" items={quotation.plumbingItems} />
      <SectionTable title="Doors" items={quotation.doors} />
      <SectionTable title="Sliding Windows" items={quotation.windows} extraCols={(item) => (item.length ? ` (${item.length} × ${item.width} = ${item.area} sqft)` : '')} />
      <SectionTable title="Tiles" items={quotation.tiles} />
      <SectionTable title="Granite" items={quotation.granite} />
      <SectionTable title="Painting" items={quotation.painting} />

      {quotation.materials?.length ? (
        <section className="print-break mb-6">
          <h3 className="mb-2 border-b border-[#0B1F3A] pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0B1F3A]">Material Specifications</h3>
          <ul className="grid grid-cols-1 gap-1 text-[11px] sm:grid-cols-2">
            {quotation.materials.filter((m) => m.selected !== false).map((m) => (
              <li key={m.id} className="border-b border-slate-100 py-1">
                <span className="font-medium">{m.name}</span>
                {m.brand ? ` — ${m.brand}` : ''} {m.specification ? `(${m.specification})` : ''}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {quotation.terms?.length ? (
        <section className="print-break mb-6">
          <h3 className="mb-2 border-b border-[#0B1F3A] pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0B1F3A]">Terms & Conditions</h3>
          <ol className="list-decimal space-y-1.5 pl-4 text-[11px] leading-relaxed">
            {quotation.terms.map((term) => (
              <li key={term.id}>
                <span className="font-medium">{term.title}: </span>
                {term.body}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="print-break ml-auto w-full max-w-sm text-[12px]">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0B1F3A]">Price Summary</h3>
        <div className="space-y-1.5 border-t border-[#0B1F3A] pt-3">
          <Row label="Subtotal" value={totals.subtotal} />
          <Row label={`Discount (${quotation.discount || 0}%)`} value={totals.discountAmount} />
          <Row label={`GST (${quotation.gst || 0}%)`} value={totals.gstAmount} />
          <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-[15px] font-semibold text-[#0B1F3A]">
            <span>Grand Total</span>
            <span className="tabular-nums">{formatCurrency(totals.grandTotal)}</span>
          </div>
        </div>
      </section>

      {quotation.notes ? <p className="mt-4 text-[11px] text-slate-600">Notes: {quotation.notes}</p> : null}

      <footer className="print-break mt-12 flex items-end justify-between">
        <div className="text-[11px] text-slate-500">
          {c.bankName ? (
            <>
              <p className="font-medium text-slate-700">Bank details</p>
              <p>
                {c.bankName} · {c.branch}
              </p>
              <p>
                A/c {c.accountNumber} · IFSC {c.ifsc}
              </p>
            </>
          ) : null}
        </div>
        <div className="text-center text-[12px]">
          <div className="mb-10 h-10" />
          <p className="font-medium text-[#0B1F3A]">{c.signatureName || 'Authorized signatory'}</p>
          <p className="text-[11px] text-slate-500">{c.signatureTitle || 'For MK Construction & Builders'}</p>
        </div>
      </footer>
    </article>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between tabular-nums">
      <span className="text-slate-500">{label}</span>
      <span>{formatCurrency(value)}</span>
    </div>
  );
}
