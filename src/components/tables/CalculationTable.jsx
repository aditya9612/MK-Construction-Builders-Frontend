import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';
import { UNITS } from '../../constants';
import { Button } from '../common/Button';

const cellInput = 'h-9 w-full rounded-md border border-line bg-white px-2 text-sm tabular-nums transition duration-ui focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15';

export function CalculationTable({ items, onChange, onAdd, onRemove, showArea = false }) {
  return (
    <div>
      <div className="overflow-x-auto rounded-[12px] border border-line">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 table-head">
            <tr>
              <th className="border-b border-line px-3 py-3">#</th>
              <th className="border-b border-line px-3 py-3">Work</th>
              {showArea ? (
                <>
                  <th className="border-b border-line px-3 py-3 text-right">Length</th>
                  <th className="border-b border-line px-3 py-3 text-right">Width</th>
                  <th className="border-b border-line px-3 py-3 text-right">Area</th>
                </>
              ) : (
                <th className="border-b border-line px-3 py-3 text-right">Quantity</th>
              )}
              <th className="border-b border-line px-3 py-3">Unit</th>
              <th className="border-b border-line px-3 py-3 text-right">Rate</th>
              <th className="border-b border-line px-3 py-3 text-right">Amount</th>
              <th className="border-b border-line px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-t border-line transition duration-ui hover:bg-[#F8FBFE]">
                <td className="px-3 py-2 text-faint">{index + 1}</td>
                <td className="min-w-[220px] px-3 py-2">
                  <input className="h-9 w-full rounded-md border border-line bg-white px-2 text-sm transition duration-ui focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15" value={item.description} onChange={(e) => onChange(item.id, { description: e.target.value })} />
                </td>
                {showArea ? (
                  <>
                    <td className="px-3 py-2">
                      <input type="number" min="0" className={`${cellInput} w-24 text-right`} value={item.length ?? ''} onChange={(e) => onChange(item.id, { length: Number(e.target.value) })} />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min="0" className={`${cellInput} w-24 text-right`} value={item.width ?? ''} onChange={(e) => onChange(item.id, { width: Number(e.target.value) })} />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums money text-muted">{item.area ?? item.quantity}</td>
                  </>
                ) : (
                  <td className="px-3 py-2">
                    <input type="number" min="0" className={`${cellInput} ml-auto w-24 text-right`} value={item.quantity} onChange={(e) => onChange(item.id, { quantity: Number(e.target.value) })} />
                  </td>
                )}
                <td className="px-3 py-2">
                  <select className={`${cellInput} w-[104px]`} value={item.unit} onChange={(e) => onChange(item.id, { unit: e.target.value })}>
                    {UNITS.map((unit) => (
                      <option key={unit}>{unit}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input type="number" min="0" className={`${cellInput} ml-auto w-28 text-right`} value={item.rate} onChange={(e) => onChange(item.id, { rate: Number(e.target.value) })} />
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums money text-ink">{formatCurrency(item.amount)}</td>
                <td className="px-3 py-2">
                  <button type="button" className="rounded-md p-1.5 text-faint transition duration-ui hover:bg-[#FDF4F4] hover:text-danger" onClick={() => onRemove(item.id)} aria-label="Remove item">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button variant="secondary" size="sm" className="mt-3" onClick={onAdd}>
        <Plus className="h-4 w-4" /> Add item
      </Button>
    </div>
  );
}
