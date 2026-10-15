import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, PenLine, BadgeCheck, IndianRupee } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/cards/Card';
import { DataTable } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/common/Badge';
import { quotationService } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { LoadingSkeleton } from '../../components/common/States';
import {
  AreaChart,
  Area,
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
  Draft: '#8A99A8',
  Sent: '#2E6FA8',
  Approved: '#168B5B',
  Rejected: '#C94242',
  Expired: '#C78316',
};
const COLORS = ['#8A99A8', '#2E6FA8', '#168B5B', '#C94242', '#C78316'];

const axis = { fontSize: 12, fill: '#8A99A8', tickLine: false, axisLine: false };

export default function DashboardPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    quotationService
      .getAll()
      .then(setRows)
      .catch(() => setError('Unable to load dashboard data.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const drafts = rows.filter((r) => r.status === 'Draft').length;
    const approved = rows.filter((r) => r.status === 'Approved').length;
    const value = rows.reduce((s, r) => s + (Number(r.grandTotal) || 0), 0);
    return { total, drafts, approved, value };
  }, [rows]);

  const monthly = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const key = (r.quotationDate || '').slice(0, 7) || 'Unknown';
      map[key] = map[key] || { month: key, value: 0, count: 0 };
      map[key].value += Number(r.grandTotal) || 0;
      map[key].count += 1;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [rows]);

  const statusData = useMemo(() => {
    const counts = {};
    rows.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [rows]);

  if (loading) return <LoadingSkeleton rows={8} />;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Dashboard"
        description="Construction quotation overview"
        actions={<Button onClick={() => navigate('/quotations/new')}><Plus className="h-4 w-4" /> New Quotation</Button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={FileText} label="Total quotations" value={stats.total} trend="+12%" note="vs last quarter" />
        <Kpi icon={PenLine} label="Drafts" value={stats.drafts} trend="Needs review" note="Save before sending" />
        <Kpi icon={BadgeCheck} label="Approved" value={stats.approved} trend="+4" note="Won this year" />
        <Kpi icon={IndianRupee} label="Total quotation value" value={formatCurrency(stats.value)} trend="+8.4%" note="Pipeline value" />
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h3 className="mb-4 text-[15px] font-semibold text-ink">Monthly quotation value</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <CartesianGrid stroke="#DCE5ED" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" {...axis} />
                <YAxis {...axis} />
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 10, borderColor: '#DCE5ED', fontSize: 12 }} />
                <Area type="monotone" dataKey="value" stroke="#2E6FA8" fill="#EAF3FA" strokeWidth={1.8} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h3 className="mb-4 text-[15px] font-semibold text-ink">Quotation status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={54} outerRadius={78} paddingAngle={2} stroke="none">
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, borderColor: '#DCE5ED', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="xl:col-span-3">
          <h3 className="mb-4 text-[15px] font-semibold text-ink">Monthly quotation count</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid stroke="#DCE5ED" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" {...axis} />
                <YAxis allowDecimals={false} {...axis} />
                <Tooltip contentStyle={{ borderRadius: 10, borderColor: '#DCE5ED', fontSize: 12 }} />
                <Bar dataKey="count" fill="#2E6FA8" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card className="mt-6">
        <h3 className="mb-4 text-[15px] font-semibold text-ink">Recent quotations</h3>
        <DataTable
          rows={rows.slice(0, 8)}
          columns={[
            { key: 'quotationNumber', header: 'Quotation No', sortable: true, render: (r) => <span className="font-medium">{r.quotationNumber}</span> },
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

function Kpi({ icon: Icon, label, value, trend, note }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-pale text-brand">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-[26px] font-semibold tracking-tight tabular-nums money text-brand-navy">{value}</p>
      <p className="mt-2 text-[12px] text-muted">
        <span className="font-medium text-success">{trend}</span>
        <span className="text-faint"> · {note}</span>
      </p>
    </Card>
  );
}
