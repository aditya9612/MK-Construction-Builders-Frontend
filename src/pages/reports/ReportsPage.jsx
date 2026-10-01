import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/cards/Card';
import { quotationService } from '../../services/mock';
import { formatCurrency } from '../../utils/formatting';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function ReportsPage() {
  const [rows, setRows] = useState([]);
  useEffect(() => { quotationService.getAll().then(setRows); }, []);

  const totals = useMemo(() => {
    const sum = (status) => rows.filter((r) => !status || r.status === status).reduce((s, r) => s + (Number(r.grandTotal) || 0), 0);
    return {
      all: sum(),
      approved: sum('Approved'),
      draft: sum('Draft'),
      rejected: sum('Rejected'),
      count: rows.length,
    };
  }, [rows]);

  const monthly = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const key = (r.quotationDate || '').slice(0, 7);
      map[key] = (map[key] || 0) + (Number(r.grandTotal) || 0);
    });
    return Object.entries(map).map(([month, value]) => ({ month, value })).sort((a, b) => a.month.localeCompare(b.month));
  }, [rows]);

  const byCustomer = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const name = r.customer?.name || 'Unknown';
      map[name] = (map[name] || 0) + (Number(r.grandTotal) || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [rows]);

  return (
    <div>
      <PageHeader eyebrow="Business" title="Reports" description="Construction quotation performance at a glance." />
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="Total quotation value" value={formatCurrency(totals.all)} />
        <Stat label="Approved value" value={formatCurrency(totals.approved)} />
        <Stat label="Draft value" value={formatCurrency(totals.draft)} />
        <Stat label="Rejected value" value={formatCurrency(totals.rejected)} />
        <Stat label="Quotation count" value={totals.count} />
      </div>
      <Card className="mt-4">
        <h3 className="mb-3 font-semibold">Monthly quotation value</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid stroke="#DCE5ED" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#8A99A8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#8A99A8' }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 10, borderColor: '#DCE5ED', fontSize: 12 }} />
              <Bar dataKey="value" fill="#2E6FA8" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card className="mt-4">
        <h3 className="mb-3 font-semibold">Customer-wise quotation value</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCustomer} layout="vertical">
              <CartesianGrid stroke="#DCE5ED" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#8A99A8' }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12, fill: '#5F7185' }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 10, borderColor: '#DCE5ED', fontSize: 12 }} />
              <Bar dataKey="value" fill="#4F8DBE" radius={[0, 4, 4, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <Card className="p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">{label}</p>
      <p className="mt-2 text-[22px] font-semibold tracking-tight tabular-nums money text-brand-navy">{value}</p>
    </Card>
  );
}
