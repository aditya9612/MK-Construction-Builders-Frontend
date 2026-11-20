import { useState } from 'react';
import {
  Star,
  MapPin,
  Building2,
  Calendar,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  Globe,
  Laptop,
  PenTool,
  User,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState, LoadingSkeleton } from '../../components/common/States';
import { Pagination } from '../../components/tables/Pagination';
import { formatDate, initials } from '../../utils/formatting';

export function StarRating({ rating = 0, size = 'sm' }) {
  const num = Math.min(Math.max(Number(rating) || 0, 0), 5);
  const iconSize = size === 'lg' ? 'h-5 w-5' : size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`${iconSize} ${
              i <= num
                ? 'fill-amber-400 text-amber-400'
                : 'fill-slate-100 text-slate-300'
            }`}
          />
        ))}
      </div>
      <span className="ml-1 text-xs font-bold text-slate-700">{num.toFixed(1)}</span>
    </div>
  );
}

export function SourceBadge({ source }) {
  const s = String(source || 'website').toLowerCase();

  if (s === 'google') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
        <Globe className="h-3 w-3 text-blue-600" />
        Google
      </span>
    );
  }

  if (s === 'website') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
        <Laptop className="h-3 w-3 text-sky-600" />
        Website
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
      <PenTool className="h-3 w-3 text-slate-500" />
      Manual
    </span>
  );
}

export function PublicationBadge({ isPublished }) {
  if (isPublished) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
        Published
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
      <Clock className="h-3 w-3 text-amber-600" />
      Pending
    </span>
  );
}

export function FeaturedBadge({ isFeatured }) {
  if (isFeatured) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
        <Sparkles className="h-3 w-3 text-purple-600" />
        Featured
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
      Standard
    </span>
  );
}

function CustomerAvatar({ name, photoUrl }) {
  const [imgError, setImgError] = useState(false);

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={name || 'Customer'}
        onError={() => setImgError(true)}
        className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover shadow-xs"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sky-100 bg-gradient-to-tr from-brand-navy to-brand text-xs font-bold text-white shadow-xs">
      {name ? initials(name) : <User className="h-4 w-4" />}
    </div>
  );
}

export function FeedbackTable({
  items = [],
  loading = false,
  page = 1,
  pageSize = 10,
  total = 0,
  totalPages = 1,
  onPageChange,
  onPageSizeChange,
  onViewDetails,
  onClearFilters,
  hasActiveFilters = false,
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xs">
        <EmptyState
          title="No customer feedback found"
          description={
            hasActiveFilters
              ? 'No feedback matches the selected filters. Try clearing filters or altering search keywords.'
              : 'There are currently no customer feedback or review submissions recorded.'
          }
          actionLabel={hasActiveFilters ? 'Clear All Filters' : undefined}
          onAction={hasActiveFilters ? onClearFilters : undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Desktop & Tablet Table */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs lg:block">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-4 py-3.5">Customer</th>
              <th scope="col" className="px-3 py-3.5">Location</th>
              <th scope="col" className="px-3 py-3.5">Rating</th>
              <th scope="col" className="px-3 py-3.5 min-w-[180px]">Review Title & Snippet</th>
              <th scope="col" className="px-3 py-3.5">Source</th>
              <th scope="col" className="px-3 py-3.5">Project</th>
              <th scope="col" className="px-3 py-3.5 whitespace-nowrap">Date</th>
              <th scope="col" className="px-3 py-3.5 text-center">Featured</th>
              <th scope="col" className="px-3 py-3.5 text-center">Status</th>
              <th scope="col" className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {items.map((row) => (
              <tr
                key={row.id}
                className="transition-colors hover:bg-slate-50/70"
              >
                {/* 1. Customer Photo & Name */}
                <td className="px-4 py-3.5 align-middle">
                  <div className="flex items-center gap-3">
                    <CustomerAvatar name={row.customer_name} photoUrl={row.customer_photo_url} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900 text-xs sm:text-sm">
                        {row.customer_name}
                      </p>
                      <p className="text-[11px] text-slate-400">ID #{row.id}</p>
                    </div>
                  </div>
                </td>

                {/* 2. Location */}
                <td className="px-3 py-3.5 align-middle text-slate-600">
                  <span className="inline-flex items-center gap-1 text-xs">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[120px]">{row.customer_location || '—'}</span>
                  </span>
                </td>

                {/* 3. Rating */}
                <td className="px-3 py-3.5 align-middle">
                  <StarRating rating={row.rating} />
                </td>

                {/* 4. Review Title & Snippet */}
                <td className="px-3 py-3.5 align-middle">
                  <div className="max-w-xs space-y-0.5">
                    {row.review_title ? (
                      <p className="truncate font-semibold text-slate-800 text-xs">
                        {row.review_title}
                      </p>
                    ) : null}
                    <p className="truncate text-slate-500 text-xs">
                      {row.review_message || 'No review message text.'}
                    </p>
                  </div>
                </td>

                {/* 5. Review Source */}
                <td className="px-3 py-3.5 align-middle whitespace-nowrap">
                  <SourceBadge source={row.review_source} />
                </td>

                {/* 6. Project Name */}
                <td className="px-3 py-3.5 align-middle text-slate-600">
                  {row.project_name ? (
                    <span className="inline-flex items-center gap-1 text-xs max-w-[130px] truncate" title={row.project_name}>
                      <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate">{row.project_name}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>

                {/* 7. Review Date */}
                <td className="px-3 py-3.5 align-middle text-slate-600 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 text-xs">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    {row.review_date ? formatDate(row.review_date) : '—'}
                  </span>
                </td>

                {/* 8. Featured Status */}
                <td className="px-3 py-3.5 align-middle text-center whitespace-nowrap">
                  <FeaturedBadge isFeatured={row.is_featured} />
                </td>

                {/* 9. Published Status */}
                <td className="px-3 py-3.5 align-middle text-center whitespace-nowrap">
                  <PublicationBadge isPublished={row.is_published} />
                </td>

                {/* 10. Actions */}
                <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onViewDetails(row)}
                    className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-slate-700 hover:text-brand hover:border-brand/40"
                    title="View Feedback Details"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-500" />
                    <span>View</span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile & Small Screen Cards Layout */}
      <div className="space-y-3 lg:hidden">
        {items.map((row) => (
          <div
            key={row.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <CustomerAvatar name={row.customer_name} photoUrl={row.customer_photo_url} />
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-bold text-slate-900">{row.customer_name}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate">{row.customer_location || 'Location not specified'}</span>
                  </div>
                </div>
              </div>
              <StarRating rating={row.rating} />
            </div>

            {row.review_title ? (
              <p className="text-xs font-semibold text-slate-800">{row.review_title}</p>
            ) : null}
            <p className="line-clamp-2 text-xs text-slate-600">{row.review_message}</p>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <SourceBadge source={row.review_source} />
              <PublicationBadge isPublished={row.is_published} />
              <FeaturedBadge isFeatured={row.is_featured} />
              {row.project_name && (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                  <Building2 className="h-3 w-3 text-slate-400" />
                  {row.project_name}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                {row.review_date ? formatDate(row.review_date) : ''}
              </span>
              <Button
                variant="secondary"
                onClick={() => onViewDetails(row)}
                className="inline-flex items-center gap-1.5 h-8 text-xs font-semibold"
              >
                <Eye className="h-3.5 w-3.5" />
                View Details
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination component */}
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-xs">
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={[10, 20, 50, 100]}
          showPageSize={true}
          showTotal={true}
        />
      </div>
    </div>
  );
}

export default FeedbackTable;
