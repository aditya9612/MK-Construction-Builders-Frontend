import { useCallback, useEffect, useState } from 'react';
import { Images, Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/common/States';
import { Modal } from '../../components/modals/Modal';
import { toast, useUiStore } from '../../store/uiStore';
import { cmsUploadService } from '../../services/api/cmsUploadService';
import { extractErrorMessage } from '../../services/api/authService';
import {
  GALLERY_CATEGORIES,
  PUBLICATION_STATUSES,
  galleryService,
} from '../../services/api/galleryService';

const CATEGORY_LABELS = {
  projects: 'Projects',
  site: 'Site',
  interior: 'Interior',
  exterior: 'Exterior',
  team: 'Team',
  other: 'Other',
};

const PUBLICATION_LABELS = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
};

const fieldClass =
  'mt-1.5 h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10';
const textAreaClass =
  'mt-1.5 w-full resize-y rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10';

const EMPTY_DRAFT = {
  caption: '',
  category: 'other',
  publication_status: 'PUBLISHED',
  display_order: 0,
  object_position: 'center',
  image: '',
  mediaId: null,
};

function formatAddedDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(value)
  );
}

export default function SiteGalleryPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
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
  }, [search, category, publicationStatus]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await galleryService.list({
        page,
        page_size: 20,
        search,
        category,
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
      setError(extractErrorMessage(err, 'Unable to load gallery items.'));
    } finally {
      setLoading(false);
    }
  }, [page, search, category, publicationStatus]);

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
      caption: item.caption || '',
      category: item.category || 'other',
      publication_status: item.publication_status || 'PUBLISHED',
      display_order: item.display_order ?? 0,
      object_position: item.object_position || 'center',
      image: item.image || '',
      mediaId: item.media_id ?? null,
    });
    setEditorOpen(true);
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
      const uploaded = await cmsUploadService.uploadImage(file, 'gallery');
      setDraft((current) => ({
        ...current,
        image: uploaded.url || uploaded.url_path,
        mediaId: uploaded.id,
        caption: current.caption || uploaded.original_filename || current.caption,
      }));
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not upload this image.'), 'error');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!draft.mediaId) {
      toast('Upload an image before saving.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        media_id: Number(draft.mediaId),
        caption: draft.caption.trim() || null,
        category: draft.category,
        object_position: draft.object_position || 'center',
        display_order: Number(draft.display_order) || 0,
        publication_status: draft.publication_status,
      };
      if (editingId) {
        await galleryService.update(editingId, payload);
        toast('Gallery item updated.');
      } else {
        await galleryService.create(payload);
        toast('Gallery item published to the website CMS.');
      }
      setEditorOpen(false);
      await load();
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not save this gallery item.'), 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(item) {
    openConfirm({
      title: 'Delete gallery item?',
      message: `“${item.caption || 'This image'}” will be removed from the public website gallery.`,
      confirmLabel: 'Delete item',
      danger: true,
      onConfirm: async () => {
        try {
          await galleryService.delete(item.id);
          toast('Gallery item deleted.');
          await load();
        } catch (err) {
          toast(extractErrorMessage(err, 'Could not delete this gallery item.'), 'error');
        }
      },
    });
  }

  return (
    <div>
      <PageHeader
        title="Gallery"
        description="Upload images to the website CMS. Published items appear on the public gallery."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add gallery item
          </Button>
        }
      />

      <section aria-label="Gallery items">
        <div className="mb-4 flex flex-col gap-3 border-y border-line py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Filter by category"
              className="h-9 rounded-lg border border-line bg-white px-3 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            >
              <option value="">All categories</option>
              {GALLERY_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {CATEGORY_LABELS[value]}
                </option>
              ))}
            </select>
            <select
              value={publicationStatus}
              onChange={(event) => setPublicationStatus(event.target.value)}
              aria-label="Filter by publication"
              className="h-9 rounded-lg border border-line bg-white px-3 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            >
              <option value="">All publication</option>
              {PUBLICATION_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {PUBLICATION_LABELS[value]}
                </option>
              ))}
            </select>
            <span className="text-xs text-faint">{total} items</span>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search gallery"
              aria-label="Search gallery"
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
                    {item.image ? (
                      <img src={item.image} alt={item.caption || 'Gallery image'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-faint">
                        <Images className="h-8 w-8" />
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted shadow-sm">
                      {PUBLICATION_LABELS[item.publication_status] || item.publication_status}
                    </span>
                  </div>
                  <div className="p-3.5">
                    <h2 className="truncate text-sm font-semibold text-ink">{item.caption || 'Untitled image'}</h2>
                    <p className="mt-1 text-[13px] text-muted">{CATEGORY_LABELS[item.category] || item.category}</p>
                    <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                      <span className="text-xs text-faint">Added {formatAddedDate(item.created_at)}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          title="Edit gallery item"
                          aria-label={`Edit ${item.caption || 'gallery item'}`}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:bg-surface hover:text-brand"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          title="Delete gallery item"
                          aria-label={`Delete ${item.caption || 'gallery item'}`}
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
            icon={Images}
            title="Your gallery is empty"
            description="Upload an image and save it to the CMS. Published items appear on the public website."
            actionLabel="Add first item"
            onAction={openCreate}
          />
        )}
      </section>

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editingId ? 'Edit gallery item' : 'Add gallery item'}
        description="Upload an image, then save it as a published gallery item for the public website."
        className="max-w-xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="gallery-item-form" disabled={saving || uploading} loading={saving}>
              {editingId ? 'Save changes' : 'Save to website'}
            </Button>
          </>
        }
      >
        <form id="gallery-item-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <span className="text-[13px] font-medium text-ink">Image</span>
            <div className="mt-1.5 rounded-lg border border-dashed border-[#C5D3DF] bg-surface p-3">
              {draft.image ? (
                <div className="relative overflow-hidden rounded-md bg-white">
                  <img src={draft.image} alt="Gallery upload preview" className="max-h-52 w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setDraft((current) => ({ ...current, image: '', mediaId: null }))}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md bg-white/95 text-muted shadow-sm hover:text-danger"
                    aria-label="Remove image"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-md bg-white px-4 py-5 text-center hover:bg-[#FBFDFF]">
                  <Upload className="h-5 w-5 text-brand" />
                  <span className="text-[13px] font-medium text-ink">Choose an image to upload</span>
                  <span className="text-xs text-faint">PNG, JPG, or WebP. Saved to the gallery folder.</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleImageChange} />
                </label>
              )}
              {uploading ? <p className="mt-2 text-center text-xs text-muted">Uploading…</p> : null}
            </div>
          </div>

          <div>
            <label htmlFor="gallery-caption" className="text-[13px] font-medium text-ink">
              Caption <span className="font-normal text-faint">(optional)</span>
            </label>
            <input
              id="gallery-caption"
              value={draft.caption}
              onChange={(event) => setDraft((current) => ({ ...current, caption: event.target.value }))}
              maxLength={500}
              placeholder="e.g. Completed villa exterior"
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label htmlFor="gallery-category">
              <span className="text-[13px] font-medium text-ink">Category</span>
              <select
                id="gallery-category"
                value={draft.category}
                onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
                className={fieldClass}
              >
                {GALLERY_CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {CATEGORY_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="gallery-publication">
              <span className="text-[13px] font-medium text-ink">Publication</span>
              <select
                id="gallery-publication"
                value={draft.publication_status}
                onChange={(event) => setDraft((current) => ({ ...current, publication_status: event.target.value }))}
                className={fieldClass}
              >
                {PUBLICATION_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {PUBLICATION_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <label htmlFor="gallery-order" className="text-[13px] font-medium text-ink">
              Display order
            </label>
            <input
              id="gallery-order"
              type="number"
              min="0"
              value={draft.display_order}
              onChange={(event) => setDraft((current) => ({ ...current, display_order: event.target.value }))}
              className={fieldClass}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
