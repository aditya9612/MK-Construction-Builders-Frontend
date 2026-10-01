import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useToastTimeout } from '../../hooks/useToastTimeout';
import { useUiStore } from '../../store/uiStore';

const icons = {
  success: CheckCircle2,
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

export function ToastViewport() {
  useToastTimeout();
  const toasts = useUiStore((s) => s.toasts);
  const removeToast = useUiStore((s) => s.removeToast);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(100%-2rem,340px)] flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || CheckCircle2;
        return (
          <div
            key={toast.id}
            className="animate-toast pointer-events-auto flex items-start gap-3 rounded-lg border border-line bg-white px-3 py-2.5 shadow-pop"
            role="status"
          >
            <Icon className={`mt-0.5 h-4 w-4 ${toast.type === 'error' ? 'text-danger' : toast.type === 'warning' ? 'text-warning' : toast.type === 'info' ? 'text-brand' : 'text-success'}`} />
            <p className="flex-1 text-[13px] text-ink">{toast.message}</p>
            <button type="button" onClick={() => removeToast(toast.id)} className="text-faint hover:text-ink" aria-label="Dismiss">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
