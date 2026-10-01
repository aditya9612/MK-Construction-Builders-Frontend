import { SectionCard } from '../../../components/cards/Card';
import { ELECTRICAL_ROOMS } from '../../../mock/electrical';
import { uid } from '../../../utils/formatting';
import { formatNumber } from '../../../utils/formatting';
import { Button } from '../../../components/common/Button';
import { Plus, Zap, Minus } from 'lucide-react';

export function ElectricalEditor({ quotation, updateList, addListItem }) {
  const items = quotation.electricalItems || [];
  const totalPoints = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-line bg-white px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Total electrical points</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{formatNumber(totalPoints, 0)}</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-navy-700">
          <Zap className="h-4 w-4" />
        </span>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {ELECTRICAL_ROOMS.map((room) => (
          <SectionCard key={room.id} title={room.label} className="p-4">
            <div className="divide-y divide-line">
              {items
                .filter((i) => i.room === room.label)
                .map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_auto] items-center gap-3 py-1.5 text-[13px]">
                    <span className="text-ink">{item.description.replace(`${room.label} — `, '')}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-muted hover:bg-slate-50"
                        aria-label="Decrease"
                        onClick={() => updateList('electricalItems', item.id, { quantity: Math.max(0, Number(item.quantity) - 1) })}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        className="h-8 w-14 rounded-md border border-line px-1 text-center text-sm tabular-nums"
                        value={item.quantity}
                        onChange={(e) => updateList('electricalItems', item.id, { quantity: Number(e.target.value) })}
                      />
                      <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-muted hover:bg-slate-50"
                        aria-label="Increase"
                        onClick={() => updateList('electricalItems', item.id, { quantity: Number(item.quantity) + 1 })}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </SectionCard>
        ))}
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          addListItem('electricalItems', {
            id: uid('item'),
            description: 'Custom electrical point',
            room: 'Hall',
            quantity: 1,
            unit: 'nos',
            rate: 850,
            amount: 850,
          })
        }
      >
        <Plus className="h-4 w-4" /> Add electrical point
      </Button>
    </div>
  );
}
