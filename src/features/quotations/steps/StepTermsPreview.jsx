import { useEffect, useState } from 'react';
import { SectionCard } from '../../../components/cards/Card';
import { Textarea, Input } from '../../../components/forms/Fields';
import { Button } from '../../../components/common/Button';
import { termsService, companyService } from '../../../services/mock';
import { QuotationDocument } from '../../../components/quotation/QuotationDocument';
import { uid } from '../../../utils/formatting';

export function StepTermsPreview({ quotation, onPatch }) {
  const [library, setLibrary] = useState([]);
  const [company, setCompany] = useState(null);

  useEffect(() => {
    termsService.getAll().then(setLibrary);
    companyService.get().then(setCompany);
  }, []);

  return (
    <div className="space-y-5">
      <SectionCard title="Terms & conditions" description="Select defaults or add quotation-specific terms.">
        <div className="space-y-2">
          {library.map((term) => {
            const selected = quotation.terms?.some((t) => t.id === term.id);
            return (
              <label key={term.id} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={!!selected}
                  onChange={() => {
                    if (selected) onPatch({ terms: quotation.terms.filter((t) => t.id !== term.id) });
                    else onPatch({ terms: [...(quotation.terms || []), term] });
                  }}
                />
                <span>
                  <span className="font-medium">{term.title}</span>
                  <span className="block text-slate-500">{term.body}</span>
                </span>
              </label>
            );
          })}
        </div>
        <Button
          className="mt-3"
          variant="secondary"
          size="sm"
          onClick={() =>
            onPatch({
              terms: [...(quotation.terms || []), { id: uid('term'), title: 'Custom term', body: 'Describe the condition' }],
            })
          }
        >
          Add custom term
        </Button>
        <div className="mt-4 space-y-3">
          {(quotation.terms || []).map((term) => (
            <div key={term.id} className="grid gap-2 md:grid-cols-2">
              <Input
                label="Title"
                value={term.title}
                onChange={(e) =>
                  onPatch({ terms: quotation.terms.map((t) => (t.id === term.id ? { ...t, title: e.target.value } : t)) })
                }
              />
              <Textarea
                label="Body"
                value={term.body}
                onChange={(e) =>
                  onPatch({ terms: quotation.terms.map((t) => (t.id === term.id ? { ...t, body: e.target.value } : t)) })
                }
              />
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Internal notes">
        <Textarea value={quotation.notes || ''} onChange={(e) => onPatch({ notes: e.target.value })} placeholder="Notes for the team (printed if filled)" />
      </SectionCard>
      <SectionCard title="Live preview">
        <div className="overflow-auto rounded-lg border border-slate-200 bg-slate-100 p-4">
          <QuotationDocument quotation={quotation} company={company} />
        </div>
      </SectionCard>
    </div>
  );
}
