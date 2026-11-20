import { useState } from 'react';
import {
  Star,
  MapPin,
  Building2,
  Calendar,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Globe,
  Laptop,
  PenTool,
  User,
  ExternalLink,
  Plus,
  Loader2,
  ArrowUpDown,
  Hash,
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

export function PublicationBadge({ isPublished, onClick, disabled = false, loading = false }) {
  const content = (
    <>
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
      ) : isPublished ? (
        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
      ) : (
        <Clock className="h-3 w-3 text-amber-600" />
      )}
      <span>{isPublished ? 'Published' : 'Pending'}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        title={isPublished ? 'Click to unpublish' : 'Click to publish'}
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          isPublished
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70'
            : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100/70'
        }`}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
        isPublished
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-amber-200 bg-amber-50 text-amber-700'
      }`}
    >
      {content}
    </span>
  );
}

export function FeaturedBadge({ isFeatured, onClick, disabled = false, loading = false }) {
  const content = (
    <>
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
      ) : isFeatured ? (
        <Sparkles className="h-3 w-3 text-purple-600" />
      ) : (
        <Star className="h-3 w-3 text-slate-400" />
      )}
      <span>{isFeatured ? 'Featured' : 'Standard'}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        title={isFeatured ? 'Click to unmark as featured' : 'Click to mark as featured'}
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          isFeatured
            ? 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100/70'
            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100/70'
        }`}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
        isFeatured
          ? 'border-purple-200 bg-purple-50 text-purple-700'
          : 'border-slate-200 bg-slate-50 text-slate-500'
      }`}
    >
      {content}
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

function OrderEditor({ displayOrder, onSave, disabled }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(displayOrder ?? 0);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setSaving(true);
    try {
      await onSave(num);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          disabled={saving || disabled}
          className="h-7 w-14 rounded border border-brand bg-white px-1.5 text-center text-xs font-semibold text-slate-800 outline-none"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') setEditing(false);
          }}
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || disabled}
          className="rounded bg-brand px-1.5 py-1 text-[10px] font-bold text-white hover:bg-brand-deep disabled:opacity-50"
        >
          {saving ? '...' : '✓'}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={saving}
          className="rounded bg-slate-200 px-1.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-300"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setVal(displayOrder ?? 0);
        setEditing(true);
      }}
      disabled={disabled}
      title="Click to change display order"
      className="inline-flex items-center gap-1 rounded border border-transparent px-1.5 py-0.5 text-xs font-mono font-semibold text-slate-600 hover:border-slate-200 hover:bg-slate-50 transition-colors"
    >
      <Hash className="h-3 w-3 text-slate-400" />
      <span>{displayOrder ?? 0}</span>
    </button>
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
  onAddNew,
  onViewDetails,
  onEdit,
  onDelete,
  onTogglePublish,
  onToggleFeatured,
  onUpdateDisplayOrder,
  onClearFilters,
  hasActiveFilters = false,
  actionLoadingIds = {},
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
          actionLabel={hasActiveFilters ? 'Clear All Filters' : onAddNew ? 'Add First Review' : undefined}
          onAction={hasActiveFilters ? onClearFilters : onAddNew}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Table Toolbar Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Customer Reviews
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            {total} total
          </span>
        </div>

        {onAddNew && (
          <Button
            type="button"
            onClick={onAddNew}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Feedback</span>
          </Button>
        )}
      </div>

      {/* Desktop & Tablet Table */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs lg:block">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-4 py-3.5">Customer</th>
              <th scope="col" className="px-3 py-3.5">Location</th>
              <th scope="col" className="px-3 py-3.5">Rating</th>
              <th scope="col" className="px-3 py-3.5 min-w-[170px]">Review Title & Snippet</th>
              <th scope="col" className="px-3 py-3.5">Source</th>
              <th scope="col" className="px-3 py-3.5">Project</th>
              <th scope="col" className="px-3 py-3.5 whitespace-nowrap">Date</th>
              <th scope="col" className="px-3 py-3.5 text-center">Order</th>
              <th scope="col" className="px-3 py-3.5 text-center">Featured</th>
              <th scope="col" className="px-3 py-3.5 text-center">Status</th>
              <th scope="col" className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {items.map((row) => {
              const rowLoading = Boolean(actionLoadingIds[row.id]);

              return (
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

                  {/* 8. Display Order */}
                  <td className="px-3 py-3.5 align-middle text-center whitespace-nowrap">
                    <OrderEditor
                      displayOrder={row.display_order}
                      onSave={(newOrder) => onUpdateDisplayOrder?.(row, newOrder)}
                      disabled={rowLoading}
                    />
                  </td>

                  {/* 9. Featured Status Toggle */}
                  <td className="px-3 py-3.5 align-middle text-center whitespace-nowrap">
                    <FeaturedBadge
                      isFeatured={row.is_featured}
                      onClick={onToggleFeatured ? () => onToggleFeatured(row) : undefined}
                      disabled={rowLoading}
                      loading={actionLoadingIds[`${row.id}-featured`]}
                    />
                  </td>

                  {/* 10. Published Status Toggle */}
                  <td className="px-3 py-3.5 align-middle text-center whitespace-nowrap">
                    <PublicationBadge
                      isPublished={row.is_published}
                      onClick={onTogglePublish ? () => onTogglePublish(row) : undefined}
                      disabled={rowLoading}
                      loading={actionLoadingIds[`${row.id}-publish`]}
                    />
                  </td>

                  {/* 11. Actions */}
                  <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onViewDetails(row)}
                        disabled={rowLoading}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand transition-colors"
                        title="View Full Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(row)}
                          disabled={rowLoading}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-amber-600 transition-colors"
                          title="Edit Customer Feedback"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}

                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(row)}
                          disabled={rowLoading}
                          className="rounded p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Delete Customer Feedback"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile & Small Screen Cards Layout */}
      <div className="space-y-3 lg:hidden">
        {items.map((row) => {
          const rowLoading = Boolean(actionLoadingIds[row.id]);

          return (
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
                <PublicationBadge
                  isPublished={row.is_published}
                  onClick={onTogglePublish ? () => onTogglePublish(row) : undefined}
                  disabled={rowLoading}
                  loading={actionLoadingIds[`${row.id}-publish`]}
                />
                <FeaturedBadge
                  isFeatured={row.is_featured}
                  onClick={onToggleFeatured ? () => onToggleFeatured(row) : undefined}
                  disabled={rowLoading}
                  loading={actionLoadingIds[`${row.id}-featured`]}
                />
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500">
                  Order: #{row.display_order ?? 0}
                </span>
                {row.project_name && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 truncate max-w-[140px]">
                    <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate">{row.project_name}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  {row.review_date ? formatDate(row.review_date) : ''}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="secondary"
                    onClick={() => onViewDetails(row)}
                    className="inline-flex items-center gap-1 h-7 px-2 text-xs font-semibold"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View</span>
                  </Button>

                  {onEdit && (
                    <Button
                      variant="secondary"
                      onClick={() => onEdit(row)}
                      className="inline-flex items-center gap-1 h-7 px-2 text-xs font-semibold text-amber-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </Button>
                  )}

                  {onDelete && (
                    <Button
                      variant="secondary"
                      onClick={() => onDelete(row)}
                      className="inline-flex items-center gap-1 h-7 px-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border-rose-200"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
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
