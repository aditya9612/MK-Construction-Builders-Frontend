import { useEffect, useState } from 'react';
import {
  Search,
  X,
  Filter,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import {
  RATING_FILTER_OPTIONS,
  REVIEW_SOURCES,
  PUBLICATION_FILTER_OPTIONS,
  FEATURED_FILTER_OPTIONS,
  ALLOWED_FEEDBACK_SORT_FIELDS,
} from '../../services/api/customerFeedbackService';

export function FeedbackFilters({
  search,
  onSearchChange,
  rating,
  onRatingChange,
  reviewSource,
  onReviewSourceChange,
  isPublished,
  onIsPublishedChange,
  isFeatured,
  onIsFeaturedChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onClearFilters,
  totalResults = 0,
}) {
  // Local input state for search debounce
  const [localSearch, setLocalSearch] = useState(search || '');

  // Synchronize local input when parent resets
  useEffect(() => {
    setLocalSearch(search || '');
  }, [search]);

  // Debounce search by 350ms to avoid unnecessary API requests
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [localSearch, search, onSearchChange]);

  const hasActiveFilters = Boolean(
    (search && search.trim() !== '') ||
      rating !== '' ||
      reviewSource !== '' ||
      isPublished !== '' ||
      isFeatured !== '' ||
      sortBy !== 'display_order' ||
      sortOrder !== 'asc'
  );

  const activeFilterCount = [
    Boolean(search && search.trim() !== ''),
    rating !== '',
    reviewSource !== '',
    isPublished !== '',
    isFeatured !== '',
    sortBy !== 'display_order' || sortOrder !== 'asc',
  ].filter(Boolean).length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
      {/* Top row: Search input + Clear Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by customer name, location, title, message, or project..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-9 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          {localSearch ? (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="secondary"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1.5 h-10 px-3 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filters
              <span className="rounded-full bg-rose-100 px-1.5 py-0.2 text-[10px] font-bold text-rose-700">
                {activeFilterCount}
              </span>
            </Button>
          )}

          <div className="text-xs text-slate-500 font-medium whitespace-nowrap pl-2">
            <span className="font-semibold text-slate-800">{totalResults}</span> records found
          </div>
        </div>
      </div>

      {/* Filter controls row */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6 pt-1 border-t border-slate-100">
        {/* Rating Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Rating</label>
          <select
            value={rating}
            onChange={(e) => onRatingChange(e.target.value)}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20 cursor-pointer"
          >
            {RATING_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Review Source Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Source</label>
          <select
            value={reviewSource}
            onChange={(e) => onReviewSourceChange(e.target.value)}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20 cursor-pointer"
          >
            <option value="">All Sources</option>
            {REVIEW_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Publication Status Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Publication</label>
          <select
            value={isPublished}
            onChange={(e) => onIsPublishedChange(e.target.value)}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20 cursor-pointer"
          >
            {PUBLICATION_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Featured Status Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Featured</label>
          <select
            value={isFeatured}
            onChange={(e) => onIsFeaturedChange(e.target.value)}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20 cursor-pointer"
          >
            {FEATURED_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Field */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Sort Field</label>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20 cursor-pointer"
          >
            {ALLOWED_FEEDBACK_SORT_FIELDS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Direction */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Sort Order</label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:border-brand focus:outline-none transition-colors"
            >
              <span>{sortOrder === 'asc' ? 'Ascending (↑)' : 'Descending (↓)'}</span>
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeedbackFilters;
