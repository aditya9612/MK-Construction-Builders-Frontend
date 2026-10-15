import { useMemo } from 'react';
import { cn } from '../../utils/formatting';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

/**
 * Modern, accessible pagination component.
 * Supports:
 * - Smart page windowing with ellipsis (e.g. 1, 2, ..., 5, 6, ..., 20)
 * - Page size selection (e.g. 10, 20, 50, 100 items per page)
 * - Direct page navigation, jump to first/last, and prev/next
 * - Responsive layout (compact on mobile, full-featured on desktop)
 * - Informative count range (Showing X–Y of Z items)
 */
export function Pagination({
  page = 1,
  pageSize = 10,
  total = 0,
  totalPages: propTotalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSize = true,
  showTotal = true,
  showFirstLast = true,
  className = '',
}) {
  const pages = propTotalPages ?? Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const currentPage = Math.min(Math.max(1, page), pages);

  const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  // Generate numbered pagination items with smart ellipsis
  const pageNumbers = useMemo(() => {
    if (pages <= 7) {
      return Array.from({ length: pages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', pages];
    }

    if (currentPage >= pages - 3) {
      return [1, '...', pages - 4, pages - 3, pages - 2, pages - 1, pages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', pages];
  }, [pages, currentPage]);

  if (total <= 0 && pages <= 1) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 pb-2 px-1 text-xs text-slate-600 border-t border-slate-100 select-none',
        className
      )}
    >
      {/* Left: Summary & Page Size Selector */}
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        {showTotal && (
          <p className="text-slate-500 font-medium text-xs">
            Showing{' '}
            <span className="font-semibold text-slate-800">
              {startItem.toLocaleString('en-IN')}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-800">
              {endItem.toLocaleString('en-IN')}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-800">
              {total.toLocaleString('en-IN')}
            </span>{' '}
            records
          </p>
        )}

        {showPageSize && onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-0 sm:pl-3 sm:border-l sm:border-slate-200">
            <span className="text-slate-400 text-[11px] font-medium">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 text-xs font-semibold rounded-lg border border-slate-200 bg-white px-2 py-0 text-slate-700 hover:border-slate-300 focus:border-[#0284c7] focus:outline-none cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / page
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Navigation Controls */}
      <div className="flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-end">
        {/* Jump to First Page */}
        {showFirstLast && (
          <button
            type="button"
            title="First Page"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(1)}
            className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        )}

        {/* Previous Page */}
        <button
          type="button"
          title="Previous Page"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Desktop Numbered Page Buttons */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((p, idx) =>
            p === '...' ? (
              <span
                key={`ellipsis-${idx}`}
                className="w-7 h-8 flex items-center justify-center text-slate-400 font-bold"
              >
                …
              </span>
            ) : (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(p)}
                className={cn(
                  'min-w-8 h-8 px-2 rounded-lg text-xs font-semibold transition-all',
                  p === currentPage
                    ? 'bg-[#0284c7] text-white shadow-xs border border-[#0284c7]'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Mobile Page Indicator */}
        <div className="sm:hidden px-3 text-xs font-semibold text-slate-700">
          Page {currentPage} of {pages}
        </div>

        {/* Next Page */}
        <button
          type="button"
          title="Next Page"
          disabled={currentPage >= pages}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Jump to Last Page */}
        {showFirstLast && (
          <button
            type="button"
            title="Last Page"
            disabled={currentPage >= pages}
            onClick={() => onPageChange(pages)}
            className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default Pagination;
