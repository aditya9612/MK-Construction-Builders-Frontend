import { useCallback, useEffect, useState } from 'react';
import { Hammer, Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/common/States';
import { Modal } from '../../components/modals/Modal';
import { toast, useUiStore } from '../../store/uiStore';
import { cmsUploadService } from '../../services/api/cmsUploadService';
import { extractErrorMessage } from '../../services/api/authService';
import {
  SERVICE_PUBLICATION_STATUSES,
  cmsServiceService,
  slugifyServiceTitle,
} from '../../services/api/cmsServiceService';

const PUBLICATION_LABELS = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
};

const fieldClass =
  'mt-1.5 h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10';
const textAreaClass =
  'mt-1.5 w-full resize-y rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10';

const EMPTY_DRAFT = {
  title: '',
  slug: '',
  slugTouched: false,
  description: '',
  featuresText: '',
  publication_status: 'PUBLISHED',
  display_order: 0,
  image: '',
  imageId: null,
};

function parseFeatures(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function SiteServicesPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [publicationStatus, setPublicationStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const openConfirm = useUiStore((state) => state.openConfirm);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [search, publicationStatus]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await cmsServiceService.list({
        page,
        page_size: 20,
        search,
        publication_status: publicationStatus,
        sort_by: 'display_order',
        sort_order: 'asc',
      });
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      setItems([]);
      setTotal(0);
      setError(extractErrorMessage(err, 'Unable to load website services.'));
    } finally {
      setLoading(false);
    }
  }, [page, search, publicationStatus]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setDraft({ ...EMPTY_DRAFT });
    setEditorOpen(true);
  }

  function openEdit(item) {
    setEditingId(item.id);
    setDraft({
      title: item.title || '',
      slug: item.slug || '',
      slugTouched: true,
      description: item.description || '',
      featuresText: Array.isArray(item.features) ? item.features.join('\n') : '',
      publication_status: item.publication_status || 'PUBLISHED',
      display_order: item.display_order ?? 0,
      image: item.image?.url || '',
      imageId: item.image_id ?? item.image?.id ?? null,
    });
    setEditorOpen(true);
  }

  function setTitle(title) {
    setDraft((current) => ({
      ...current,
      title,
      slug: current.slugTouched ? current.slug : slugifyServiceTitle(title),
    }));
  }

  async function handleImageChange(event) {
    const file = Array.from(event.target.files || []).find((entry) => entry.type.startsWith('image/'));
    event.target.value = '';
    if (!file) {
      toast('Choose an image file to upload.', 'error');
      return;
    }
    setUploading(true);
    try {
      const uploaded = await cmsUploadService.uploadImage(file, 'services');
      setDraft((current) => ({
        ...current,
        image: uploaded.url || uploaded.url_path,
        imageId: uploaded.id,
      }));
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not upload this image.'), 'error');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const title = draft.title.trim();
    const slug = slugifyServiceTitle(draft.slug || title);
    if (!title) {
      toast('Enter a service title.', 'error');
      return;
    }
    if (!draft.imageId) {
      toast('Upload a service image before saving.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title,
        slug,
        description: draft.description.trim() || null,
        features: parseFeatures(draft.featuresText),
        image_id: Number(draft.imageId),
        display_order: Number(draft.display_order) || 0,
        publication_status: draft.publication_status,
      };
      if (editingId) {
        await cmsServiceService.update(editingId, payload);
        toast('Service updated.');
      } else {
        await cmsServiceService.create(payload);
        toast('Service saved to the website CMS.');
      }
      setEditorOpen(false);
      await load();
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not save this service.'), 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(item) {
    openConfirm({
      title: 'Delete service?',
      message: `“${item.title}” will be removed from the website CMS.`,
      confirmLabel: 'Delete service',
      danger: true,
      onConfirm: async () => {
        try {
          await cmsServiceService.delete(item.id);
          toast('Service deleted.');
          await load();
        } catch (err) {
          toast(extractErrorMessage(err, 'Could not delete this service.'), 'error');
        }
      },
    });
  }

  return (
    <div>
      <PageHeader
        title="Services"
        description="Create website service cards. Upload an image to folder=services, then save with image_id so published services appear on the public site."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add service
          </Button>
        }
      />

      <section aria-label="Website services">
        <div className="mb-4 flex flex-col gap-3 border-y border-line py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={publicationStatus}
              onChange={(event) => setPublicationStatus(event.target.value)}
              aria-label="Filter by publication"
              className="h-9 rounded-lg border border-line bg-white px-3 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            >
              <option value="">All publication</option>
              {SERVICE_PUBLICATION_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {PUBLICATION_LABELS[value]}
                </option>
              ))}
            </select>
            <span className="text-xs text-faint">{total} services</span>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search services"
              aria-label="Search services"
              className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
          </label>
        </div>

        {loading ? (
          <LoadingSkeleton rows={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : items.length ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <article key={item.id} className="overflow-hidden rounded-lg border border-line bg-white">
                  <div className="relative aspect-[16/10] overflow-hidden bg-surface">
                    {item.image?.url ? (
                      <img src={item.image.url} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-faint">
                        <Hammer className="h-8 w-8" />
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted shadow-sm">
                      {PUBLICATION_LABELS[item.publication_status] || item.publication_status || 'Draft'}
                    </span>
                  </div>
                  <div className="p-3.5">
                    <h2 className="truncate text-sm font-semibold text-ink">{item.title}</h2>
                    <p className="mt-1 line-clamp-2 min-h-10 text-[13px] leading-5 text-muted">
                      {item.description || 'No description'}
                    </p>
                    <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                      <span className="truncate text-xs text-faint">{item.slug}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          title="Edit service"
                          aria-label={`Edit ${item.title}`}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:bg-surface hover:text-brand"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          title="Delete service"
                          aria-label={`Delete ${item.title}`}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:bg-red-50 hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="h-9 rounded-lg border border-line px-3 text-[13px] font-medium text-ink disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-faint">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="h-9 rounded-lg border border-line px-3 text-[13px] font-medium text-ink disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState
            icon={Hammer}
            title="No website services"
            description="Add a service, upload an image, and publish it to show on the public Services page."
            actionLabel="Add service"
            onAction={openCreate}
          />
        )}
      </section>

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editingId ? 'Edit service' : 'Add service'}
        description="Upload an image first. The returned media ID is sent as image_id when the service is saved."
        className="max-h-[90vh] max-w-xl overflow-y-auto"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="cms-service-form" disabled={saving || uploading} loading={saving}>
              {editingId ? 'Save changes' : 'Save to website'}
            </Button>
          </>
        }
      >
        <form id="cms-service-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <span className="text-[13px] font-medium text-ink">Image</span>
            <div className="mt-1.5 rounded-lg border border-dashed border-[#C5D3DF] bg-surface p-3">
              {draft.image ? (
                <div className="relative overflow-hidden rounded-md bg-white">
                  <img src={draft.image} alt="Service preview" className="max-h-52 w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setDraft((current) => ({ ...current, image: '', imageId: null }))}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md bg-white/95 text-muted shadow-sm hover:text-danger"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-md bg-white px-4 py-5 text-center hover:bg-[#FBFDFF]">
                  <Upload className="h-5 w-5 text-brand" />
                  <span className="text-[13px] font-medium text-ink">Choose a service image</span>
                  <span className="text-xs text-faint">PNG, JPG, or WebP. Uploaded to the services folder.</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleImageChange} />
                </label>
              )}
              {uploading ? <p className="mt-2 text-center text-xs text-muted">Uploading…</p> : null}
            </div>
          </div>

          <div>
            <label htmlFor="service-title" className="text-[13px] font-medium text-ink">
              Title
            </label>
            <input
              id="service-title"
              value={draft.title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              required
              placeholder="e.g. Residential Construction"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="service-slug" className="text-[13px] font-medium text-ink">
              Slug
            </label>
            <input
              id="service-slug"
              value={draft.slug}
              onChange={(event) =>
                setDraft((current) => ({ ...current, slug: event.target.value, slugTouched: true }))
              }
              maxLength={220}
              required
              placeholder="residential"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="service-description" className="text-[13px] font-medium text-ink">
              Description
            </label>
            <textarea
              id="service-description"
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              rows={3}
              className={textAreaClass}
            />
          </div>

          <div>
            <label htmlFor="service-features" className="text-[13px] font-medium text-ink">
              Features <span className="font-normal text-faint">(one per line)</span>
            </label>
            <textarea
              id="service-features"
              value={draft.featuresText}
              onChange={(event) => setDraft((current) => ({ ...current, featuresText: event.target.value }))}
              rows={4}
              placeholder={'Planning support\nQuality-focused build\nOn-time focus'}
              className={textAreaClass}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label htmlFor="service-publication">
              <span className="text-[13px] font-medium text-ink">Publication</span>
              <select
                id="service-publication"
                value={draft.publication_status}
                onChange={(event) => setDraft((current) => ({ ...current, publication_status: event.target.value }))}
                className={fieldClass}
              >
                {SERVICE_PUBLICATION_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {PUBLICATION_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="service-order">
              <span className="text-[13px] font-medium text-ink">Display order</span>
              <input
                id="service-order"
                type="number"
                min="0"
                value={draft.display_order}
                onChange={(event) => setDraft((current) => ({ ...current, display_order: event.target.value }))}
                className={fieldClass}
              />
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
