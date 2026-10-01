import { useMemo, useState } from 'react';
import { Pagination } from './Pagination';
import { cn } from '../../utils/formatting';

export function DataTable({
  columns,
  rows,
  rowKey = 'id',
  pageSize = 8,
  empty,
  mobileCard,
}) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: null, dir: 'asc' });

  const sorted = useMemo(() => {
    if (!sort.key) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return sort.dir === 'asc' ? av - bv : bv - av;
      return sort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [rows, sort]);

  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <div className="hidden overflow-x-auto rounded-[12px] border border-line md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 table-head">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={cn('whitespace-nowrap border-b border-line px-3 py-3', col.headerClassName)}>
                  {col.sortable ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 transition duration-ui hover:text-ink"
                      onClick={() =>
                        setSort((s) => ({
                          key: col.key,
                          dir: s.key === col.key && s.dir === 'asc' ? 'desc' : 'asc',
                        }))
                      }
                    >
                      {col.header}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row) => (
              <tr key={row[rowKey]} className="border-t border-line transition duration-ui hover:bg-[#F8FBFE]">
                {columns.map((col) => (
                  <td key={col.key} className={cn('h-16 px-3 py-3 align-middle', col.className)}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {paged.map((row) =>
          mobileCard ? (
            <div key={row[rowKey]}>{mobileCard(row)}</div>
          ) : (
            <div key={row[rowKey]} className="rounded-[12px] border border-line bg-white p-3">
              {columns.map((col) => (
                <div key={col.key} className="flex justify-between gap-3 py-1 text-sm">
                  <span className="text-muted">{col.header}</span>
                  <span className="text-right font-medium text-ink">{col.render ? col.render(row) : row[col.key]}</span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
      {rows.length === 0 ? empty : <Pagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} />}
    </div>
  );
}
