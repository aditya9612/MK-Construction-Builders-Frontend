import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Copy,
  ExternalLink,
  Hash,
  Pencil,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Drawer } from '../../components/modals/Modal';
import { Button } from '../../components/common/Button';
import { LoadingSkeleton } from '../../components/common/States';
import { InstagramReelEmbedPreview } from './InstagramReelEmbedPreview';
import { ReelPublicationBadge } from './InstagramReelsTable';
import { instagramReelsService } from '../../services/api/instagramReelsService';
import { extractErrorMessage } from '../../services/api/authService';
import { toast } from '../../store/uiStore';

function formatDateTime(dtStr) {
  if (!dtStr) return '—';
  try {
    const d = new Date(dtStr);
    if (Number.isNaN(d.getTime())) return dtStr;
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dtStr;
  }
}

export function InstagramReelDetailDrawer({
  reelId,
  initialData,
  open,
  onClose,
  onEdit,
  onDelete,
  onTogglePublish,
}) {
  const [data, setData] = useState(initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [togglingPublish, setTogglingPublish] = useState(false);

  useEffect(() => {
    if (!open || !reelId) {
      setData(null);
      setError('');
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError('');
    if (initialData) {
      setData(initialData);
    }

    instagramReelsService
      .getAdminById(reelId)
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => {
        if (isMounted) {
          setError(extractErrorMessage(err, 'Failed to load reel details.'));
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, reelId, initialData]);

  const item = data || initialData;

  const handleRetry = () => {
    if (!reelId) return;
    setLoading(true);
    setError('');
    instagramReelsService
      .getAdminById(reelId)
      .then(setData)
      .catch((err) => setError(extractErrorMessage(err, 'Failed to load reel details.')))
      .finally(() => setLoading(false));
  };

  const handlePublishClick = async () => {
    if (!item || togglingPublish) return;
    setTogglingPublish(true);
    try {
      const updated = await instagramReelsService.publishReel(
        item.id,
        !item.is_published
      );
      setData(updated);
      onTogglePublish?.(updated);
      toast(
        `Instagram reel ${updated.is_published ? 'published' : 'unpublished'} successfully`,
        'success'
      );
    } catch (err) {
      toast(extractErrorMessage(err, 'Failed to update publish status.'), 'error');
    } finally {
      setTogglingPublish(false);
    }
  };

  const copyText = async (value, label) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast(`${label} copied to clipboard`, 'info');
    } catch {
      toast(`Failed to copy ${label}`, 'error');
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={item?.title || 'Instagram Reel Details'}
      width="max-w-lg"
    >
      {loading && !item ? (
        <div className="py-4">
          <LoadingSkeleton rows={5} />
        </div>
      ) : error && !item ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="mb-2 h-10 w-10 text-red-500" />
          <p className="text-sm font-semibold text-slate-800">Unable to load reel</p>
          <p className="mt-1 max-w-xs text-xs text-slate-500">{error}</p>
          <Button
            variant="secondary"
            onClick={handleRetry}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </Button>
        </div>
      ) : item ? (
        <div className="space-y-5 pb-6 text-sm">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5">
              {onEdit ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    onClose();
                    onEdit(item);
                  }}
                  className="inline-flex h-8 items-center gap-1.5 px-2.5 text-xs font-semibold text-amber-700 hover:text-amber-800"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </Button>
              ) : null}

              {onDelete ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    onClose();
                    onDelete(item);
                  }}
                  className="inline-flex h-8 items-center gap-1.5 border-rose-200 px-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </Button>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-slate-400">ID #{item.id}</span>
            </div>
          </div>

          {/* Status & Order Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <ReelPublicationBadge
                isPublished={item.is_published}
                onClick={handlePublishClick}
                loading={togglingPublish}
              />
              <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                <Hash className="h-3 w-3 text-slate-400" />
                Order: {item.display_order ?? 0}
              </span>
            </div>

            {item.instagram_url ? (
              <a
                href={item.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
              >
                <span>Open on Instagram</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>

          {/* Official Instagram Embed Preview */}
          <InstagramReelEmbedPreview
            embedUrl={item.embed_url}
            instagramUrl={item.instagram_url}
            title={item.title}
            description={item.description}
          />

          {/* Description */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Description
            </h4>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="whitespace-pre-line text-xs leading-relaxed text-slate-700 sm:text-sm">
                {item.description || 'No description provided for this reel.'}
              </p>
            </div>
          </div>

          {/* URL & Record Metadata */}
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              URLs &amp; Record Metadata
            </h4>

            <div className="space-y-2 text-xs">
              <div>
                <span className="font-medium text-slate-400">Canonical Instagram URL</span>
                <div className="mt-0.5 flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5">
                  <span className="truncate font-mono text-[11px] text-slate-700">
                    {item.instagram_url}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(item.instagram_url, 'Instagram URL')}
                    className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700"
                    title="Copy Instagram URL"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <span className="font-medium text-slate-400">Official Embed URL</span>
                <div className="mt-0.5 flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5">
                  <span className="truncate font-mono text-[11px] text-slate-700">
                    {item.embed_url}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(item.embed_url, 'Embed URL')}
                    className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700"
                    title="Copy Embed URL"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs">
              <div>
                <dt className="font-medium text-slate-400">Created On</dt>
                <dd className="mt-0.5 font-semibold text-slate-700">
                  {formatDateTime(item.created_at)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-400">Last Modified</dt>
                <dd className="mt-0.5 font-semibold text-slate-700">
                  {formatDateTime(item.updated_at)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}

export default InstagramReelDetailDrawer;
