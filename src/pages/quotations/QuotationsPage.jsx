import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/cards/Card';
import { SearchInput } from '../../components/common/SearchInput';
import { FilterBar } from '../../components/common/FilterBar';
import { Select } from '../../components/forms/Fields';
import { DataTable } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/States';
import { quotationService, customerService } from '../../services/mock';
import { QUOTATION_STATUSES } from '../../constants';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { QuotationRowActions } from '../../features/quotations/QuotationRowActions';

export default function QuotationsPage() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get('q') || '';
  const status = params.get('status') || '';
  const customer = params.get('customer') || '';
  const amount = params.get('amount') || '';

  const load = () => quotationService.getAll().then(setRows);

  useEffect(() => {
    load();
    customerService.getAll().then(setCustomers);
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const hay = `${row.quotationNumber} ${row.customer?.name} ${row.project?.name}`.toLowerCase();
      if (q && !hay.includes(q.toLowerCase())) return false;
      if (status && row.status !== status) return false;
      if (customer && row.customer?.id !== customer) return false;
      const total = Number(row.grandTotal) || 0;
      if (amount === 'lt50' && total >= 5000000) return false;
      if (amount === '50to150' && (total < 5000000 || total > 15000000)) return false;
      if (amount === 'gt150' && total <= 15000000) return false;
      return true;
    });
  }, [rows, q, status, customer, amount]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Quotations"
        title="All Quotations"
        description="Manage construction estimates and proposals."
        actions={<Button onClick={() => navigate('/quotations/new')}><Plus className="h-4 w-4" /> New Quotation</Button>}
      />
      <Card>
        <FilterBar>
          <SearchInput compact className="md:col-span-2 xl:col-span-2" value={q} onChange={(v) => setFilter('q', v)} placeholder="Search quotation number, customer, project..." />
          <Select value={status} onChange={(e) => setFilter('status', e.target.value)} className="input-control-sm">
            <option value="">All statuses</option>
            {QUOTATION_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </Select>
          <Select value={customer} onChange={(e) => setFilter('customer', e.target.value)} className="input-control-sm">
            <option value="">All customers</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select value={amount} onChange={(e) => setFilter('amount', e.target.value)} className="input-control-sm">
            <option value="">All amounts</option>
            <option value="lt50">Below ₹50L</option>
            <option value="50to150">₹50L – ₹1.5Cr</option>
            <option value="gt150">Above ₹1.5Cr</option>
          </Select>
        </FilterBar>
        <DataTable
          rows={filtered}
          empty={<EmptyState title="No quotations yet" description="Create your first construction quotation to get started." actionLabel="Create Quotation" onAction={() => navigate('/quotations/new')} />}
          columns={[
            { key: 'quotationNumber', header: 'Quotation No', sortable: true },
            { key: 'customer', header: 'Customer', render: (r) => r.customer?.name },
            { key: 'project', header: 'Project', render: (r) => r.project?.name },
            { key: 'quotationDate', header: 'Date', render: (r) => formatDate(r.quotationDate), sortable: true },
            { key: 'grandTotal', header: 'Amount', headerClassName: 'text-right', className: 'text-right tabular-nums money', render: (r) => formatCurrency(r.grandTotal), sortable: true },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { key: 'actions', header: '', render: (r) => <QuotationRowActions row={r} onChanged={load} /> },
          ]}
        />
      </Card>
    </div>
  );
}
