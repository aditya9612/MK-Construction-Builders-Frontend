import { useEffect, useState } from 'react';
import {
  X,
  Star,
  MapPin,
  Building2,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
  User,
  Hash,
  FileText,
  AlertCircle,
  RefreshCw,
  Pencil,
  Trash2,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Drawer } from '../../components/modals/Modal';
import { Button } from '../../components/common/Button';
import { LoadingSkeleton } from '../../components/common/States';
import {
  StarRating,
  SourceBadge,
  PublicationBadge,
  FeaturedBadge,
} from './FeedbackTable';
import { customerFeedbackService } from '../../services/api/customerFeedbackService';
import { extractErrorMessage } from '../../services/api/authService';
import { formatDate, initials } from '../../utils/formatting';
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

export function FeedbackDetailDrawer({
  feedbackId,
  initialData,
  open,
  onClose,
  onEdit,
  onDelete,
  onTogglePublish,
  onToggleFeatured,
}) {
  const [data, setData] = useState(initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imgError, setImgError] = useState(false);
  const [togglingPublish, setTogglingPublish] = useState(false);
  const [togglingFeatured, setTogglingFeatured] = useState(false);

  useEffect(() => {
    if (!open || !feedbackId) {
      setData(null);
      setError('');
      setImgError(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError('');
    setImgError(false);

    // If initial summary data exists, display it immediately
    if (initialData) {
      setData(initialData);
    }

    customerFeedbackService
      .getAdminById(feedbackId)
      .then((res) => {
        if (isMounted) {
          setData(res);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(extractErrorMessage(err, 'Failed to load feedback details.'));
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [open, feedbackId, initialData]);

  const handleRetry = () => {
    if (!feedbackId) return;
    setLoading(true);
    setError('');
    customerFeedbackService
      .getAdminById(feedbackId)
      .then(setData)
      .catch((err) => setError(extractErrorMessage(err, 'Failed to load feedback details.')))
      .finally(() => setLoading(false));
  };

  const item = data || initialData;

  const handlePublishClick = async () => {
    if (!item || togglingPublish) return;
    setTogglingPublish(true);
    try {
      const updated = await customerFeedbackService.publishFeedback(item.id, !item.is_published);
      setData(updated);
      onTogglePublish?.(updated, false); // notify parent list
      toast(
        `Feedback ${updated.is_published ? 'published' : 'unpublished'} successfully`,
        'success'
      );
    } catch (err) {
      toast(extractErrorMessage(err, 'Failed to update publication status'), 'error');
    } finally {
      setTogglingPublish(false);
    }
  };

  const handleFeaturedClick = async () => {
    if (!item || togglingFeatured) return;
    setTogglingFeatured(true);
    try {
      const updated = await customerFeedbackService.featureFeedback(item.id, !item.is_featured);
      setData(updated);
      onToggleFeatured?.(updated, false); // notify parent list
      toast(
        `Feedback ${updated.is_featured ? 'marked as featured' : 'unmarked as featured'} successfully`,
        'success'
      );
    } catch (err) {
      toast(extractErrorMessage(err, 'Failed to update featured status'), 'error');
    } finally {
      setTogglingFeatured(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={item?.customer_name ? `${item.customer_name}'s Review` : 'Review Details'}
      width="max-w-lg"
    >
      {loading && !item ? (
        <div className="space-y-4 py-4">
          <LoadingSkeleton rows={5} />
        </div>
      ) : error && !item ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
          <p className="text-sm font-semibold text-slate-800">Unable to load details</p>
          <p className="mt-1 text-xs text-slate-500 max-w-xs">{error}</p>
          <Button
            variant="secondary"
            onClick={handleRetry}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      ) : item ? (
        <div className="space-y-6 pb-6 text-sm">
          {/* Action bar on top */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5">
              {onEdit && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    onClose();
                    onEdit(item);
                  }}
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-amber-700 hover:text-amber-800"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </Button>
              )}

              {onDelete && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    onClose();
                    onDelete(item);
                  }}
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border-rose-200"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">ID #{item.id}</span>
            </div>
          </div>

          {/* Header Customer Profile Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-start gap-4">
              {item.customer_photo_url && !imgError ? (
                <img
                  src={item.customer_photo_url}
                  alt={item.customer_name}
                  onError={() => setImgError(true)}
                  className="h-16 w-16 shrink-0 rounded-2xl border-2 border-white object-cover shadow-md"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-white bg-gradient-to-tr from-brand-navy to-brand text-lg font-bold text-white shadow-md">
                  {item.customer_name ? initials(item.customer_name) : <User className="h-8 w-8" />}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-base font-bold text-slate-900">
                    {item.customer_name}
                  </h3>
                </div>

                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{item.customer_location || 'Location not specified'}</span>
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  <StarRating rating={item.rating} size="md" />
                </div>
              </div>
            </div>

            {/* Badges strip with interactive toggles */}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200/60 pt-3">
              <SourceBadge source={item.review_source} />

              <PublicationBadge
                isPublished={item.is_published}
                onClick={handlePublishClick}
                loading={togglingPublish}
              />

              <FeaturedBadge
                isFeatured={item.is_featured}
                onClick={handleFeaturedClick}
                loading={togglingFeatured}
              />

              <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
                <Hash className="h-3 w-3 text-slate-400" />
                Order: {item.display_order ?? 0}
              </span>
            </div>
          </div>

          {/* Review Heading & Message Body */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Customer Feedback Message
            </h4>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              {item.review_title ? (
                <h5 className="mb-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  {item.review_title}
                </h5>
              ) : null}
              <p className="whitespace-pre-line text-xs sm:text-sm leading-relaxed text-slate-700 italic">
                "{item.review_message || 'No review message provided.'}"
              </p>
            </div>
          </div>

          {/* Project Association */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Associated Project
            </h4>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  {item.project_name || 'General Construction Service'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {item.project_name ? 'Linked MK Construction project' : 'Unspecified project assignment'}
                </p>
              </div>
            </div>
          </div>

          {/* Google Review URL if available */}
          {item.google_review_url && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 mb-1">
                Google Review Verification
              </h4>
              <p className="text-xs text-blue-700 mb-2.5">
                This testimonial originated from an external Google My Business review.
              </p>
              <a
                href={item.google_review_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors shadow-xs"
              >
                <span>Open Google Review URL</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* Detailed Audit Metadata */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Record Metadata
            </h4>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-slate-400 font-medium">Review Date</dt>
                <dd className="mt-0.5 font-semibold text-slate-700">
                  {item.review_date ? formatDate(item.review_date) : '—'}
                </dd>
              </div>

              <div>
                <dt className="text-slate-400 font-medium">Display Sequence</dt>
                <dd className="mt-0.5 font-semibold text-slate-700">
                  #{item.display_order ?? 0}
                </dd>
              </div>

              <div>
                <dt className="text-slate-400 font-medium">Created On</dt>
                <dd className="mt-0.5 font-semibold text-slate-700">
                  {formatDateTime(item.created_at)}
                </dd>
              </div>

              <div>
                <dt className="text-slate-400 font-medium">Last Modified</dt>
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

export default FeedbackDetailDrawer;
