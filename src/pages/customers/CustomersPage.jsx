import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/cards/Card';
import { SearchInput } from '../../components/common/SearchInput';
import { DataTable } from '../../components/tables/DataTable';
import { Input, Select, Textarea } from '../../components/forms/Fields';
import { EmptyState, LoadingSkeleton } from '../../components/common/States';
import { customerService, projectService, quotationService } from '../../services/api';
import { formatCurrency, formatDate, cn } from '../../utils/formatting';
import { isValidEmail, isValidMobile } from '../../utils/validation';
import { toast, useUiStore } from '../../store/uiStore';
import { extractErrorMessage } from '../../services/api/authService';
import { useForm } from 'react-hook-form';
import {
  Eye,
  Pencil,
  Plus,
  Trash2,
  X,
  Phone,
  Mail,
  MapPin,
  Building2,
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  Briefcase,
  FileSpreadsheet,
  RefreshCw,
  Hash,
  Clock,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

const CUSTOMER_TYPE_OPTIONS = [
  { value: 'INDIVIDUAL', label: 'Individual' },
  { value: 'COMPANY', label: 'Company' },
  { value: 'BUILDER', label: 'Builder' },
  { value: 'ARCHITECT', label: 'Architect' },
  { value: 'CORPORATE', label: 'Corporate' },
];

export default function CustomersPage() {
  const { id: routeCustomerId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const openConfirm = useUiStore((s) => s.openConfirm);

  // Data state
  const [customers, setCustomers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [projects, setProjects] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & filters
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Unified page detail & edit panel state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Summary counts derived from response
  const stats = useMemo(() => {
    const list = customers || [];
    const active = list.filter((c) => c.is_active === true).length;
    const inactive = list.filter((c) => c.is_active === false).length;

    return {
      total: totalCount || list.length,
      active,
      inactive,
    };
  }, [customers, totalCount]);

  // Load customer list from API: GET /api/v1/customers
  const loadCustomers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const is_active =
        statusFilter === 'ACTIVE' ? true : statusFilter === 'INACTIVE' ? false : null;

      const [custData, projData, quoteData] = await Promise.all([
        customerService.list({
          page: 1,
          page_size: 100,
          search: q,
          is_active,
          sort_by: 'created_at',
          sort_order: 'desc',
        }),
        projectService.getAll().catch(() => []),
        quotationService.getAll().catch(() => []),
      ]);

      const items = custData?.items || (Array.isArray(custData) ? custData : []);
      const total = custData?.total ?? (Array.isArray(items) ? items.length : 0);
      setCustomers(Array.isArray(items) ? items : []);
      setTotalCount(total);
      setProjects(Array.isArray(projData) ? projData : []);
      setQuotations(Array.isArray(quoteData) ? quoteData : []);
    } catch (err) {
      toast(extractErrorMessage(err, 'Failed to load customers from API'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [q, statusFilter]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Fetch single customer detail from GET /api/v1/customers/{id}
  // Opens drawer INSTANTANEOUSLY using local customer data with zero delay
  const handleOpenDetail = useCallback(async (customerId, initialData = null) => {
    const local = initialData || customers.find((c) => String(c.id) === String(customerId));
    if (local) {
      setSelectedCustomer(local);
    } else {
      setSelectedCustomer({ id: customerId, name: 'Loading...' });
    }
    setLoadingDetail(true);

    try {
      const data = await customerService.getById(customerId);
      if (data) {
        setSelectedCustomer((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      if (!local) {
        toast(extractErrorMessage(err, 'Customer detail not found'), 'error');
        setSelectedCustomer(null);
      }
    } finally {
      setLoadingDetail(false);
    }
  }, [customers]);

  // Open single customer detail directly if URL has customer_id (/customers/:id)
  useEffect(() => {
    const targetId = routeCustomerId || searchParams.get('id');
    if (targetId) {
      handleOpenDetail(targetId);
    }
  }, [routeCustomerId, searchParams, handleOpenDetail]);

  const handleCloseDetail = () => {
    setSelectedCustomer(null);
    if (routeCustomerId) {
      navigate('/customers', { replace: true });
    } else if (searchParams.get('id')) {
      searchParams.delete('id');
      setSearchParams(searchParams, { replace: true });
    }
  };

  // Filter customers locally by type if selected
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (typeFilter !== 'ALL') {
        const cType = (c.customer_type || c.type || '').toUpperCase();
        if (cType !== typeFilter) return false;
      }
      return true;
    });
  }, [customers, typeFilter]);

  // Delete customer with API: DELETE /api/v1/customers/{id}
  const handleDeleteCustomer = (customer) => {
    openConfirm({
      title: 'Deactivate customer',
      message: `Are you sure you want to deactivate ${customer.name}? This will soft-delete their customer profile.`,
      confirmLabel: 'Deactivate',
      danger: true,
      onConfirm: async () => {
        try {
          await customerService.delete(customer.id);
          toast('Customer deactivated successfully!', 'success');
          if (selectedCustomer?.id === customer.id) {
            handleCloseDetail();
          }
          loadCustomers();
        } catch (err) {
          toast(extractErrorMessage(err, 'Failed to deactivate customer'), 'error');
        }
      },
    });
  };

  // Projects and quotations linked to the currently selected customer
  const linkedProjects = useMemo(() => {
    if (!selectedCustomer) return [];
    const custId = selectedCustomer.id;
    return projects.filter(
      (p) => String(p.customerId) === String(custId) || String(p.customer?.id) === String(custId)
    );
  }, [selectedCustomer, projects]);

  const linkedQuotations = useMemo(() => {
    if (!selectedCustomer) return [];
    const custId = selectedCustomer.id;
    return quotations.filter(
      (q) => String(q.customer?.id) === String(custId) || String(q.customerId) === String(custId)
    );
  }, [selectedCustomer, quotations]);

  const totalQuotationValue = useMemo(() => {
    return linkedQuotations.reduce((sum, q) => sum + (Number(q.grandTotal) || 0), 0);
  }, [linkedQuotations]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        eyebrow="Operations"
        title="Customers"
        description="Unified client directory, real-time customer profiles, linked quotations, and project history."
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setEditingCustomer(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-2 bg-[#0284c7] hover:bg-[#0369a1] text-white"
            >
              <Plus className="h-4 w-4" />
              <span>Add Customer</span>
            </Button>
          </div>
        }
      />

      {/* Small Stat Cards from Response */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Customers */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Total Customers</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900">{stats.total}</span>
              <span className="text-[11px] text-slate-400 font-medium">registered</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-sky-50 text-[#0284c7] flex items-center justify-center border border-sky-100">
            <Users className="w-4 h-4" />
          </div>
        </div>

        {/* Active Accounts */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Active Accounts</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-emerald-600">{stats.active}</span>
              <span className="text-[11px] text-emerald-600 font-medium">live</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Inactive Accounts */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Inactive</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-600">{stats.inactive}</span>
              <span className="text-[11px] text-slate-400 font-medium">deactivated</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Customers Table Card */}
      <Card className="p-0 overflow-hidden rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white">
        {/* Search & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-3 max-w-lg">
            <SearchInput
              compact
              className="w-full bg-white"
              value={q}
              onChange={setQ}
              placeholder="Search by name, phone, email, or code..."
            />
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center">
            {/* Customer Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 text-xs font-medium rounded-xl border border-slate-200 bg-white px-3 text-slate-700 focus:border-[#0284c7] focus:outline-none"
            >
              <option value="ALL">All Types</option>
              {CUSTOMER_TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 text-xs font-medium rounded-xl border border-slate-200 bg-white px-3 text-slate-700 focus:border-[#0284c7] focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
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
              rows={filteredCustomers.map((c, index) => ({
                ...c,
                srNo: index + 1,
                linkedProjCount: projects.filter(
                  (p) => String(p.customerId) === String(c.id) || String(p.customer?.id) === String(c.id)
                ).length,
                linkedQuoteCount: quotations.filter(
                  (q) => String(q.customer?.id) === String(c.id) || String(q.customerId) === String(c.id)
                ).length,
              }))}
              empty={
                <EmptyState
                  title="No customers found"
                  description="Add your first customer to start creating quotations and managing projects."
                  actionLabel="Add Customer"
                  onAction={() => {
                    setEditingCustomer(null);
                    setIsFormOpen(true);
                  }}
                />
              }
              columns={[
                {
                  key: 'sr_no',
                  header: 'Sr. No',
                  headerClassName: 'w-16 text-center',
                  className: 'w-16 text-center',
                  render: (r, idx) => (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs font-mono">
                      {idx != null ? idx + 1 : r.srNo || 1}
                    </span>
                  ),
                },
                {
                  key: 'customer_code',
                  header: 'Code',
                  render: (r) => (
                    <span className="font-mono text-xs font-semibold text-[#0284c7] bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                      {r.customer_code || `CUST-${String(r.id).padStart(3, '0')}`}
                    </span>
                  ),
                },
                {
                  key: 'name',
                  header: 'Customer Name',
                  sortable: true,
                  render: (r) => (
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(r.id, r)}
                      className="text-left font-semibold text-slate-800 hover:text-[#0284c7] transition-colors flex items-center gap-1.5 group cursor-pointer"
                    >
                      <span>{r.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ),
                },
                {
                  key: 'mobile',
                  header: 'Mobile',
                  render: (r) => (
                    <a
                      href={`tel:${r.mobile}`}
                      className="text-xs text-slate-600 hover:text-[#0284c7] flex items-center gap-1.5 font-medium"
                    >
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{r.mobile}</span>
                    </a>
                  ),
                },
                {
                  key: 'email',
                  header: 'Email',
                  render: (r) =>
                    r.email ? (
                      <a
                        href={`mailto:${r.email}`}
                        className="text-xs text-slate-600 hover:text-[#0284c7] flex items-center gap-1.5 truncate max-w-[180px]"
                      >
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{r.email}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    ),
                },
                {
                  key: 'customer_type',
                  header: 'Type',
                  render: (r) => {
                    const rawType = (r.customer_type || r.type || 'INDIVIDUAL').toUpperCase();
                    const label =
                      CUSTOMER_TYPE_OPTIONS.find((t) => t.value === rawType)?.label || rawType;
                    const isCompany = rawType === 'COMPANY' || rawType === 'CORPORATE';
                    return (
                      <span
                        className={cn(
                          'inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded tracking-wider uppercase',
                          isCompany
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            : 'bg-slate-100 text-slate-700'
                        )}
                      >
                        {label}
                      </span>
                    );
                  },
                },
                {
                  key: 'city',
                  header: 'Location',
                  render: (r) => {
                    const loc = [r.city, r.state].filter(Boolean).join(', ');
                    return loc ? (
                      <span className="text-xs text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[140px]">{loc}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    );
                  },
                },
                {
                  key: 'is_active',
                  header: 'Status',
                  render: (r) => {
                    const active = r.is_active ?? (r.status === 'Active' || r.status === true);
                    return active ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                        <XCircle className="w-3 h-3 text-rose-500" />
                        Inactive
                      </span>
                    );
                  },
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  headerClassName: 'text-right pr-4',
                  className: 'text-right pr-4',
                  render: (r) => (
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(r.id, r);
                        }}
                        title="View Details"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700 border border-sky-100/80 transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCustomer(r);
                          setIsFormOpen(true);
                        }}
                        title="Edit Customer"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 border border-amber-100/80 transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomer(r);
                        }}
                        title="Deactivate Customer"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 border border-rose-100/80 transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Card>

      {/* Slide-over Customer Detail Panel (Unified Master-Detail on the SAME page) */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={handleCloseDetail}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col border-l border-slate-200">
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-[#07192F] via-[#0B2545] to-[#12365F] text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-sky-200 border border-white/15">
                        {selectedCustomer.customer_code || `CUST-${String(selectedCustomer.id).padStart(3, '0')}`}
                      </span>
                      {selectedCustomer.is_active ?? (selectedCustomer.status === 'Active' || selectedCustomer.status === true) ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-400/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-400/30">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                      {loadingDetail && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-sky-200 bg-sky-500/20 px-2 py-0.5 rounded border border-sky-400/30">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          Syncing
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight capitalize">
                      {selectedCustomer.name}
                    </h2>
                    <p className="text-xs text-slate-300 mt-1 flex items-center gap-3">
                      <span>Type: {(selectedCustomer.customer_type || 'INDIVIDUAL').toUpperCase()}</span>
                      {selectedCustomer.city && <span>• Location: {selectedCustomer.city}</span>}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCustomer(selectedCustomer);
                        setIsFormOpen(true);
                      }}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                      title="Edit Customer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomer(selectedCustomer)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-rose-500/30 text-rose-300 hover:text-white transition-colors"
                      title="Deactivate Customer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseDetail}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                      title="Close Panel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Metrics Highlights Bar */}
                <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-slate-400 font-medium text-[11px]">Quotations</p>
                    <p className="text-lg font-bold text-white mt-0.5">{linkedQuotations.length}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-slate-400 font-medium text-[11px]">Projects</p>
                    <p className="text-lg font-bold text-white mt-0.5">{linkedProjects.length}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-slate-400 font-medium text-[11px]">Total Pipeline</p>
                    <p className="text-lg font-bold text-sky-300 mt-0.5">{formatCurrency(totalQuotationValue)}</p>
                  </div>
                </div>
              </div>

              {/* Scrollable Detail Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Contact & Address Section */}
                <div className="rounded-xl border border-slate-200/80 p-5 bg-slate-50/50 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#0284c7]" />
                    Customer Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-1">Phone / Mobile</span>
                      <a
                        href={`tel:${selectedCustomer.mobile}`}
                        className="font-semibold text-slate-800 hover:text-[#0284c7] flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {selectedCustomer.mobile || '—'}
                      </a>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">Email Address</span>
                      {selectedCustomer.email ? (
                        <a
                          href={`mailto:${selectedCustomer.email}`}
                          className="font-semibold text-slate-800 hover:text-[#0284c7] flex items-center gap-1.5 truncate"
                        >
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{selectedCustomer.email}</span>
                        </a>
                      ) : (
                        <span className="text-slate-500">Not provided</span>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">Customer Classification</span>
                      <span className="font-semibold text-slate-800 uppercase">
                        {selectedCustomer.customer_type || 'INDIVIDUAL'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">Pincode / Postal</span>
                      <span className="font-semibold text-slate-800">
                        {selectedCustomer.pincode || '—'}
                      </span>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block mb-1">Address & City</span>
                      <p className="font-semibold text-slate-800 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>
                          {[
                            selectedCustomer.address,
                            selectedCustomer.city,
                            selectedCustomer.state,
                            selectedCustomer.pincode,
                          ]
                            .filter(Boolean)
                            .join(', ') || 'No address registered'}
                        </span>
                      </p>
                    </div>

                    {selectedCustomer.notes && (
                      <div className="sm:col-span-2 pt-2 border-t border-slate-200/60">
                        <span className="text-slate-400 block mb-1">Notes / Remarks</span>
                        <p className="text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-200">
                          {selectedCustomer.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Created: {selectedCustomer.created_at ? formatDate(selectedCustomer.created_at) : '—'}
                    </span>
                    {selectedCustomer.updated_at && (
                      <span>Updated: {formatDate(selectedCustomer.updated_at)}</span>
                    )}
                  </div>
                </div>

                {/* Linked Quotations Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-[#0284c7]" />
                      <span>Quotations ({linkedQuotations.length})</span>
                    </h3>
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/quotations/new?customerId=${selectedCustomer.id}`)}
                      className="text-xs h-8 px-2.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Quote</span>
                    </Button>
                  </div>

                  {linkedQuotations.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      No quotations generated for this client yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {linkedQuotations.map((q) => (
                        <div
                          key={q.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-all text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">{q.quotationNumber || q.id}</span>
                            <span className="text-slate-400 ml-2">
                              {q.quotationDate ? formatDate(q.quotationDate) : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-slate-800">
                              {formatCurrency(q.grandTotal)}
                            </span>
                            <button
                              type="button"
                              onClick={() => navigate(`/quotations/${q.id}`)}
                              className="text-[#0284c7] hover:underline font-semibold flex items-center gap-0.5"
                            >
                              Open <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Linked Projects Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#0284c7]" />
                    <span>Projects ({linkedProjects.length})</span>
                  </h3>

                  {linkedProjects.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      No projects linked with this customer yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {linkedProjects.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-all text-xs"
                        >
                          <div>
                            <p className="font-semibold text-slate-800">{p.name}</p>
                            <p className="text-slate-400 text-[11px]">{p.siteAddress || 'No site specified'}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigate(`/projects/${p.id}`)}
                            className="text-[#0284c7] hover:underline font-semibold flex items-center gap-0.5"
                          >
                            Open <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Detail Panel Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <Button variant="secondary" onClick={handleCloseDetail}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setEditingCustomer(selectedCustomer);
                    setIsFormOpen(true);
                  }}
                  className="bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center gap-1.5"
                >
                  <Pencil className="w-4 h-4" />
                  Edit Customer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Create & Edit Drawer (Right-side slide-over) */}
      <CustomerFormDrawer
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        editing={editingCustomer}
        onSaved={async (savedCustomer) => {
          await loadCustomers();
          if (selectedCustomer?.id === savedCustomer?.id) {
            setSelectedCustomer(savedCustomer);
          }
        }}
      />
    </div>
  );
}

/**
 * Customer Create and Edit Drawer Form (Opens on the right side)
 * Connects to:
 * - POST /api/v1/customers (Create)
 * - PUT /api/v1/customers/{customer_id} (Update)
 */
export function CustomerFormDrawer({ open, onClose, editing, onSaved }) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      mobile: '',
      email: '',
      customer_type: 'INDIVIDUAL',
      address: '',
      city: '',
      state: '',
      pincode: '',
      notes: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (editing) {
      reset({
        name: editing.name || '',
        mobile: editing.mobile || '',
        email: editing.email || '',
        customer_type: (editing.customer_type || editing.type || 'INDIVIDUAL').toUpperCase(),
        address: editing.address || '',
        city: editing.city || '',
        state: editing.state || '',
        pincode: editing.pincode || '',
        notes: editing.notes || '',
        is_active: editing.is_active ?? true,
      });
    } else {
      reset({
        name: '',
        mobile: '',
        email: '',
        customer_type: 'INDIVIDUAL',
        address: '',
        city: '',
        state: '',
        pincode: '',
        notes: '',
        is_active: true,
      });
    }
  }, [editing, reset, open]);

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      let saved;
      if (editing?.id) {
        // PUT /api/v1/customers/{customer_id}
        saved = await customerService.update(editing.id, values);
        toast('Customer updated successfully!', 'success');
      } else {
        // POST /api/v1/customers
        saved = await customerService.create(values);
        toast('Customer created successfully!', 'success');
      }
      onClose();
      if (onSaved) {
        await onSaved(saved);
      }
    } catch (err) {
      const errorMsg = extractErrorMessage(err, 'Failed to save customer');
      toast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-[#07192F] via-[#0B2545] to-[#12365F] text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-white/10 text-sky-200 border border-white/15 uppercase">
                  {editing ? 'Update Customer' : 'New Customer'}
                </span>
                <h2 className="text-xl font-bold tracking-tight text-white mt-1.5">
                  {editing ? `Edit ${editing.name}` : 'Register New Customer'}
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  {editing
                    ? 'Modify client contact information, location, and account status.'
                    : 'Enter customer details to register into the MK Construction directory.'}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Form Content - Scrollable Body */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col justify-between overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Customer Name"
                  required
                  placeholder="e.g. Ramesh Patel"
                  error={errors.name?.message}
                  {...register('name', { required: 'Customer name is required' })}
                />

                <Input
                  label="Mobile Number"
                  required
                  placeholder="e.g. 9845012345"
                  error={errors.mobile?.message}
                  {...register('mobile', {
                    required: 'Mobile number is required',
                    validate: (v) => isValidMobile(v) || 'Please enter a valid mobile number',
                  })}
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@example.com"
                  error={errors.email?.message}
                  {...register('email', {
                    validate: (v) => !v || isValidEmail(v) || 'Please enter a valid email address',
                  })}
                />

                <Select
                  label="Customer Type"
                  {...register('customer_type')}
                >
                  {CUSTOMER_TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>

                <div className="sm:col-span-2">
                  <Input
                    label="Street Address"
                    placeholder="e.g. Flat 402, Green Valley Apartments"
                    {...register('address')}
                  />
                </div>

                <Input
                  label="City"
                  placeholder="e.g. Bengaluru"
                  {...register('city')}
                />

                <Input
                  label="State"
                  placeholder="e.g. Karnataka"
                  {...register('state')}
                />

                <Input
                  label="Pincode"
                  placeholder="e.g. 560001"
                  {...register('pincode')}
                />

                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="drawer_is_active"
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-[#0284c7] focus:ring-[#0284c7] cursor-pointer"
                    {...register('is_active')}
                  />
                  <label htmlFor="drawer_is_active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Active Customer Account
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <Textarea
                    label="Notes / Special Instructions"
                    rows={3}
                    placeholder="Any additional client specifications, preferences, or payment terms..."
                    {...register('notes')}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <Button variant="secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#0284c7] hover:bg-[#0369a1] text-white min-w-[130px] flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : editing ? (
                  'Update Customer'
                ) : (
                  'Create Customer'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export const CustomerFormModal = CustomerFormDrawer;
