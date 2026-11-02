import { useCallback, useEffect, useState } from 'react';
import { Briefcase, MapPin, Search } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/common/States';
import { extractErrorMessage } from '../../services/api/authService';
import {
  PORTFOLIO_STATUSES,
  PORTFOLIO_TYPES,
  portfolioService,
} from '../../services/api/portfolioService';

const TYPE_LABELS = {
  RESIDENTIAL: 'Residential',
  COMMERCIAL: 'Commercial',
  INDUSTRIAL: 'Industrial',
  RENOVATION: 'Renovation',
  OTHER: 'Other',
};

const STATUS_LABELS = {
  PLANNED: 'Planned',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  SHOWCASE: 'Showcase',
};

function formatLabel(value, map) {
  return map[value] || value || '—';
}

export default function SitePortfolioPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await portfolioService.list({
        page,
        page_size: 20,
        search,
        type,
        status,
        sort_by: 'display_order',
        sort_order: 'asc',
      });
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      setItems([]);
      setTotal(0);
      setError(extractErrorMessage(err, 'Unable to load portfolio projects.'));
    } finally {
      setLoading(false);
    }
  }, [page, search, type, status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, type, status]);

  return (
    <div>
      <PageHeader
        title="Portfolio"
        description="Published construction projects shown on the public website."
      />

      <section aria-label="Portfolio projects">
        <div className="mb-4 flex flex-col gap-3 border-y border-line py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              aria-label="Filter by type"
              className="h-9 rounded-lg border border-line bg-white px-3 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            >
              <option value="">All types</option>
              {PORTFOLIO_TYPES.map((value) => (
                <option key={value} value={value}>
                  {TYPE_LABELS[value]}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter by status"
              className="h-9 rounded-lg border border-line bg-white px-3 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            >
              <option value="">All statuses</option>
              {PORTFOLIO_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </select>
            <span className="text-xs text-faint">{total} published</span>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search portfolio"
              aria-label="Search portfolio"
              className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
          </label>
        </div>

        {loading ? (
          <LoadingSkeleton rows={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : items.length ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((project) => (
                <article key={project.id} className="overflow-hidden rounded-lg border border-line bg-white">
                  <div className="relative aspect-[16/10] overflow-hidden bg-surface">
                    {project.main_image?.url ? (
                      <img
                        src={project.main_image.url}
                        alt={project.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-faint">
                        <Briefcase className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-3.5">
                    <h2 className="truncate text-sm font-semibold text-ink">{project.name}</h2>
                    <p className="mt-1 flex items-center gap-1 text-[13px] text-muted">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-faint" />
                      <span className="truncate">{project.location || 'Location not set'}</span>
                    </p>
                    <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs">
                      <span className="text-muted">{formatLabel(project.type, TYPE_LABELS)}</span>
                      <span className="rounded bg-surface px-2 py-1 font-medium text-ink">
                        {formatLabel(project.status, STATUS_LABELS)}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="h-9 rounded-lg border border-line px-3 text-[13px] font-medium text-ink disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-faint">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="h-9 rounded-lg border border-line px-3 text-[13px] font-medium text-ink disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState
            icon={Briefcase}
            title="No published portfolio projects"
            description="Published projects from the website CMS will appear here."
          />
        )}
      </section>
    </div>
  );
}
