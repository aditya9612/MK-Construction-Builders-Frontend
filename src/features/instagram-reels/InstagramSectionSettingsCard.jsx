import {
  AlertCircle,
  CheckCircle2,
  EyeOff,
  Globe,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../../components/cards/Card';
import { Button } from '../../components/common/Button';

function formatSettingsUpdatedAt(dtStr) {
  if (!dtStr) return null;
  try {
    const d = new Date(dtStr);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return null;
  }
}

export function InstagramSectionSettingsCard({
  settings,
  loading = false,
  saving = false,
  error = '',
  onToggle,
  onRetry,
}) {
  if (loading) {
    return (
      <Card className="animate-pulse border border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-4 w-52 rounded bg-slate-200" />
            <div className="h-3 w-80 max-w-full rounded bg-slate-100" />
          </div>
          <div className="h-9 w-36 rounded-lg bg-slate-200" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-red-200 bg-red-50/50 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5 text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="text-xs font-semibold sm:text-sm">
                Unable to load Instagram section visibility settings
              </p>
              <p className="mt-0.5 text-xs text-red-600">{error}</p>
            </div>
          </div>
          {onRetry ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onRetry}
              className="shrink-0 text-xs font-semibold"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </Button>
          ) : null}
        </div>
      </Card>
    );
  }

  const isEnabled = Boolean(settings?.is_enabled);
  const updatedLabel = formatSettingsUpdatedAt(settings?.updated_at);

  return (
    <Card className="border border-slate-200 p-4 sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3.5">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
              isEnabled
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}
          >
            {isEnabled ? <Globe className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 sm:text-[15px]">
                Public Website Instagram Section
              </h2>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                  isEnabled
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700'
                }`}
              >
                {isEnabled ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Enabled</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3 w-3" />
                    <span>Disabled</span>
                  </>
                )}
              </span>
            </div>

            <p className="text-xs text-slate-600">
              {isEnabled
                ? 'Published Instagram reels are currently visible on the MK Construction public website.'
                : 'The Instagram Reels section is hidden from the public website. Existing reels remain saved in the admin catalog.'}
            </p>

            {updatedLabel ? (
              <p className="text-[11px] text-slate-400">
                Last settings update: {updatedLabel}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0">
          <div className="text-left md:text-right">
            <p className="text-xs font-semibold text-slate-700">
              {isEnabled ? 'Section Visible' : 'Section Hidden'}
            </p>
            <p className="text-[11px] text-slate-400">
              Toggle global public display
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isEnabled}
            aria-label="Toggle Instagram Reels public section"
            disabled={saving}
            onClick={() => onToggle?.(!isEnabled)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-60 ${
              isEnabled ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-sm transition-transform ${
                isEnabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            >
              {saving ? (
                <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
              ) : null}
            </span>
          </button>
        </div>
      </div>
    </Card>
  );
}

export default InstagramSectionSettingsCard;
