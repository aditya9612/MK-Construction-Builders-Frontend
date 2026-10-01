import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/formatting';

export function Modal({ open, title, description, children, onClose, className, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-brand-navy/30" aria-label="Close dialog" onClick={onClose} />
      <div className={cn('relative z-10 w-full max-w-lg animate-modal rounded-[12px] border border-line bg-white shadow-pop', className)} role="dialog" aria-modal="true">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-[16px] font-semibold tracking-tight text-brand-navy">{title}</h2>
            {description ? <p className="mt-1 text-[13px] text-muted">{description}</p> : null}
          </div>
          <button type="button" className="rounded-md p-1 text-faint transition duration-ui hover:bg-surface hover:text-ink" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Drawer({ open, title, children, onClose, width = 'max-w-md' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-brand-navy/30" aria-label="Close drawer" onClick={onClose} />
      <aside className={cn('absolute right-0 top-0 flex h-full w-full flex-col border-l border-line bg-white shadow-pop', width)}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-[16px] font-semibold tracking-tight text-brand-navy">{title}</h2>
          <button type="button" className="rounded-md p-1 text-faint transition duration-ui hover:bg-surface" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </div>
  );
}
