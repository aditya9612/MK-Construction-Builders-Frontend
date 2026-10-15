import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, RefreshCw, FilterX, FileSpreadsheet, CheckCircle2, Clock, Send, AlertTriangle, Layers, DollarSign } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/cards/Card';
import { SearchInput } from '../../components/common/SearchInput';
import { DataTable } from '../../components/tables/DataTable';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState, LoadingSkeleton } from '../../components/common/States';
import { quotationService } from '../../services/api/quotationService';
import { customerService } from '../../services/api/customerService';
import { formatCurrency, formatDate, formatNumber, cn } from '../../utils/formatting';
import { QuotationRowActions } from '../../features/quotations/QuotationRowActions';
import { toast } from '../../store/uiStore';
import { extractErrorMessage } from '../../services/api/authService';

const QUOTATION_STATUS_CONFIG = {
  DRAFT: { label: 'Draft', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200', dotClass: 'bg-slate-400' },
  SENT: { label: 'Sent', badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/80', dotClass: 'bg-sky-500 animate-pulse' },
  APPROVED: { label: 'Approved', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dotClass: 'bg-emerald-500' },
  REJECTED: { label: 'Rejected', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80', dotClass: 'bg-rose-500' },
  EXPIRED: { label: 'Expired', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80', dotClass: 'bg-amber-500' },
};

export function getQuotationStatusBadge(status = '') {
  const normalized = String(status).toUpperCase();
  const cfg = QUOTATION_STATUS_CONFIG[normalized] || {
    label: status || 'Draft',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md border whitespace-nowrap', cfg.badgeClass)}>
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dotClass)} />
      {cfg.label}
    </span>
  );
}

export default function QuotationsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  // Data states
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filter states
  const q = params.get('q') || '';
  const status = params.get('status') || 'ALL';
  const customer = params.get('customer') || 'ALL';
  const amount = params.get('amount') || 'ALL';

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value && value !== 'ALL') next.set(key, value);
    else next.delete(key);
    setParams(next);
    setPage(1);
  };

  const resetFilters = () => {
    setParams(new URLSearchParams());
    setPage(1);
  };

  // Load customers for filter dropdown
  useEffect(() => {
    let isMounted = true;
    customerService
      .getAll()
      .then((data) => {
        if (isMounted) setCustomers(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch quotations list from API: GET /api/v1/quotations
  const loadQuotations = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await quotationService.list({
          page,
          page_size: pageSize,
          search: q,
          status: status !== 'ALL' ? status : '',
          customer_id: customer !== 'ALL' ? customer : null,
          sort_by: 'created_at',
          sort_order: 'desc',
        });

        let items = res.items || [];

        // Apply client amount filter if selected
        if (amount === 'lt50') {
          items = items.filter((r) => Number(r.grand_total ?? r.grandTotal) < 5000000);
        } else if (amount === '50to150') {
          items = items.filter((r) => {
            const tot = Number(r.grand_total ?? r.grandTotal) || 0;
            return tot >= 5000000 && tot <= 15000000;
          });
        } else if (amount === 'gt150') {
          items = items.filter((r) => Number(r.grand_total ?? r.grandTotal) > 15000000);
        }

        setRows(items);
        setTotalCount(res.total ?? items.length);
        setTotalPages(res.total_pages ?? Math.max(1, Math.ceil((res.total || 0) / pageSize)));
      } catch (err) {
        toast(extractErrorMessage(err, 'Failed to fetch quotations from server'), 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, pageSize, q, status, customer, amount]
  );

  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  // Aggregate stats from current items
  const stats = useMemo(() => {
    let drafts = 0;
    let sent = 0;
    let approved = 0;
    let expired = 0;
    let totalPortfolio = 0;

    rows.forEach((r) => {
      const st = (r.status || '').toUpperCase();
      if (st === 'DRAFT') drafts++;
      else if (st === 'SENT') sent++;
      else if (st === 'APPROVED') approved++;
      else if (st === 'EXPIRED' || st === 'REJECTED') expired++;

      const amt = Number(r.grand_total ?? r.grandTotal ?? 0);
      if (Number.isFinite(amt) && amt < 1e12) {
        totalPortfolio += amt;
      }
    });

    return {
      total: totalCount || rows.length,
      drafts,
      sent,
      approved,
      expired,
      totalPortfolio,
    };
  }, [rows, totalCount]);

  const hasActiveFilters = Boolean(q || (status && status !== 'ALL') || (customer && customer !== 'ALL') || (amount && amount !== 'ALL'));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        eyebrow="Commercial"
        title="All Quotations"
        description="Construction estimates, detailed rate breakdowns, billing lifecycle, and formal proposals."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadQuotations(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh list"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 text-slate-500', (refreshing || loading) && 'animate-spin')} />
              <span>Refresh</span>
            </button>
            <Button
              onClick={() => navigate('/quotations/new')}
              className="flex items-center gap-2 bg-[#0284c7] hover:bg-[#0369a1] text-white"
            >
              <Plus className="h-4 w-4" />
              <span>New Quotation</span>
            </Button>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Quotations */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Quotations</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900">{stats.total}</span>
              <span className="text-[11px] text-slate-400 font-medium">issued</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-sky-50 text-[#0284c7] flex items-center justify-center border border-sky-100">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
        </div>

        {/* Drafts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Drafts</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-700">{stats.drafts}</span>
              <span className="text-[11px] text-slate-400 font-medium">in prep</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Sent / Active */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Sent</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-sky-600">{stats.sent}</span>
              <span className="text-[11px] text-sky-600/80 font-medium">pending</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
            <Send className="w-4 h-4" />
          </div>
        </div>

        {/* Approved */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Approved</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-emerald-600">{stats.approved}</span>
              <span className="text-[11px] text-emerald-600/80 font-medium">accepted</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Total Value */}
        <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-xl border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Total Estimate</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-bold text-slate-800">
                {formatCurrency(stats.totalPortfolio)}
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="p-0 overflow-hidden rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white">
        {/* Search & Filter Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-3 max-w-lg">
            <SearchInput
              compact
              className="w-full bg-white"
              value={q}
              onChange={(val) => setFilter('q', val)}
              placeholder="Search quotation number, client name, site..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => setFilter('status', e.target.value)}
              className="h-10 text-xs font-medium rounded-xl border border-slate-200 bg-white px-3 text-slate-700 hover:border-slate-300 focus:border-[#0284c7] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
            </select>

            {/* Customer Filter */}
            <select
              value={customer}
              onChange={(e) => setFilter('customer', e.target.value)}
              className="h-10 text-xs font-medium rounded-xl border border-slate-200 bg-white px-3 text-slate-700 hover:border-slate-300 focus:border-[#0284c7] focus:outline-none cursor-pointer max-w-[170px]"
            >
              <option value="ALL">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Amount Filter */}
            <select
              value={amount}
              onChange={(e) => setFilter('amount', e.target.value)}
              className="h-10 text-xs font-medium rounded-xl border border-slate-200 bg-white px-3 text-slate-700 hover:border-slate-300 focus:border-[#0284c7] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Amounts</option>
              <option value="lt50">Below ₹50L</option>
              <option value="50to150">₹50L – ₹1.5Cr</option>
              <option value="gt150">Above ₹1.5Cr</option>
            </select>

            {/* Reset Filters button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="h-10 px-3 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200/70 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Reset filters"
              >
                <FilterX className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* DataTable */}
        {loading ? (
          <div className="p-8">
            <LoadingSkeleton />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DataTable
              rows={rows}
              showPagination={false}
              empty={
                <EmptyState
                  title="No quotations found"
                  description={
                    hasActiveFilters
                      ? 'No estimates matched your current search filters. Try resetting them.'
                      : 'Create your first construction quotation to get started.'
                  }
                  actionLabel="New Quotation"
                  onAction={() => navigate('/quotations/new')}
                />
              }
              columns={[
                {
                  key: 'sr_no',
                  header: 'Sr. No',
                  headerClassName: 'w-14 text-center',
                  className: 'w-14 text-center',
                  render: (r, idx) => (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs font-mono">
                      {(page - 1) * pageSize + (idx != null ? idx + 1 : 1)}
                    </span>
                  ),
                },
                {
                  key: 'quotation_number',
                  header: 'Quotation No',
                  headerClassName: 'w-32',
                  className: 'w-32',
                  sortable: true,
                  render: (r) => (
                    <button
                      type="button"
                      onClick={() => navigate(`/quotations/${r.id}`)}
                      className="font-mono text-xs font-semibold text-[#0284c7] hover:underline bg-sky-50 px-2 py-0.5 rounded border border-sky-100/90 whitespace-nowrap cursor-pointer text-left"
                    >
                      {r.quotation_number || r.quotationNumber || `QUOT-${r.id}`}
                    </button>
                  ),
                },
                {
                  key: 'customer',
                  header: 'Customer',
                  render: (r) => {
                    const c = r.customer || {};
                    return (
                      <div className="text-xs">
                        <span className="font-semibold text-slate-800 block truncate max-w-[160px]">
                          {c.name || 'Unnamed Client'}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[160px]">
                          {c.mobile || c.email || '—'}
                        </span>
                      </div>
                    );
                  },
                },
                {
                  key: 'project',
                  header: 'Project / Site',
                  render: (r) => {
                    const p = r.project || {};
                    return (
                      <div className="text-xs">
                        <span className="font-semibold text-slate-800 block truncate max-w-[180px]">
                          {p.project_name || p.name || 'Site Spec'}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[180px]">
                          {p.site_address || p.siteAddress || 'Address not set'}
                        </span>
                      </div>
                    );
                  },
                },
                {
                  key: 'quotation_date',
                  header: 'Date',
                  render: (r) => (
                    <span className="text-xs text-slate-600 whitespace-nowrap">
                      {formatDate(r.quotation_date || r.quotationDate)}
                    </span>
                  ),
                  sortable: true,
                },
                {
                  key: 'grand_total',
                  header: 'Amount',
                  headerClassName: 'text-right',
                  className: 'text-right tabular-nums',
                  render: (r) => (
                    <span className="font-semibold text-slate-900 text-xs">
                      {formatCurrency(r.grand_total ?? r.grandTotal)}
                    </span>
                  ),
                  sortable: true,
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (r) => getQuotationStatusBadge(r.status),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  headerClassName: 'text-right pr-4',
                  className: 'text-right pr-4',
                  render: (r) => <QuotationRowActions row={r} onChanged={() => loadQuotations(true)} />,
                },
              ]}
            />
          </div>
        )}

        {/* Server-Side Pagination Integration */}
        {totalCount > 0 && (
          <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/30">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={totalCount}
              totalPages={totalPages}
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
              pageSizeOptions={[10, 20, 50, 100]}
              showPageSize={true}
              showTotal={true}
              showFirstLast={true}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
