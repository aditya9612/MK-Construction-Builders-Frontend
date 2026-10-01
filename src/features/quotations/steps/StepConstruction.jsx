import { Ruler } from 'lucide-react';
import { SectionCard } from '../../../components/cards/Card';
import { CalculationTable } from '../../../components/tables/CalculationTable';
import { uid } from '../../../utils/formatting';
import { toast } from '../../../store/uiStore';

export function StepConstruction({ quotation, updateList, addListItem, removeListItem }) {
  return (
    <SectionCard title="Construction details" icon={Ruler} description="Quantity × rate. Amounts update instantly from Rate Master.">
      <CalculationTable
        items={quotation.constructionItems || []}
        onChange={(id, patch) => updateList('constructionItems', id, patch)}
        onRemove={(id) => {
          removeListItem('constructionItems', id);
          toast('Item removed successfully');
        }}
        onAdd={() =>
          addListItem('constructionItems', {
            id: uid('item'),
            description: 'Custom construction item',
            quantity: 0,
            unit: 'sqft',
            rate: 0,
            amount: 0,
          })
        }
      />
    </SectionCard>
  );
}
