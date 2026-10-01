import { FolderOpen } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({ title, description, actionLabel, onAction, icon: Icon = FolderOpen }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-brand-pale text-brand">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      {description ? <p className="mt-1 max-w-md text-sm text-muted">{description}</p> : null}
      {actionLabel ? (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function LoadingSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3 p-1">
      <div className="h-8 w-48 animate-pulse rounded-md bg-line" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-brand-pale" />
      ))}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-sm text-danger">{message}</p>
      {onRetry ? (
        <button type="button" className="mt-3 text-sm font-medium text-brand underline" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}
