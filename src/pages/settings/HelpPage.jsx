import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/cards/Card';

export default function HelpPage() {
  return (
    <div>
      <PageHeader eyebrow="System" title="Help" description="Produce a complete MK quotation with confidence." />
      <Card className="space-y-3 text-sm leading-relaxed text-muted">
        <p>1. Add or select a customer and project.</p>
        <p>2. Review construction quantities. Amounts are quantity × rate from Rate Master.</p>
        <p>3. Configure additional works, electrical points, plumbing, doors, windows, tiles, granite and painting.</p>
        <p>4. Choose material specifications and terms.</p>
        <p>5. Save a draft at any time. Preview, print or download PDF from the summary panel.</p>
        <p>All data for this phase is stored in your browser (localStorage). A FastAPI backend can replace the service layer later without rewriting screens.</p>
      </Card>
    </div>
  );
}
