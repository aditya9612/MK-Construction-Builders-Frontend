import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, PenLine, BadgeCheck, IndianRupee, Send, CalendarDays, CircleDollarSign } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/cards/Card';
import { DataTable } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/common/Badge';
import { dashboardService } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/common/States';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import { QuotationRowActions } from '../../features/quotations/QuotationRowActions';

const STATUS_COLORS = {
  DRAFT: '#8A99A8',
  SENT: '#2E6FA8',
  APPROVED: '#168B5B',
  REJECTED: '#C94242',
  EXPIRED: '#C78316',
};
const COLORS = ['#8A99A8', '#2E6FA8', '#168B5B', '#C94242', '#C78316'];

const axis = { fontSize: 12, fill: '#8A99A8', tickLine: false, axisLine: false };

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    dashboardService
      .getSummary()
      .then(setSummary)
      .catch((err) => setError(err?.response?.data?.message || 'Unable to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingSkeleton rows={8} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const recentQuotations = summary?.recentQuotations || [];
  const statusData = summary?.statusDistribution.map((item) => {
    const rawStatus = item.status || item.name || 'Unknown';
    const status = String(rawStatus).toUpperCase();
    return {
      name: status,
      label: status.charAt(0) + status.slice(1).toLowerCase(),
      value: Number(item.count ?? item.quotation_count ?? item.total ?? item.value) || 0,
    };
  }).filter((item) => item.value > 0) || [];
  const customerData = summary?.customerWiseQuotationValue.map((item) => ({
    name: item.customer_name || item.customer?.name || item.customer || item.name || 'Unknown customer',
    value: Number(item.quotation_value ?? item.total_quotation_value ?? item.total_value ?? item.value) || 0,
  })) || [];

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Dashboard"
        description="Construction quotation overview"
        actions={<Button onClick={() => navigate('/quotations/new')}><Plus className="h-4 w-4" /> New Quotation</Button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={FileText} label="Total quotations" value={summary?.totalQuotations ?? 0} />
        <Kpi icon={PenLine} label="Drafts" value={summary?.draftQuotations ?? 0} />
        <Kpi icon={Send} label="Sent" value={summary?.sentQuotations ?? 0} />
        <Kpi icon={BadgeCheck} label="Approved" value={summary?.approvedQuotations ?? 0} />
        <Kpi icon={IndianRupee} label="Total quotation value" value={formatCurrency(summary?.totalQuotationValue)} />
        <Kpi icon={CircleDollarSign} label="Approved quotation value" value={formatCurrency(summary?.approvedQuotationValue)} />
        <Kpi icon={CalendarDays} label="This month" value={`${summary?.monthlyQuotationCount ?? 0} quotations`} note={formatCurrency(summary?.monthlyQuotationValue)} />
        <Kpi icon={FileText} label="Rejected / expired" value={`${summary?.rejectedQuotations ?? 0} / ${summary?.expiredQuotations ?? 0}`} />
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h3 className="mb-4 text-[15px] font-semibold text-ink">Customer-wise quotation value</h3>
          <div className="h-64">
            {customerData.length ? <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerData}>
                <CartesianGrid stroke="#DCE5ED" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" {...axis} />
                <YAxis {...axis} />
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 10, borderColor: '#DCE5ED', fontSize: 12 }} />
                <Bar dataKey="value" fill="#2E6FA8" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer> : <p className="flex h-full items-center justify-center text-sm text-muted">No customer quotation values available.</p>}
          </div>
        </Card>
        <Card>
          <h3 className="mb-4 text-[15px] font-semibold text-ink">Quotation status</h3>
          <div className="h-64">
            {statusData.length ? <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="label" innerRadius={54} outerRadius={78} paddingAngle={2} stroke="none">
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, borderColor: '#DCE5ED', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer> : <p className="flex h-full items-center justify-center text-sm text-muted">No quotation status data available.</p>}
          </div>
        </Card>
      </div>
      <Card className="mt-6">
        <h3 className="mb-4 text-[15px] font-semibold text-ink">Recent quotations</h3>
        <DataTable
          rows={recentQuotations}
          empty={<EmptyState title="No recent quotations" description="Recent quotations will appear here when available." />}
          columns={[
            { key: 'quotationNumber', header: 'Quotation No', sortable: true, render: (r) => <span className="font-medium">{r.quotationNumber}</span> },
            { key: 'customer', header: 'Customer', render: (r) => r.customer?.name },
            { key: 'project', header: 'Project', render: (r) => r.project?.name },
            { key: 'quotationDate', header: 'Date', render: (r) => formatDate(r.quotationDate), sortable: true },
            { key: 'grandTotal', header: 'Amount', headerClassName: 'text-right', className: 'text-right tabular-nums money', render: (r) => formatCurrency(r.grandTotal), sortable: true },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status?.charAt(0) + r.status?.slice(1).toLowerCase()} /> },
            { key: 'actions', header: '', render: (r) => <QuotationRowActions row={r} onChanged={load} /> },
          ]}
        />
      </Card>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, note }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-pale text-brand">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-[26px] font-semibold tracking-tight tabular-nums money text-brand-navy">{value}</p>
      {note ? <p className="mt-2 text-[12px] text-muted">{note}</p> : null}
    </Card>
  );
}
