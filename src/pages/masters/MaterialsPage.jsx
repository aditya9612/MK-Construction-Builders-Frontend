import { MasterPage, statusCol, categoryCol } from './MasterPage';
import { materialService } from '../../services/mock';
import { MATERIAL_CATEGORIES, UNITS } from '../../constants';

export default function MaterialsPage() {
  return (
    <MasterPage
      eyebrow="Masters / Materials"
      title="Material Master"
      description="Specifications that appear on quotations."
      addLabel="Add Material"
      entityLabel="material"
      service={materialService}
      createFactory={() => ({ name: '', category: MATERIAL_CATEGORIES[0], brand: '', specification: '', unit: 'nos', status: 'Active' })}
      fields={[
        { name: 'name', label: 'Material Name' },
        { name: 'category', label: 'Category', type: 'select', options: MATERIAL_CATEGORIES },
        { name: 'brand', label: 'Brand' },
        { name: 'specification', label: 'Specification' },
        { name: 'unit', label: 'Unit', type: 'select', options: UNITS },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
      ]}
      columns={[
        { key: 'name', header: 'Material Name', sortable: true, render: (r) => <span className="font-medium text-ink">{r.name}</span> },
        categoryCol(),
        { key: 'brand', header: 'Brand' },
        { key: 'specification', header: 'Specification', className: 'text-muted' },
        { key: 'unit', header: 'Unit', className: 'text-muted' },
        statusCol(),
      ]}
    />
  );
}
