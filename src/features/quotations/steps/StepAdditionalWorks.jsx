import { useMemo, useState } from 'react';
import { SectionCard } from '../../../components/cards/Card';
import { CalculationTable } from '../../../components/tables/CalculationTable';
import { ADDITIONAL_WORK_TABS } from '../../../constants';
import { uid } from '../../../utils/formatting';
import { ElectricalEditor } from './ElectricalEditor';
import { formatCurrency } from '../../../utils/formatting';
import { calculateElectricalTotal, sumAmounts } from '../../../utils/calculations';
import { toast } from '../../../store/uiStore';
import { cn } from '../../../utils/formatting';

const LIST_FOR_TAB = {
  electrical: 'electricalItems',
  plumbing: 'plumbingItems',
  doors: 'doors',
  windows: 'windows',
  tiles: 'tiles',
  painting: 'painting',
};

export function StepAdditionalWorks({ quotation, updateList, addListItem, removeListItem }) {
  const [tab, setTab] = useState('water-tank');

  const additionalForTab = useMemo(
    () => (quotation.additionalWorks || []).filter((i) => (i.category || 'other') === tab),
    [quotation.additionalWorks, tab]
  );

  const listKey = LIST_FOR_TAB[tab];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto border-b border-line">
        {ADDITIONAL_WORK_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={cn(
              'whitespace-nowrap border-b-2 px-3 py-2 text-[13px] font-medium transition duration-ui',
              tab === t.id ? 'border-brand bg-brand-pale text-brand' : 'border-transparent text-muted hover:bg-surface hover:text-ink'
            )}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'electrical' ? (
        <ElectricalEditor quotation={quotation} updateList={updateList} addListItem={addListItem} removeListItem={removeListItem} />
      ) : listKey ? (
        <SectionCard
          title={ADDITIONAL_WORK_TABS.find((t) => t.id === tab)?.label}
          description={tab === 'plumbing' ? `Plumbing total ${formatCurrency(sumAmounts(quotation.plumbingItems))}` : tab === 'painting' ? `Painting total ${formatCurrency(sumAmounts(quotation.painting))}` : undefined}
        >
          <CalculationTable
            items={quotation[listKey] || []}
            showArea={tab === 'windows'}
            onChange={(id, patch) => updateList(listKey, id, patch)}
            onRemove={(id) => {
              removeListItem(listKey, id);
              toast('Item removed successfully');
            }}
            onAdd={() =>
              addListItem(listKey, {
                id: uid('item'),
                description: 'Custom item',
                quantity: 0,
                length: tab === 'windows' ? 0 : undefined,
                width: tab === 'windows' ? 0 : undefined,
                unit: tab === 'windows' ? 'sqft' : 'nos',
                rate: 0,
                amount: 0,
              })
            }
          />
        </SectionCard>
      ) : (
        <SectionCard title={ADDITIONAL_WORK_TABS.find((t) => t.id === tab)?.label}>
          <CalculationTable
            items={additionalForTab}
            onChange={(id, patch) => updateList('additionalWorks', id, patch)}
            onRemove={(id) => {
              removeListItem('additionalWorks', id);
              toast('Item removed successfully');
            }}
            onAdd={() =>
              addListItem('additionalWorks', {
                id: uid('item'),
                description: 'Custom additional work',
                quantity: 0,
                unit: 'sqft',
                rate: 0,
                amount: 0,
                category: tab,
              })
            }
          />
        </SectionCard>
      )}
      {tab === 'electrical' ? (
        <p className="text-[13px] text-muted">Electrical total: <span className="font-semibold tabular-nums text-ink">{formatCurrency(calculateElectricalTotal(quotation.electricalItems))}</span></p>
      ) : null}
    </div>
  );
}
