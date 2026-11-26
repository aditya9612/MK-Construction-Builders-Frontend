import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Modal } from '../../components/modals/Modal';
import { Button } from '../../components/common/Button';
import { InstagramReelEmbedPreview } from './InstagramReelEmbedPreview';
import {
  instagramReelsService,
  parseAndNormalizeInstagramUrl,
  parseInstagramValidationErrors,
} from '../../services/api/instagramReelsService';
import { toast } from '../../store/uiStore';

export function InstagramReelFormModal({
  open,
  onClose,
  onSuccess,
  initialData = null,
}) {
  const isEdit = Boolean(initialData?.id);

  const [title, setTitle] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (!open) {
      setFieldErrors({});
      setGeneralError('');
      return;
    }

    if (initialData) {
      setTitle(initialData.title || '');
      setInstagramUrl(initialData.instagram_url || '');
      setDescription(initialData.description || '');
      setDisplayOrder(
        typeof initialData.display_order === 'number'
          ? initialData.display_order
          : Number(initialData.display_order) || 0
      );
      setIsPublished(Boolean(initialData.is_published));
    } else {
      setTitle('');
      setInstagramUrl('');
      setDescription('');
      setDisplayOrder(0);
      setIsPublished(false);
    }

    setFieldErrors({});
    setGeneralError('');
  }, [open, initialData]);

  const parsedUrl = useMemo(() => {
    if (!instagramUrl || !instagramUrl.trim()) {
      return { valid: false, empty: true };
    }
    return parseAndNormalizeInstagramUrl(instagramUrl);
  }, [instagramUrl]);

  const previewEmbedUrl = parsedUrl.valid
    ? parsedUrl.embedUrl
    : isEdit && instagramUrl.trim() === (initialData?.instagram_url || '')
    ? initialData?.embed_url || ''
    : '';

  const validateForm = () => {
    const errors = {};
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      errors.title = 'Reel title is required.';
    } else if (trimmedTitle.length > 200) {
      errors.title = 'Title must not exceed 200 characters.';
    }

    const urlResult = parseAndNormalizeInstagramUrl(instagramUrl);
    if (!urlResult.valid) {
      errors.instagram_url = urlResult.error;
    }

    if (description && description.trim().length > 10000) {
      errors.description = 'Description must not exceed 10,000 characters.';
    }

    const parsedOrder = Number(displayOrder);
    if (
      displayOrder === '' ||
      displayOrder === null ||
      Number.isNaN(parsedOrder) ||
      !Number.isInteger(parsedOrder) ||
      parsedOrder < 0
    ) {
      errors.display_order = 'Display order must be a non-negative integer.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const normalizedUrl = parseAndNormalizeInstagramUrl(instagramUrl).canonicalUrl;
      const cleanTitle = title.trim();
      const cleanDesc = description.trim() ? description.trim() : null;
      const cleanOrder = Math.max(0, parseInt(displayOrder, 10) || 0);

      if (isEdit) {
        const payload = {};
        if (cleanTitle !== (initialData.title || '')) {
          payload.title = cleanTitle;
        }
        if (normalizedUrl !== (initialData.instagram_url || '')) {
          payload.instagram_url = normalizedUrl;
        }
        if ((cleanDesc || null) !== (initialData.description || null)) {
          payload.description = cleanDesc;
        }
        if (cleanOrder !== Number(initialData.display_order ?? 0)) {
          payload.display_order = cleanOrder;
        }
        if (Boolean(isPublished) !== Boolean(initialData.is_published)) {
          payload.is_published = Boolean(isPublished);
        }

        if (Object.keys(payload).length === 0) {
          toast('No changes were made to save.', 'info');
          onClose();
          setSubmitting(false);
          return;
        }

        const updated = await instagramReelsService.updateReel(initialData.id, payload);
        toast('Instagram reel updated successfully', 'success');
        onSuccess?.(updated);
        onClose();
      } else {
        const payload = {
          title: cleanTitle,
          instagram_url: normalizedUrl,
          description: cleanDesc,
          is_published: Boolean(isPublished),
          display_order: cleanOrder,
        };

        const created = await instagramReelsService.createReel(payload);
        toast('Instagram reel added successfully', 'success');
        onSuccess?.(created);
        onClose();
      }
    } catch (err) {
      const { fieldErrors: backendFields, generalMessage } =
        parseInstagramValidationErrors(err);
      if (Object.keys(backendFields).length > 0) {
        setFieldErrors(backendFields);
      }
      setGeneralError(generalMessage || 'Failed to save Instagram reel.');
      if (err?.response?.status === 403) {
        toast('Access denied. Administrator privileges required.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Instagram Reel #${initialData?.id}` : 'Add Instagram Reel'}
      description={
        isEdit
          ? 'Update reel title, Instagram link, display order, or publishing status.'
          : 'Paste an official Instagram Reel or Post URL and preview it before publishing.'
      }
      className="max-h-[90vh] max-w-4xl overflow-y-auto"
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="instagram-reel-form"
            disabled={submitting}
            className="inline-flex items-center gap-1.5"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{isEdit ? 'Saving...' : 'Adding...'}</span>
              </>
            ) : (
              <span>{isEdit ? 'Save Changes' : 'Add Reel'}</span>
            )}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Form Fields Column */}
        <form
          id="instagram-reel-form"
          onSubmit={handleSubmit}
          className="space-y-4 text-xs sm:text-sm lg:col-span-7"
        >
          {generalError ? (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <div className="flex-1">
                <p className="font-semibold">Unable to save reel</p>
                <p className="mt-0.5 text-red-600">{generalError}</p>
              </div>
            </div>
          ) : null}

          {/* Title */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="reel-title" className="text-xs font-semibold text-slate-700">
                Reel Title <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">{title.length}/200</span>
            </div>
            <input
              id="reel-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors.title) {
                  setFieldErrors((prev) => ({ ...prev, title: undefined }));
                }
              }}
              placeholder="e.g. Luxury Villa Handover Walkthrough"
              maxLength={200}
              required
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20 sm:text-sm"
            />
            {fieldErrors.title ? (
              <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.title}</p>
            ) : null}
          </div>

          {/* Instagram URL */}
          <div>
            <label htmlFor="reel-url" className="mb-1 block text-xs font-semibold text-slate-700">
              Instagram Reel / Post URL <span className="text-rose-500">*</span>
            </label>
            <input
              id="reel-url"
              type="url"
              value={instagramUrl}
              onChange={(e) => {
                setInstagramUrl(e.target.value);
                if (fieldErrors.instagram_url) {
                  setFieldErrors((prev) => ({ ...prev, instagram_url: undefined }));
                }
              }}
              placeholder="https://www.instagram.com/reel/Cxample123/"
              maxLength={500}
              required
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20 sm:text-sm"
            />

            {fieldErrors.instagram_url ? (
              <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.instagram_url}</p>
            ) : parsedUrl.valid ? (
              <div className="mt-1.5 flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50/70 px-2.5 py-1.5 text-[11px] text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span className="truncate font-mono">{parsedUrl.canonicalUrl}</span>
              </div>
            ) : !parsedUrl.empty && parsedUrl.error ? (
              <p className="mt-1 text-[11px] text-amber-700">{parsedUrl.error}</p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-400">
                Supports https://instagram.com/reel/..., /reels/..., or /p/... URLs.
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="reel-description" className="mb-1 block text-xs font-semibold text-slate-700">
              Description (Optional)
            </label>
            <textarea
              id="reel-description"
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (fieldErrors.description) {
                  setFieldErrors((prev) => ({ ...prev, description: undefined }));
                }
              }}
              placeholder="Brief caption or project context displayed alongside the reel..."
              maxLength={10000}
              className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20 sm:text-sm"
            />
            {fieldErrors.description ? (
              <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.description}</p>
            ) : null}
          </div>

          {/* Display Order */}
          <div>
            <label htmlFor="reel-order" className="mb-1 block text-xs font-semibold text-slate-700">
              Display Order
            </label>
            <input
              id="reel-order"
              type="number"
              min={0}
              step={1}
              value={displayOrder}
              onChange={(e) => {
                const raw = e.target.value;
                setDisplayOrder(raw === '' ? '' : Math.max(0, parseInt(raw, 10) || 0));
                if (fieldErrors.display_order) {
                  setFieldErrors((prev) => ({ ...prev, display_order: undefined }));
                }
              }}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20 sm:text-sm"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Lower numbers appear first on the public website (0 = highest priority).
            </p>
            {fieldErrors.display_order ? (
              <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.display_order}</p>
            ) : null}
          </div>

          {/* Publish Toggle */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div>
              <p className="text-xs font-semibold text-slate-800">
                {isEdit ? 'Published on Public Website' : 'Publish Immediately'}
              </p>
              <p className="text-[11px] text-slate-500">
                Only published reels appear publicly when the Instagram section is enabled.
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="sr-only peer"
              />
              <div className="h-5 w-10 rounded-full bg-slate-300 transition-all after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
            </label>
          </div>
        </form>

        {/* Live Official Embed Preview Column */}
        <div className="space-y-2 lg:col-span-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Live Embed Preview
          </p>
          <InstagramReelEmbedPreview
            embedUrl={previewEmbedUrl}
            instagramUrl={parsedUrl.valid ? parsedUrl.canonicalUrl : instagramUrl}
            title={title.trim() || initialData?.title}
            description={description.trim() || initialData?.description}
            compact
          />
        </div>
      </div>
    </Modal>
  );
}

export default InstagramReelFormModal;
