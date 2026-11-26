import { useEffect, useState } from 'react';
import {
  ArrowUpDown,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import {
  ALLOWED_REEL_SORT_FIELDS,
  REEL_PUBLICATION_FILTER_OPTIONS,
} from '../../services/api/instagramReelsService';

export function InstagramReelsFilters({
  search,
  onSearchChange,
  isPublished,
  onIsPublishedChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onClearFilters,
  totalResults = 0,
}) {
  const [localSearch, setLocalSearch] = useState(search || '');

  useEffect(() => {
    setLocalSearch(search || '');
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [localSearch, search, onSearchChange]);

  const hasActiveFilters = Boolean(
    (search && search.trim() !== '') ||
      isPublished !== '' ||
      sortBy !== 'display_order' ||
      sortOrder !== 'asc'
  );

  const activeFilterCount = [
    Boolean(search && search.trim() !== ''),
    isPublished !== '',
    sortBy !== 'display_order' || sortOrder !== 'asc',
  ].filter(Boolean).length;

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      {/* Top row: Search + Reset + Count */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by reel title, description, or Instagram URL..."
            aria-label="Search Instagram reels"
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-9 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          {localSearch ? (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600"
              title="Clear search"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          {hasActiveFilters ? (
            <Button
              variant="secondary"
              onClick={onClearFilters}
              className="inline-flex h-10 items-center gap-1.5 border-rose-200 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
              <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                {activeFilterCount}
              </span>
            </Button>
          ) : null}

          <div className="whitespace-nowrap pl-1 text-xs font-medium text-slate-500">
            <span className="font-semibold text-slate-800">{totalResults}</span> reels found
          </div>
        </div>
      </div>

      {/* Filter & Sort Controls */}
      <div className="grid grid-cols-1 gap-2.5 border-t border-slate-100 pt-2 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-500">
            Publication Status
          </label>
          <select
            value={isPublished}
            onChange={(e) => onIsPublishedChange(e.target.value)}
            aria-label="Filter by publication status"
            className="h-9 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20"
          >
            {REEL_PUBLICATION_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-500">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            aria-label="Sort reels by"
            className="h-9 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20"
          >
            {ALLOWED_REEL_SORT_FIELDS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-500">
            Sort Order
          </label>
          <button
            type="button"
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:border-brand focus:outline-none"
          >
            <span>{sortOrder === 'asc' ? 'Ascending (↑)' : 'Descending (↓)'}</span>
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default InstagramReelsFilters;
