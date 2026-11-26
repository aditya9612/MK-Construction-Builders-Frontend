import { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  Film,
  Hash,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { EmptyState, LoadingSkeleton } from '../../components/common/States';
import { Pagination } from '../../components/tables/Pagination';
import { extractInstagramShortcode } from '../../services/api/instagramReelsService';
import { formatDate } from '../../utils/formatting';
import { toast } from '../../store/uiStore';

export function ReelPublicationBadge({
  isPublished,
  onClick,
  disabled = false,
  loading = false,
}) {
  const content = (
    <>
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
      ) : isPublished ? (
        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
      ) : (
        <Clock className="h-3 w-3 text-amber-600" />
      )}
      <span>{isPublished ? 'Published' : 'Unpublished'}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        title={isPublished ? 'Click to unpublish' : 'Click to publish'}
        className={`inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
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
      <div className="inline-flex items-center gap-1">
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
          className="rounded bg-brand px-1.5 py-1 text-[10px] font-bold text-white hover:bg-brand-hover disabled:opacity-50"
          title="Save display order"
        >
          {saving ? '...' : '✓'}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={saving}
          className="rounded bg-slate-200 px-1.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-300"
          title="Cancel"
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
      title="Click to update display order"
      className="inline-flex items-center gap-1 rounded border border-slate-200/70 bg-slate-50/70 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700 transition-colors hover:border-brand/40 hover:bg-brand-pale hover:text-brand disabled:opacity-50"
    >
      <Hash className="h-3 w-3 text-slate-400" />
      <span>{displayOrder ?? 0}</span>
    </button>
  );
}

async function copyUrlToClipboard(url) {
  if (!url) return;
  try {
    await navigator.clipboard.writeText(url);
    toast('Instagram URL copied to clipboard', 'info');
  } catch {
    toast('Unable to copy URL to clipboard', 'error');
  }
}

export function InstagramReelsTable({
  items = [],
  loading = false,
  page = 1,
  pageSize = 20,
  total = 0,
  totalPages = 1,
  onPageChange,
  onPageSizeChange,
  onAddNew,
  onPreview,
  onEdit,
  onDelete,
  onTogglePublish,
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
          icon={Film}
          title="No Instagram reels found"
          description={
            hasActiveFilters
              ? 'No reels match the current search or status filters. Try resetting filters.'
              : 'Add your first Instagram Reel URL to showcase MK Construction projects on the website.'
          }
          actionLabel={
            hasActiveFilters
              ? 'Clear All Filters'
              : onAddNew
              ? 'Add First Reel'
              : undefined
          }
          onAction={hasActiveFilters ? onClearFilters : onAddNew}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Instagram Reels Catalog
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            {total} total
          </span>
        </div>

        {onAddNew ? (
          <Button
            type="button"
            onClick={onAddNew}
            className="inline-flex h-8 items-center gap-1.5 px-3 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Reel</span>
          </Button>
        ) : null}
      </div>

      {/* Desktop & Large Tablet Table */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs lg:block">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50/75 font-semibold uppercase tracking-wider text-slate-600">
            <tr>
              <th scope="col" className="px-4 py-3.5">Reel</th>
              <th scope="col" className="px-3 py-3.5">Instagram URL</th>
              <th scope="col" className="min-w-[180px] px-3 py-3.5">Description</th>
              <th scope="col" className="px-3 py-3.5 text-center">Order</th>
              <th scope="col" className="px-3 py-3.5 text-center">Status</th>
              <th scope="col" className="whitespace-nowrap px-3 py-3.5">Updated</th>
              <th scope="col" className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {items.map((row) => {
              const rowLoading = Boolean(actionLoadingIds[row.id]);
              const shortcode = extractInstagramShortcode(row.instagram_url);

              return (
                <tr key={row.id} className="transition-colors hover:bg-slate-50/70">
                  {/* Reel Title & ID */}
                  <td className="px-4 py-3.5 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-xs">
                        <Film className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 max-w-[220px]">
                        <button
                          type="button"
                          onClick={() => onPreview?.(row)}
                          className="block truncate text-left text-xs font-semibold text-slate-900 hover:text-brand sm:text-sm"
                          title={row.title}
                        >
                          {row.title}
                        </button>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <span>ID #{row.id}</span>
                          {shortcode ? (
                            <>
                              <span>•</span>
                              <span className="font-mono text-slate-500">{shortcode}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Instagram URL */}
                  <td className="px-3 py-3.5 align-middle">
                    <div className="flex items-center gap-1.5 max-w-[240px]">
                      <a
                        href={row.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-w-0 items-center gap-1 truncate font-medium text-brand hover:underline"
                        title={row.instagram_url}
                      >
                        <span className="truncate">{row.instagram_url}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                      <button
                        type="button"
                        onClick={() => copyUrlToClipboard(row.instagram_url)}
                        className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        title="Copy Instagram URL"
                        aria-label={`Copy URL for ${row.title}`}
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </td>

                  {/* Description */}
                  <td className="px-3 py-3.5 align-middle">
                    <p className="max-w-xs line-clamp-2 text-xs text-slate-600">
                      {row.description || <span className="text-slate-400">—</span>}
                    </p>
                  </td>

                  {/* Display Order */}
                  <td className="whitespace-nowrap px-3 py-3.5 text-center align-middle">
                    <OrderEditor
                      displayOrder={row.display_order}
                      onSave={(newOrder) => onUpdateDisplayOrder?.(row, newOrder)}
                      disabled={rowLoading || Boolean(actionLoadingIds[`${row.id}-order`])}
                    />
                  </td>

                  {/* Publish Status */}
                  <td className="whitespace-nowrap px-3 py-3.5 text-center align-middle">
                    <ReelPublicationBadge
                      isPublished={row.is_published}
                      onClick={onTogglePublish ? () => onTogglePublish(row) : undefined}
                      disabled={rowLoading}
                      loading={Boolean(actionLoadingIds[`${row.id}-publish`])}
                    />
                  </td>

                  {/* Updated Date */}
                  <td className="whitespace-nowrap px-3 py-3.5 align-middle text-slate-600">
                    <span className="inline-flex items-center gap-1 text-xs">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {row.updated_at ? formatDate(row.updated_at) : '—'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-right align-middle">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onPreview?.(row)}
                        disabled={rowLoading}
                        className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand"
                        title="Preview Reel & Embed"
                        aria-label={`Preview ${row.title}`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {onEdit ? (
                        <button
                          type="button"
                          onClick={() => onEdit(row)}
                          disabled={rowLoading}
                          className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-amber-600"
                          title="Edit Reel"
                          aria-label={`Edit ${row.title}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      ) : null}

                      {onDelete ? (
                        <button
                          type="button"
                          onClick={() => onDelete(row)}
                          disabled={rowLoading}
                          className="rounded p-1.5 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          title="Delete Reel"
                          aria-label={`Delete ${row.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile & Tablet Cards Layout */}
      <div className="space-y-3 lg:hidden">
        {items.map((row) => {
          const rowLoading = Boolean(actionLoadingIds[row.id]);
          const shortcode = extractInstagramShortcode(row.instagram_url);

          return (
            <div
              key={row.id}
              className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-xs">
                    <Film className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-bold text-slate-900">{row.title}</h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <span>ID #{row.id}</span>
                      {shortcode ? (
                        <>
                          <span>•</span>
                          <span className="font-mono text-slate-500">{shortcode}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                <ReelPublicationBadge
                  isPublished={row.is_published}
                  onClick={onTogglePublish ? () => onTogglePublish(row) : undefined}
                  disabled={rowLoading}
                  loading={Boolean(actionLoadingIds[`${row.id}-publish`])}
                />
              </div>

              {row.description ? (
                <p className="line-clamp-2 text-xs text-slate-600">{row.description}</p>
              ) : null}

              <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-1.5 text-xs">
                <a
                  href={row.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-w-0 items-center gap-1 truncate font-medium text-brand hover:underline"
                >
                  <span className="truncate">{row.instagram_url}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
                <button
                  type="button"
                  onClick={() => copyUrlToClipboard(row.instagram_url)}
                  className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700"
                  title="Copy URL"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-500">Order:</span>
                  <OrderEditor
                    displayOrder={row.display_order}
                    onSave={(newOrder) => onUpdateDisplayOrder?.(row, newOrder)}
                    disabled={rowLoading || Boolean(actionLoadingIds[`${row.id}-order`])}
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="secondary"
                    onClick={() => onPreview?.(row)}
                    className="inline-flex h-7 items-center gap-1 px-2 text-xs font-semibold"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Preview</span>
                  </Button>

                  {onEdit ? (
                    <Button
                      variant="secondary"
                      onClick={() => onEdit(row)}
                      className="inline-flex h-7 items-center gap-1 px-2 text-xs font-semibold text-amber-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </Button>
                  ) : null}

                  {onDelete ? (
                    <Button
                      variant="secondary"
                      onClick={() => onDelete(row)}
                      className="inline-flex h-7 items-center gap-1 border-rose-200 px-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
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

export default InstagramReelsTable;
