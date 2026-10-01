import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService, customerService, quotationService } from '../../services/mock';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/cards/Card';
import { StatusBadge } from '../../components/common/Badge';
import { LoadingSkeleton, ErrorState } from '../../components/common/States';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { DataTable } from '../../components/tables/DataTable';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    projectService.getById(id).then(async (p) => {
      if (!p) { setError('Project not found.'); return; }
      setProject(p);
      setCustomer(await customerService.getById(p.customerId));
      const all = await quotationService.getAll();
      setQuotations(all.filter((q) => q.project?.id === id));
    });
  }, [id]);

  if (!project && !error) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} />;
  const total = quotations.reduce((s, q) => s + (Number(q.grandTotal) || 0), 0);

  return (
    <div>
      <PageHeader title={project.name} description={project.siteAddress} />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">Customer</p>
          <p className="mt-2 font-semibold text-ink">{customer?.name}</p>
          <button type="button" className="mt-1 text-sm font-medium text-brand" onClick={() => navigate(`/customers/${customer?.id}`)}>View customer</button>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">Site</p>
          <p>{project.plotArea} sqft plot · {project.constructionArea} sqft built-up</p>
          <p>{project.floors} · Start {formatDate(project.startDate)}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">Estimated value</p>
          <p className="mt-2 text-[26px] font-semibold tabular-nums money text-brand-navy">{formatCurrency(total)}</p>
          <StatusBadge status={project.status} />
        </Card>
      </div>
      <Card className="mt-4">
        <h3 className="mb-3 font-semibold">Quotation history</h3>
        <DataTable
          rows={quotations}
          columns={[
            { key: 'quotationNumber', header: 'Quotation' },
            { key: 'quotationDate', header: 'Date', render: (r) => formatDate(r.quotationDate) },
            { key: 'grandTotal', header: 'Amount', headerClassName: 'text-right', className: 'text-right tabular-nums money', render: (r) => formatCurrency(r.grandTotal) },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { key: 'actions', header: '', render: (r) => <button type="button" className="text-sm font-medium text-brand" onClick={() => navigate(`/quotations/${r.id}`)}>Open</button> },
          ]}
        />
      </Card>
    </div>
  );
}
