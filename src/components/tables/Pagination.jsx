import { cn } from '../../utils/formatting';

export function Pagination({ page, pageSize, total, onPageChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between gap-3 pt-4 text-[13px] text-muted">
      <p>
        Showing {(total === 0 ? 0 : (page - 1) * pageSize + 1).toLocaleString('en-IN')}–
        {Math.min(page * pageSize, total).toLocaleString('en-IN')} of {total.toLocaleString('en-IN')}
      </p>
      <div className="flex gap-1">
        <button
          type="button"
          className={cn('h-8 rounded-md border border-line px-3 transition duration-ui hover:bg-surface', page <= 1 && 'opacity-40')}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </button>
        <button
          type="button"
          className={cn('h-8 rounded-md border border-line px-3 transition duration-ui hover:bg-surface', page >= pages && 'opacity-40')}
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
