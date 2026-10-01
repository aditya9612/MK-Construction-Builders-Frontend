import { MoreHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/formatting';

export function ActionMenu({ items = [], label = 'Actions' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const visible = items.filter((item) => !item.hidden);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative flex justify-end" ref={ref}>
      <button
        type="button"
        className="rounded-md p-1.5 text-muted transition duration-ui hover:bg-surface hover:text-ink"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-8 z-20 w-40 rounded-[10px] border border-line bg-white p-1 shadow-pop" role="menu">
          {visible.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] transition duration-ui',
                item.danger ? 'text-danger hover:bg-[#FDF4F4]' : 'text-ink hover:bg-surface'
              )}
              onClick={() => {
                setOpen(false);
                item.onClick?.();
              }}
            >
              {item.icon ? <item.icon className="h-3.5 w-3.5" /> : null}
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
