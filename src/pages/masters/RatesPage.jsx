import { MasterPage, moneyCol, statusCol, categoryCol } from './MasterPage';
import { rateService } from '../../services/mock';
import { RATE_CATEGORIES, UNITS } from '../../constants';

export default function RatesPage() {
  return (
    <MasterPage
      eyebrow="Masters / Pricing"
      title="Rate Master"
      uppercase
      description="Central pricing library for construction estimates"
      addLabel="Add Rate"
      entityLabel="rate"
      service={rateService}
      createFactory={() => ({ item: '', category: 'Structure', rate: 0, unit: 'sqft', description: '', status: 'Active' })}
      fields={[
        { name: 'item', label: 'Item' },
        { name: 'category', label: 'Category', type: 'select', options: RATE_CATEGORIES },
        { name: 'rate', label: 'Rate', type: 'number' },
        { name: 'unit', label: 'Unit', type: 'select', options: UNITS },
        { name: 'description', label: 'Description' },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
      ]}
      columns={[
        { key: 'item', header: 'Item', sortable: true, render: (r) => <span className="font-medium text-ink">{r.item}</span> },
        categoryCol(),
        moneyCol(),
        { key: 'unit', header: 'Unit', className: 'text-muted' },
        { key: 'description', header: 'Description', className: 'max-w-xs text-muted', render: (r) => <span className="line-clamp-2 text-[13px] text-muted">{r.description}</span> },
        statusCol(),
      ]}
    />
  );
}
