import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerService, projectService, quotationService } from '../../services/mock';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/cards/Card';
import { StatusBadge } from '../../components/common/Badge';
import { LoadingSkeleton, ErrorState } from '../../components/common/States';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { DataTable } from '../../components/tables/DataTable';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [projects, setProjects] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([customerService.getById(id), projectService.getAll(), quotationService.getAll()]).then(([c, p, q]) => {
      if (!c) setError('Customer not found.');
      setCustomer(c);
      setProjects(p.filter((x) => x.customerId === id));
      setQuotations(q.filter((x) => x.customer?.id === id));
    });
  }, [id]);

  if (!customer && !error) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} />;

  const total = quotations.reduce((s, q) => s + (Number(q.grandTotal) || 0), 0);

  return (
    <div>
      <PageHeader title={customer.name} description={`${customer.mobile} · ${customer.email || 'No email'}`} />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">Type</p>
          <p className="mt-2 font-semibold text-ink">{customer.type}</p>
          <StatusBadge status={customer.status} />
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">Projects</p>
          <p className="mt-2 text-[26px] font-semibold tabular-nums text-brand-navy">{projects.length}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">Total quotation value</p>
          <p className="mt-2 text-[26px] font-semibold tabular-nums money text-brand-navy">{formatCurrency(total)}</p>
        </Card>
      </div>
      <Card className="mt-4">
        <h3 className="mb-3 font-semibold">Projects</h3>
        <DataTable
          rows={projects}
          columns={[
            { key: 'name', header: 'Project' },
            { key: 'siteAddress', header: 'Site' },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { key: 'actions', header: '', render: (r) => <button type="button" className="text-sm font-medium text-brand" onClick={() => navigate(`/projects/${r.id}`)}>Open</button> },
          ]}
        />
      </Card>
      <Card className="mt-4">
        <h3 className="mb-3 font-semibold">Quotations</h3>
        <DataTable
          rows={quotations}
          columns={[
            { key: 'quotationNumber', header: 'No' },
            { key: 'quotationDate', header: 'Date', render: (r) => formatDate(r.quotationDate) },
            { key: 'grandTotal', header: 'Amount', render: (r) => formatCurrency(r.grandTotal) },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { key: 'actions', header: '', render: (r) => <button type="button" className="text-sm font-medium text-brand" onClick={() => navigate(`/quotations/${r.id}`)}>Open</button> },
          ]}
        />
      </Card>
    </div>
  );
}
