import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/cards/Card';
import { SearchInput } from '../../components/common/SearchInput';
import { DataTable } from '../../components/tables/DataTable';
import { Pagination } from '../../components/common/Pagination';
import { Input, Select, Textarea, DatePicker } from '../../components/forms/Fields';
import { EmptyState, LoadingSkeleton } from '../../components/common/States';
import { projectService, normalizeProject } from '../../services/api/projectService';
import { customerService } from '../../services/api/customerService';
import { quotationService } from '../../services/api/quotationService';
import { formatCurrency, formatDate, formatDateInput, formatNumber, cn } from '../../utils/formatting';
import { toast, useUiStore } from '../../store/uiStore';
import { extractErrorMessage } from '../../services/api/authService';
import { useForm } from 'react-hook-form';
import {
  Building2,
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  Eye,
  X,
  MapPin,
  Calendar,
  Layers,
  Ruler,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  User,
  Phone,
  Mail,
  FileSpreadsheet,
  Hammer,
  FilterX,
  Maximize2,
} from 'lucide-react';

const PROJECT_STATUS_OPTIONS = [
  { value: 'PLANNING', label: 'Planning', badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/80', dotClass: 'bg-sky-500' },
  { value: 'IN_PROGRESS', label: 'In Progress', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80', dotClass: 'bg-amber-500 animate-pulse' },
  { value: 'COMPLETED', label: 'Completed', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dotClass: 'bg-emerald-500' },
  { value: 'ON_HOLD', label: 'On Hold', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200', dotClass: 'bg-slate-400' },
];

const FLOOR_TYPE_OPTIONS = [
  { value: 'Ground', label: 'Ground Floor (G)', floors: 1 },
  { value: 'G+1', label: 'Ground + 1 Floor (G+1)', floors: 2 },
  { value: 'G+2', label: 'Ground + 2 Floors (G+2)', floors: 3 },
  { value: 'G+3', label: 'Ground + 3 Floors (G+3)', floors: 4 },
  { value: 'G+4', label: 'Ground + 4 Floors (G+4)', floors: 5 },
  { value: 'Duplex', label: 'Duplex Villa', floors: 2 },
  { value: 'Triplex', label: 'Triplex Villa', floors: 3 },
  { value: 'Commercial', label: 'Commercial Complex', floors: 3 },
  { value: 'Custom', label: 'Custom Structure', floors: 1 },
];

export function getStatusConfig(status = '') {
  const normalized = String(status).toUpperCase().replace(/\s+/g, '_');
  return (
    PROJECT_STATUS_OPTIONS.find((s) => s.value === normalized) || {
      value: normalized,
      label: status || 'Planning',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      dotClass: 'bg-slate-400',
    }
  );
}

export default function ProjectsPage() {
  const { id: routeProjectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const openConfirm = useUiStore((s) => s.openConfirm);

  // Data states
  const [projects, setProjects] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [customers, setCustomers] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Search & Filter states
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [customerFilter, setCustomerFilter] = useState('ALL');
  const [floorFilter, setFloorFilter] = useState('ALL');

  // Detail & Form Drawer states
  const [selectedProject, setSelectedProject] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  // Customer fast lookup dictionary
  const customerMap = useMemo(() => {
    const map = new Map();
    customers.forEach((c) => {
      map.set(String(c.id), c);
    });
    return map;
  }, [customers]);

  // Load registered customers for mapping and dropdown selectors
  useEffect(() => {
    let isMounted = true;
    customerService
      .getAll()
      .then((data) => {
        if (isMounted) setCustomers(Array.isArray(data) ? data : []);
      })
      .catch(() => {});

    quotationService
      .getAll()
      .then((data) => {
        if (isMounted) setQuotations(Array.isArray(data) ? data : []);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch project list from API: GET /api/v1/projects
  const loadProjects = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await projectService.list({
          page,
          page_size: pageSize,
          search: q,
          customer_id: customerFilter !== 'ALL' ? customerFilter : null,
          status: statusFilter !== 'ALL' ? statusFilter : null,
          sort_by: 'created_at',
          sort_order: 'desc',
        });

        let items = res.items || [];
        // Apply client floor filter if specified
        if (floorFilter !== 'ALL') {
          items = items.filter((p) => (p.floor_type || p.floors) === floorFilter);
        }

        setProjects(items);
        setTotalCount(res.total ?? items.length);
        setTotalPages(res.total_pages ?? Math.max(1, Math.ceil((res.total || 0) / pageSize)));
      } catch (err) {
        toast(extractErrorMessage(err, 'Failed to load projects from server'), 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, pageSize, q, customerFilter, statusFilter, floorFilter]
  );

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Calculate quick summary metrics
  const stats = useMemo(() => {
    let planning = 0;
    let inProgress = 0;
    let completed = 0;
    let onHold = 0;
    let totalBuiltArea = 0;

    projects.forEach((p) => {
      const st = (p.status || '').toUpperCase().replace(/\s+/g, '_');
      if (st === 'PLANNING') planning++;
      else if (st === 'IN_PROGRESS') inProgress++;
      else if (st === 'COMPLETED') completed++;
      else if (st === 'ON_HOLD') onHold++;

      const area = Number(p.construction_area || p.constructionArea || 0);
      if (Number.isFinite(area)) totalBuiltArea += area;
    });

    return {
      total: totalCount || projects.length,
      planning,
      inProgress,
      completed,
      onHold,
      totalBuiltArea,
    };
  }, [projects, totalCount]);

  // Handle opening project detail drawer
  const handleOpenDetail = useCallback(
    async (projectId, initialData = null) => {
      const local = initialData || projects.find((p) => String(p.id) === String(projectId));
      if (local) {
        setSelectedProject(local);
      } else {
        setSelectedProject({ id: projectId, project_name: 'Loading project...', name: 'Loading...' });
      }
      setLoadingDetail(true);

      try {
        const fullData = await projectService.getById(projectId);
        if (fullData) {
          setSelectedProject((prev) => ({ ...prev, ...fullData }));
        }
      } catch (err) {
        if (!local) {
          toast(extractErrorMessage(err, 'Project details not found'), 'error');
          setSelectedProject(null);
        }
      } finally {
        setLoadingDetail(false);
      }
    },
    [projects]
  );

  // Sync route param `/projects/:id` or query param `?id=` with detail drawer
  useEffect(() => {
    const targetId = routeProjectId || searchParams.get('id');
    if (targetId) {
      handleOpenDetail(targetId);
    }
  }, [routeProjectId, searchParams, handleOpenDetail]);

  const handleCloseDetail = () => {
    setSelectedProject(null);
    if (routeProjectId) {
      navigate('/projects', { replace: true });
    } else if (searchParams.get('id')) {
      searchParams.delete('id');
      setSearchParams(searchParams, { replace: true });
    }
  };

  // Delete project with API: DELETE /api/v1/projects/{project_id}
  const handleDeleteProject = (proj) => {
    openConfirm({
      title: 'Delete Project',
      message: `Are you sure you want to delete "${proj.project_name || proj.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete Project',
      danger: true,
      onConfirm: async () => {
        try {
          await projectService.delete(proj.id);
          toast('Project deleted successfully!', 'success');
          if (selectedProject?.id === proj.id) {
            handleCloseDetail();
          }
          loadProjects();
        } catch (err) {
          toast(extractErrorMessage(err, 'Failed to delete project'), 'error');
        }
      },
    });
  };

  // Check if any filter is actively applied
  const hasActiveFilters = q || statusFilter !== 'ALL' || customerFilter !== 'ALL' || floorFilter !== 'ALL';

  const resetFilters = () => {
    setQ('');
    setStatusFilter('ALL');
    setCustomerFilter('ALL');
    setFloorFilter('ALL');
    setPage(1);
  };

  // Get customer object for selected project in detail view
  const selectedCustomer = useMemo(() => {
    if (!selectedProject) return null;
    return (
      customerMap.get(String(selectedProject.customer_id || selectedProject.customerId)) ||
      selectedProject.customer ||
      null
    );
  }, [selectedProject, customerMap]);

  // Linked quotations for selected project
  const linkedQuotations = useMemo(() => {
    if (!selectedProject) return [];
    const pId = String(selectedProject.id);
    return quotations.filter(
      (q) => String(q.project?.id) === pId || String(q.projectId) === pId
    );
  }, [selectedProject, quotations]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        eyebrow="Operations"
        title="Projects"
        description="Active construction sites, structural specifications, site measurements, and client assignments."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadProjects(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh project list"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 text-slate-500', (refreshing || loading) && 'animate-spin')} />
              <span>Refresh</span>
            </button>
            <Button
              onClick={() => {
                setEditingProject(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-2 bg-[#0284c7] hover:bg-[#0369a1] text-white"
            >
              <Plus className="h-4 w-4" />
              <span>Add Project</span>
            </Button>
          </div>
        }
      />

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Projects */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Total Projects</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900">{stats.total}</span>
              <span className="text-[11px] text-slate-400 font-medium">registered</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-sky-50 text-[#0284c7] flex items-center justify-center border border-sky-100">
            <Briefcase className="w-4 h-4" />
          </div>
        </div>

        {/* Planning Stage */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">In Planning</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-sky-600">{stats.planning}</span>
              <span className="text-[11px] text-sky-600/80 font-medium">estimates</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">In Progress</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-amber-600">{stats.inProgress}</span>
              <span className="text-[11px] text-amber-600/80 font-medium">active sites</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Hammer className="w-4 h-4" />
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Completed</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-emerald-600">{stats.completed}</span>
              <span className="text-[11px] text-emerald-600/80 font-medium">delivered</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Total Built-up Area */}
        <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-xl border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Total Built-Up</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-800">
                {formatNumber(stats.totalBuiltArea, 0)}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">sqft</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Ruler className="w-4 h-4" />
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
              onChange={(val) => {
                setQ(val);
                setPage(1);
              }}
              placeholder="Search by project name, address, or code..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Customer Filter */}
            <select
              value={customerFilter}
              onChange={(e) => {
                setCustomerFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 text-xs font-medium rounded-xl border border-slate-200 bg-white px-3 text-slate-700 hover:border-slate-300 focus:border-[#0284c7] focus:outline-none cursor-pointer max-w-[170px]"
            >
              <option value="ALL">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 text-xs font-medium rounded-xl border border-slate-200 bg-white px-3 text-slate-700 hover:border-slate-300 focus:border-[#0284c7] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              {PROJECT_STATUS_OPTIONS.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>

            {/* Floor Type Filter */}
            <select
              value={floorFilter}
              onChange={(e) => {
                setFloorFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 text-xs font-medium rounded-xl border border-slate-200 bg-white px-3 text-slate-700 hover:border-slate-300 focus:border-[#0284c7] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Floors</option>
              {FLOOR_TYPE_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
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
              rows={projects}
              showPagination={false}
              empty={
                <EmptyState
                  title="No projects found"
                  description={
                    hasActiveFilters
                      ? 'No projects matched your search criteria. Try resetting filters.'
                      : 'Create your first project site to begin generating accurate construction quotations.'
                  }
                  actionLabel="Add Project"
                  onAction={() => {
                    setEditingProject(null);
                    setIsFormOpen(true);
                  }}
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
                  key: 'project_code',
                  header: 'Code',
                  headerClassName: 'w-24',
                  className: 'w-24',
                  render: (r) => (
                    <span className="font-mono text-xs font-semibold text-[#0284c7] bg-sky-50 px-2 py-0.5 rounded border border-sky-100/90 whitespace-nowrap">
                      {r.project_code || `PRJ-${String(r.id).padStart(3, '0')}`}
                    </span>
                  ),
                },
                {
                  key: 'project_name',
                  header: 'Project Name',
                  sortable: true,
                  render: (r) => (
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(r.id, r)}
                      className="text-left font-semibold text-slate-800 hover:text-[#0284c7] transition-colors flex items-center gap-1.5 group cursor-pointer"
                    >
                      <span>{r.project_name || r.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </button>
                  ),
                },
                {
                  key: 'customer',
                  header: 'Customer',
                  render: (r) => {
                    const cust = customerMap.get(String(r.customer_id || r.customerId));
                    const name = cust?.name || r.customer_name || (r.customer_id ? `Customer #${r.customer_id}` : '—');
                    return (
                      <div className="flex items-center gap-1.5 text-xs">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700 truncate max-w-[150px]">{name}</span>
                      </div>
                    );
                  },
                },
                {
                  key: 'site_address',
                  header: 'Site Address',
                  render: (r) => {
                    const address = r.site_address || r.siteAddress;
                    return address ? (
                      <div className="flex items-start gap-1 text-xs text-slate-600 max-w-[220px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="truncate">{address}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    );
                  },
                },
                {
                  key: 'areas',
                  header: 'Area & Floors',
                  render: (r) => {
                    const plot = Number(r.plot_area ?? r.plotArea) || 0;
                    const built = Number(r.construction_area ?? r.constructionArea) || 0;
                    const floor = r.floor_type || r.floors || 'G+1';

                    return (
                      <div className="text-xs">
                        <span className="font-semibold text-slate-800">
                          {built ? `${built.toLocaleString('en-IN')} sqft` : '—'}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {floor} {plot ? `• ${plot.toLocaleString('en-IN')} plot` : ''}
                        </span>
                      </div>
                    );
                  },
                },
                {
                  key: 'start_date',
                  header: 'Start Date',
                  render: (r) => {
                    const dateVal = r.start_date || r.startDate;
                    return dateVal ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{formatDate(dateVal)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    );
                  },
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (r) => {
                    const cfg = getStatusConfig(r.status);
                    return (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md border whitespace-nowrap',
                          cfg.badgeClass
                        )}
                      >
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dotClass)} />
                        {cfg.label}
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
                        title="View Project Details"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700 border border-sky-100 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProject(r);
                          setIsFormOpen(true);
                        }}
                        title="Edit Project"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 border border-amber-100 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(r);
                        }}
                        title="Delete Project"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 border border-rose-100 transition-all hover:scale-105 active:scale-95 cursor-pointer"
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

        {/* Server-Side Pagination Component Integration */}
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

      {/* Slide-over Project Detail Panel (Master-Detail View) */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
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
                        {selectedProject.project_code || `PRJ-${String(selectedProject.id).padStart(3, '0')}`}
                      </span>
                      {(() => {
                        const cfg = getStatusConfig(selectedProject.status);
                        return (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded border',
                              cfg.badgeClass
                            )}
                          >
                            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dotClass)} />
                            {cfg.label}
                          </span>
                        );
                      })()}
                      {loadingDetail && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-sky-200 bg-sky-500/20 px-2 py-0.5 rounded border border-sky-400/30">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          Syncing
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight capitalize text-white">
                      {selectedProject.project_name || selectedProject.name}
                    </h2>

                    <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                      <span className="truncate">{selectedProject.site_address || selectedProject.siteAddress || 'No site address provided'}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProject(selectedProject);
                        setIsFormOpen(true);
                      }}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                      title="Edit Project"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(selectedProject)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-rose-500/30 text-rose-300 hover:text-white transition-colors cursor-pointer"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseDetail}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Metrics Highlights Bar */}
                <div className="grid grid-cols-4 gap-2.5 mt-6 pt-5 border-t border-white/10 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-slate-400 font-medium text-[11px]">Plot Area</p>
                    <p className="text-base font-bold text-white mt-0.5">
                      {Number(selectedProject.plot_area ?? selectedProject.plotArea ?? 0).toLocaleString('en-IN')}{' '}
                      <span className="text-[10px] font-normal text-slate-300">sqft</span>
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-slate-400 font-medium text-[11px]">Built-Up</p>
                    <p className="text-base font-bold text-sky-300 mt-0.5">
                      {Number(selectedProject.construction_area ?? selectedProject.constructionArea ?? 0).toLocaleString('en-IN')}{' '}
                      <span className="text-[10px] font-normal text-sky-200">sqft</span>
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-slate-400 font-medium text-[11px]">Floors</p>
                    <p className="text-base font-bold text-white mt-0.5">
                      {selectedProject.floor_type || selectedProject.floors || 'G+1'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-slate-400 font-medium text-[11px]">Start Date</p>
                    <p className="text-xs font-bold text-white mt-1 truncate">
                      {selectedProject.start_date || selectedProject.startDate ? formatDate(selectedProject.start_date || selectedProject.startDate) : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Site Specifications Card */}
                <div className="rounded-xl border border-slate-200/80 p-5 bg-slate-50/50 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#0284c7]" />
                    Site Specifications
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-1">Project Name</span>
                      <span className="font-semibold text-slate-800">
                        {selectedProject.project_name || selectedProject.name}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">Project Code</span>
                      <span className="font-mono font-semibold text-[#0284c7]">
                        {selectedProject.project_code || `PRJ-${String(selectedProject.id).padStart(3, '0')}`}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">Floor Configuration</span>
                      <span className="font-semibold text-slate-800">
                        {selectedProject.floor_type || selectedProject.floors || 'G+1'} (
                        {selectedProject.number_of_floors || 1} level
                        {(selectedProject.number_of_floors || 1) > 1 ? 's' : ''})
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">Target Start Date</span>
                      <span className="font-semibold text-slate-800">
                        {selectedProject.start_date || selectedProject.startDate
                          ? formatDate(selectedProject.start_date || selectedProject.startDate)
                          : 'Not scheduled'}
                      </span>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block mb-1">Site Address</span>
                      <p className="font-semibold text-slate-800 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{selectedProject.site_address || selectedProject.siteAddress || 'No address registered'}</span>
                      </p>
                    </div>

                    {selectedProject.notes && (
                      <div className="sm:col-span-2 pt-2 border-t border-slate-200/60">
                        <span className="text-slate-400 block mb-1">Project Notes & Remarks</span>
                        <p className="text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-200 whitespace-pre-wrap">
                          {selectedProject.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Created: {selectedProject.created_at ? formatDate(selectedProject.created_at) : '—'}
                    </span>
                    {selectedProject.updated_at && (
                      <span>Updated: {formatDate(selectedProject.updated_at)}</span>
                    )}
                  </div>
                </div>

                {/* Assigned Customer Card */}
                <div className="rounded-xl border border-slate-200/80 p-5 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#0284c7]" />
                      Assigned Customer
                    </h3>
                    {selectedCustomer && (
                      <button
                        type="button"
                        onClick={() => navigate(`/customers?id=${selectedCustomer.id}`)}
                        className="text-xs font-semibold text-[#0284c7] hover:underline flex items-center gap-1"
                      >
                        <span>View Customer</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {selectedCustomer ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Customer Name</span>
                        <span className="font-semibold text-slate-800 text-sm">
                          {selectedCustomer.name}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-0.5">Customer Code</span>
                        <span className="font-mono font-semibold text-slate-700">
                          {selectedCustomer.customer_code || `CUST-${String(selectedCustomer.id).padStart(3, '0')}`}
                        </span>
                      </div>

                      {selectedCustomer.mobile && (
                        <div>
                          <span className="text-slate-400 block mb-0.5">Mobile</span>
                          <a
                            href={`tel:${selectedCustomer.mobile}`}
                            className="font-medium text-slate-700 hover:text-[#0284c7] flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            {selectedCustomer.mobile}
                          </a>
                        </div>
                      )}

                      {selectedCustomer.email && (
                        <div>
                          <span className="text-slate-400 block mb-0.5">Email</span>
                          <a
                            href={`mailto:${selectedCustomer.email}`}
                            className="font-medium text-slate-700 hover:text-[#0284c7] flex items-center gap-1 truncate"
                          >
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{selectedCustomer.email}</span>
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      Customer ID #{selectedProject.customer_id || selectedProject.customerId || 'N/A'} (Not cached locally)
                    </p>
                  )}
                </div>

                {/* Linked Quotations Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-[#0284c7]" />
                      <span>Linked Quotations ({linkedQuotations.length})</span>
                    </h3>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        navigate(
                          `/quotations/new?projectId=${selectedProject.id}&customerId=${selectedProject.customer_id || ''}`
                        )
                      }
                      className="text-xs h-8 px-2.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Quotation</span>
                    </Button>
                  </div>

                  {linkedQuotations.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      No quotations generated for this project site yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {linkedQuotations.map((q) => (
                        <div
                          key={q.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-all text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">
                              {q.quotationNumber || q.id}
                            </span>
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
                              className="text-[#0284c7] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                            >
                              Open <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
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
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      setEditingProject(selectedProject);
                      setIsFormOpen(true);
                    }}
                    className="bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center gap-1.5"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit Project
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Create & Edit Drawer Form */}
      <ProjectFormDrawer
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        editing={editingProject}
        customers={customers}
        onSaved={async (saved) => {
          await loadProjects();
          if (selectedProject?.id === saved?.id) {
            setSelectedProject(saved);
          }
        }}
      />
    </div>
  );
}

/**
 * Slide-over drawer form for Creating and Editing Projects.
 * Handles endpoints:
 * - POST /api/v1/projects (Create)
 * - PUT /api/v1/projects/{project_id} (Update)
 */
export function ProjectFormDrawer({ open, onClose, editing, customers = [], onSaved }) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      customer_id: '',
      project_name: '',
      site_address: '',
      plot_area: '',
      construction_area: '',
      floor_type: 'G+1',
      number_of_floors: 2,
      start_date: formatDateInput(new Date()),
      status: 'PLANNING',
      notes: '',
    },
  });

  const selectedFloorType = watch('floor_type');

  // Automatically adjust default number of floors when floor type is chosen
  const handleFloorTypeChange = (e) => {
    const val = e.target.value;
    setValue('floor_type', val);
    const matched = FLOOR_TYPE_OPTIONS.find((f) => f.value === val);
    if (matched && matched.floors) {
      setValue('number_of_floors', matched.floors);
    }
  };

  useEffect(() => {
    if (editing) {
      const p = normalizeProject(editing);
      reset({
        customer_id: p.customer_id || p.customerId || (customers[0]?.id ?? ''),
        project_name: p.project_name || p.name || '',
        site_address: p.site_address || p.siteAddress || '',
        plot_area: p.plot_area ?? p.plotArea ?? '',
        construction_area: p.construction_area ?? p.constructionArea ?? '',
        floor_type: p.floor_type || p.floors || 'G+1',
        number_of_floors: p.number_of_floors ?? p.numberOfFloors ?? 2,
        start_date: formatDateInput(p.start_date || p.startDate || new Date()),
        status: (p.status || 'PLANNING').toUpperCase().replace(/\s+/g, '_'),
        notes: p.notes || '',
      });
    } else {
      reset({
        customer_id: customers[0]?.id ? String(customers[0].id) : '',
        project_name: '',
        site_address: '',
        plot_area: '',
        construction_area: '',
        floor_type: 'G+1',
        number_of_floors: 2,
        start_date: formatDateInput(new Date()),
        status: 'PLANNING',
        notes: '',
      });
    }
  }, [editing, customers, reset, open]);

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      let saved;
      if (editing?.id) {
        // PUT /api/v1/projects/{project_id}
        saved = await projectService.update(editing.id, values);
        toast('Project updated successfully!', 'success');
      } else {
        // POST /api/v1/projects
        saved = await projectService.create(values);
        toast('Project created successfully!', 'success');
      }
      onClose();
      if (onSaved) {
        await onSaved(saved);
      }
    } catch (err) {
      const errorMsg = extractErrorMessage(err, 'Failed to save project');
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
                  {editing ? 'Update Site' : 'New Project'}
                </span>
                <h2 className="text-xl font-bold tracking-tight text-white mt-1.5">
                  {editing ? `Edit ${editing.project_name || editing.name}` : 'Create Construction Project'}
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  {editing
                    ? 'Update site dimensions, structural specifications, and target completion schedule.'
                    : 'Register project parameters to drive automated construction estimates and bill of quantities.'}
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
              {/* Customer Selection */}
              <div className="space-y-1">
                <Select
                  label="Assigned Customer"
                  required
                  error={errors.customer_id?.message}
                  {...register('customer_id', {
                    required: 'Please select a customer for this project',
                  })}
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customer_code || `CUST-${c.id}`})
                    </option>
                  ))}
                </Select>
                {customers.length === 0 && (
                  <p className="text-[11px] text-amber-600">
                    No customers found. Please add a customer first under the Customers section.
                  </p>
                )}
              </div>

              {/* Project Name */}
              <Input
                label="Project Name"
                required
                placeholder="e.g. Skyline Heights Villa, Ramesh Residence"
                error={errors.project_name?.message}
                {...register('project_name', {
                  required: 'Project name is required',
                })}
              />

              {/* Site Address */}
              <Textarea
                label="Site Address"
                required
                rows={2}
                placeholder="Plot / Site No, Street, Layout, Landmark, City..."
                error={errors.site_address?.message}
                {...register('site_address', {
                  required: 'Site address is required',
                })}
              />

              {/* Plot Area & Construction Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Plot Area (sqft)"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 1200"
                  error={errors.plot_area?.message}
                  {...register('plot_area', {
                    valueAsNumber: true,
                    min: { value: 0, message: 'Must be positive' },
                  })}
                />

                <Input
                  label="Built-Up Area (sqft)"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 2400"
                  error={errors.construction_area?.message}
                  {...register('construction_area', {
                    valueAsNumber: true,
                    min: { value: 0, message: 'Must be positive' },
                  })}
                />
              </div>

              {/* Floor Type & Number of Floors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Floor Type"
                  value={selectedFloorType}
                  onChange={handleFloorTypeChange}
                >
                  {FLOOR_TYPE_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Total Number of Floors"
                  type="number"
                  min="1"
                  max="50"
                  placeholder="e.g. 2"
                  error={errors.number_of_floors?.message}
                  {...register('number_of_floors', {
                    valueAsNumber: true,
                    min: { value: 1, message: 'At least 1 floor' },
                  })}
                />
              </div>

              {/* Target Start Date & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DatePicker
                  label="Target Start Date"
                  error={errors.start_date?.message}
                  {...register('start_date')}
                />

                <Select
                  label="Project Status"
                  error={errors.status?.message}
                  {...register('status')}
                >
                  {PROJECT_STATUS_OPTIONS.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Notes */}
              <Textarea
                label="Site Notes & Specifications"
                rows={3}
                placeholder="Soil conditions, setback requirements, client special requests, architectural notes..."
                {...register('notes')}
              />
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
                  'Update Project'
                ) : (
                  'Create Project'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export const ProjectFormModal = ProjectFormDrawer;
