import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/cards/Card';
import { Button } from '../../components/common/Button';
import { Input, Textarea } from '../../components/forms/Fields';
import { termsService } from '../../services/mock';
import { toast, useUiStore } from '../../store/uiStore';
import { uid } from '../../utils/formatting';

export default function TermsPage() {
  const [rows, setRows] = useState([]);
  const openConfirm = useUiStore((s) => s.openConfirm);

  const load = async () => setRows(await termsService.getAll());
  useEffect(() => { load(); }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Business"
        title="Terms & Conditions"
        description="Default business terms used on new quotations."
        actions={<Button onClick={async () => { await termsService.create({ title: 'New term', body: '', selected: true }); toast('Term added'); load(); }}>Add term</Button>}
      />
      <div className="space-y-3">
        {rows.map((term) => (
          <Card key={term.id}>
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="grid gap-3">
                <Input label="Title" value={term.title} onChange={(e) => termsService.update(term.id, { title: e.target.value }).then(load)} />
                <Textarea label="Body" value={term.body} onChange={(e) => termsService.update(term.id, { body: e.target.value }).then(load)} />
              </div>
              <Button variant="danger" className="self-start" onClick={() => openConfirm({
                title: 'Remove term',
                message: 'Are you sure you want to delete this term?',
                confirmLabel: 'Delete',
                danger: true,
                onConfirm: async () => { await termsService.delete(term.id); toast('Term removed'); load(); },
              })}>Remove</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export { uid };
