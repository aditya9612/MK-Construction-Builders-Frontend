import { useEffect, useRef, useState } from 'react';
import {
  Upload,
  X,
  Star,
  Globe,
  Laptop,
  PenTool,
  AlertCircle,
  Loader2,
  Building2,
  Calendar,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { Modal } from '../../components/modals/Modal';
import { Button } from '../../components/common/Button';
import {
  customerFeedbackService,
  parseValidationErrors,
  validateCustomerPhotoFile,
  REVIEW_SOURCES,
} from '../../services/api/customerFeedbackService';
import { toast } from '../../store/uiStore';

const URL_REGEX = /^https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;%=]+$/i;

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function FeedbackFormModal({ open, onClose, onSuccess, initialData = null }) {
  const isEdit = Boolean(initialData?.id);
  const fileInputRef = useRef(null);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerLocation, setCustomerLocation] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [projectName, setProjectName] = useState('');
  const [reviewSource, setReviewSource] = useState('website');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [reviewDate, setReviewDate] = useState(getTodayString());
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  // Photo states
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Status & error states
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  // Reset or initialize form data when modal opens
  useEffect(() => {
    if (!open) {
      setPhotoFile(null);
      setPhotoPreview('');
      setPhotoRemoved(false);
      setFieldErrors({});
      setGeneralError('');
      return;
    }

    if (initialData) {
      setCustomerName(initialData.customer_name || '');
      setCustomerLocation(initialData.customer_location || '');
      setRating(Number(initialData.rating) || 5);
      setReviewTitle(initialData.review_title || '');
      setReviewMessage(initialData.review_message || '');
      setProjectName(initialData.project_name || '');
      setReviewSource(initialData.review_source || 'website');
      setGoogleReviewUrl(initialData.google_review_url || '');
      setReviewDate(initialData.review_date || getTodayString());
      setDisplayOrder(Number(initialData.display_order) || 0);
      setIsPublished(Boolean(initialData.is_published));
      setIsFeatured(Boolean(initialData.is_featured));
      setPhotoPreview(initialData.customer_photo_url || initialData.customer_photo || '');
      setPhotoRemoved(false);
      setPhotoFile(null);
    } else {
      setCustomerName('');
      setCustomerLocation('');
      setRating(5);
      setReviewTitle('');
      setReviewMessage('');
      setProjectName('');
      setReviewSource('website');
      setGoogleReviewUrl('');
      setReviewDate(getTodayString());
      setDisplayOrder(0);
      setIsPublished(false); // Do not automatically publish newly created review
      setIsFeatured(false);
      setPhotoPreview('');
      setPhotoRemoved(false);
      setPhotoFile(null);
    }

    setFieldErrors({});
    setGeneralError('');
  }, [open, initialData]);

  // Handle local photo selection
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationMsg = validateCustomerPhotoFile(file);
    if (validationMsg) {
      setFieldErrors((prev) => ({ ...prev, customer_photo: validationMsg }));
      return;
    }

    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy.customer_photo;
      return copy;
    });

    setPhotoFile(file);
    setPhotoRemoved(false);

    // Create local object URL for preview
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    setPhotoRemoved(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Client-side field validation
  const validateForm = () => {
    const errors = {};

    if (!customerName || !customerName.trim()) {
      errors.customer_name = 'Customer name is required.';
    } else if (customerName.trim().length > 150) {
      errors.customer_name = 'Customer name must not exceed 150 characters.';
    }

    if (!customerLocation || !customerLocation.trim()) {
      errors.customer_location = 'Customer location is required.';
    } else if (customerLocation.trim().length > 150) {
      errors.customer_location = 'Customer location must not exceed 150 characters.';
    }

    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5 || !Number.isInteger(ratingNum)) {
      errors.rating = 'Rating must be an integer between 1 and 5.';
    }

    if (!reviewMessage || !reviewMessage.trim()) {
      errors.review_message = 'Review message is required.';
    }

    if (reviewTitle && reviewTitle.trim().length > 200) {
      errors.review_title = 'Review title must not exceed 200 characters.';
    }

    if (projectName && projectName.trim().length > 200) {
      errors.project_name = 'Project name must not exceed 200 characters.';
    }

    if (googleReviewUrl && googleReviewUrl.trim()) {
      const url = googleReviewUrl.trim();
      if (!URL_REGEX.test(url)) {
        errors.google_review_url = 'Google review URL must be a valid HTTP or HTTPS address.';
      }
    }

    if (displayOrder < 0 || !Number.isInteger(Number(displayOrder))) {
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
      let finalPhotoPath = initialData?.customer_photo || null;

      // 1. If photo was explicitly removed in Edit mode
      if (isEdit && photoRemoved) {
        finalPhotoPath = null;
      }

      // 2. If a new photo file was picked, upload it via the standalone photo upload endpoint
      if (photoFile) {
        setIsUploadingPhoto(true);
        try {
          const uploadRes = await customerFeedbackService.uploadPhoto(photoFile);
          finalPhotoPath = uploadRes.url_path;
        } catch (uploadErr) {
          setIsUploadingPhoto(false);
          const { generalMessage } = parseValidationErrors(uploadErr);
          setFieldErrors((prev) => ({
            ...prev,
            customer_photo: generalMessage || 'Failed to upload photo.',
          }));
          setSubmitting(false);
          return;
        }
        setIsUploadingPhoto(false);
      }

      if (isEdit) {
        // Partial Update: Only send changed fields
        const payload = {};

        if (customerName.trim() !== (initialData.customer_name || '')) {
          payload.customer_name = customerName.trim();
        }
        if (customerLocation.trim() !== (initialData.customer_location || '')) {
          payload.customer_location = customerLocation.trim();
        }
        if (Number(rating) !== Number(initialData.rating)) {
          payload.rating = Number(rating);
        }
        if (reviewTitle.trim() !== (initialData.review_title || '')) {
          payload.review_title = reviewTitle.trim() || null;
        }
        if (reviewMessage.trim() !== (initialData.review_message || '')) {
          payload.review_message = reviewMessage.trim();
        }
        if (projectName.trim() !== (initialData.project_name || '')) {
          payload.project_name = projectName.trim() || null;
        }
        if (reviewSource !== (initialData.review_source || 'website')) {
          payload.review_source = reviewSource;
        }
        if (googleReviewUrl.trim() !== (initialData.google_review_url || '')) {
          payload.google_review_url = googleReviewUrl.trim() || null;
        }
        if (reviewDate !== (initialData.review_date || '')) {
          payload.review_date = reviewDate || null;
        }
        if (Number(displayOrder) !== Number(initialData.display_order)) {
          payload.display_order = Number(displayOrder);
        }
        if (Boolean(isPublished) !== Boolean(initialData.is_published)) {
          payload.is_published = Boolean(isPublished);
        }
        if (Boolean(isFeatured) !== Boolean(initialData.is_featured)) {
          payload.is_featured = Boolean(isFeatured);
        }

        // Photo change tracking:
        if (photoRemoved) {
          payload.customer_photo = null;
        } else if (photoFile && finalPhotoPath) {
          payload.customer_photo = finalPhotoPath;
        }

        if (Object.keys(payload).length === 0) {
          toast('No changes were made to save.', 'info');
          onClose();
          setSubmitting(false);
          return;
        }

        const result = await customerFeedbackService.updateFeedback(initialData.id, payload);
        toast('Customer feedback updated successfully', 'success');
        onSuccess?.(result);
        onClose();
      } else {
        // Create Mode
        const payload = {
          customer_name: customerName.trim(),
          customer_location: customerLocation.trim(),
          rating: Number(rating),
          review_message: reviewMessage.trim(),
          review_source: reviewSource,
          display_order: Number(displayOrder) || 0,
          is_published: Boolean(isPublished),
          is_featured: Boolean(isFeatured),
        };

        if (finalPhotoPath) {
          payload.customer_photo = finalPhotoPath;
        }
        if (reviewTitle.trim()) {
          payload.review_title = reviewTitle.trim();
        }
        if (projectName.trim()) {
          payload.project_name = projectName.trim();
        }
        if (googleReviewUrl.trim()) {
          payload.google_review_url = googleReviewUrl.trim();
        }
        if (reviewDate) {
          payload.review_date = reviewDate;
        }

        const result = await customerFeedbackService.createFeedback(payload);
        toast('Customer feedback created successfully', 'success');
        onSuccess?.(result);
        onClose();
      }
    } catch (err) {
      const { fieldErrors: backendFields, generalMessage } = parseValidationErrors(err);
      if (Object.keys(backendFields).length > 0) {
        setFieldErrors(backendFields);
      }
      setGeneralError(generalMessage || 'Operation failed. Please verify input data.');
      if (err.response?.status === 403) {
        toast('Access denied. Administrator privileges required.', 'error');
      }
    } finally {
      setSubmitting(false);
      setIsUploadingPhoto(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Review #${initialData?.id}` : 'Add Customer Feedback'}
      description={
        isEdit
          ? 'Modify customer testimonial details, ratings, or publishing status.'
          : 'Create a new customer review or Google testimonial for the MK Construction website.'
      }
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="feedback-form"
            disabled={submitting}
            className="inline-flex items-center gap-1.5"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{isUploadingPhoto ? 'Uploading Photo...' : isEdit ? 'Updating...' : 'Saving...'}</span>
              </>
            ) : (
              <span>{isEdit ? 'Save Changes' : 'Create Feedback'}</span>
            )}
          </Button>
        </div>
      }
    >
      <form id="feedback-form" onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {/* General Error Banner */}
        {generalError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Unable to process request</p>
              <p className="mt-0.5 text-red-600">{generalError}</p>
            </div>
          </div>
        )}

        {/* Customer Photo Upload Section */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Customer Photo (Optional)
          </label>
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center shadow-xs">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Customer Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageIcon className="h-6 w-6 text-slate-400" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  id="customer-photo-file-input"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-slate-700"
                >
                  <Upload className="h-3.5 w-3.5 text-slate-500" />
                  <span>{photoPreview ? 'Change Photo' : 'Upload Photo'}</span>
                </Button>

                {photoPreview ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleRemovePhoto}
                    disabled={submitting}
                    className="inline-flex items-center gap-1 h-8 px-2 text-xs font-semibold text-rose-600 hover:text-rose-700 border-rose-200"
                    title="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </Button>
                ) : null}
              </div>
              <p className="text-[11px] text-slate-400">
                JPG, PNG, or WEBP up to 5 MB. SVG files are not supported.
              </p>
            </div>
          </div>
          {fieldErrors.customer_photo && (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.customer_photo}</p>
          )}
        </div>

        {/* Row 1: Customer Name & Customer Location */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                if (fieldErrors.customer_name) {
                  setFieldErrors((prev) => ({ ...prev, customer_name: undefined }));
                }
              }}
              placeholder="e.g. Rajesh Sharma"
              maxLength={150}
              required
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20"
            />
            {fieldErrors.customer_name && (
              <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.customer_name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Location / City <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={customerLocation}
              onChange={(e) => {
                setCustomerLocation(e.target.value);
                if (fieldErrors.customer_location) {
                  setFieldErrors((prev) => ({ ...prev, customer_location: undefined }));
                }
              }}
              placeholder="e.g. Pune, Maharashtra"
              maxLength={150}
              required
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20"
            />
            {fieldErrors.customer_location && (
              <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.customer_location}</p>
            )}
          </div>
        </div>

        {/* Row 2: Star Rating Selector & Review Source */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Rating */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Rating (1 to 5 Stars) <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-1.5 pt-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="rounded p-1 text-slate-300 hover:text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-300 transition-colors"
                  title={`${star} Star${star > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`h-5 w-5 ${
                      star <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-slate-100 text-slate-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-xs font-bold text-slate-700">
                {rating} / 5 Stars
              </span>
            </div>
            {fieldErrors.rating && (
              <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.rating}</p>
            )}
          </div>

          {/* Source */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Review Source
            </label>
            <select
              value={reviewSource}
              onChange={(e) => setReviewSource(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20 cursor-pointer"
            >
              {REVIEW_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Conditional Google Review URL */}
        {reviewSource === 'google' && (
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 space-y-1">
            <label className="block text-xs font-semibold text-blue-900">
              Google Review URL (Optional)
            </label>
            <input
              type="url"
              value={googleReviewUrl}
              onChange={(e) => {
                setGoogleReviewUrl(e.target.value);
                if (fieldErrors.google_review_url) {
                  setFieldErrors((prev) => ({ ...prev, google_review_url: undefined }));
                }
              }}
              placeholder="https://maps.google.com/?cid=..."
              className="h-9 w-full rounded-lg border border-blue-200 bg-white px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
            {fieldErrors.google_review_url ? (
              <p className="text-[11px] text-rose-600">{fieldErrors.google_review_url}</p>
            ) : (
              <p className="text-[11px] text-blue-700">
                Link to the authentic review on your Google Business profile.
              </p>
            )}
          </div>
        )}

        {/* Row 3: Review Title & Associated Project */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Review Title / Headline
            </label>
            <input
              type="text"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              placeholder="e.g. Excellent Villa Construction Quality"
              maxLength={200}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20"
            />
            {fieldErrors.review_title && (
              <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.review_title}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Related Construction Project
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Skyline Towers, Baner"
              maxLength={200}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20"
            />
            {fieldErrors.project_name && (
              <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.project_name}</p>
            )}
          </div>
        </div>

        {/* Review Message Textarea */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Customer Feedback Message <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            value={reviewMessage}
            onChange={(e) => {
              setReviewMessage(e.target.value);
              if (fieldErrors.review_message) {
                setFieldErrors((prev) => ({ ...prev, review_message: undefined }));
              }
            }}
            placeholder="Enter the customer's detailed feedback, experience, or testimonial..."
            required
            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20"
          />
          {fieldErrors.review_message && (
            <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.review_message}</p>
          )}
        </div>

        {/* Row 4: Review Date & Display Sequence */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Review Date
            </label>
            <input
              type="date"
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Display Sequence Order
            </label>
            <input
              type="number"
              min={0}
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Math.max(0, parseInt(e.target.value, 10) || 0))}
              placeholder="0"
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20"
            />
            {fieldErrors.display_order && (
              <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.display_order}</p>
            )}
          </div>
        </div>

        {/* Toggles: is_published & is_featured */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-800">Publish Immediately</p>
              <p className="text-[11px] text-slate-500">
                Visible publicly on the MK Construction website customer reviews page.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>

          <div className="border-t border-slate-200/60 pt-2.5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-800">Feature on Homepage</p>
              <p className="text-[11px] text-slate-500">
                Showcase prominently on top featured testimonial carousels.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600" />
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default FeedbackFormModal;
