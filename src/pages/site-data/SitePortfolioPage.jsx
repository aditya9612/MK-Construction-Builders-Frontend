import { useCallback, useEffect, useState } from 'react';
import { Briefcase, MapPin, Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/common/States';
import { Modal } from '../../components/modals/Modal';
import { toast, useUiStore } from '../../store/uiStore';
import { extractErrorMessage } from '../../services/api/authService';
import { cmsUploadService } from '../../services/api/cmsUploadService';
import {
  PORTFOLIO_STATUSES,
  PORTFOLIO_TYPES,
  PUBLICATION_STATUSES,
  portfolioService,
  slugifyPortfolioName,
} from '../../services/api/portfolioService';

const TYPE_LABELS = {
  RESIDENTIAL: 'Residential',
  COMMERCIAL: 'Commercial',
  INDUSTRIAL: 'Industrial',
  RENOVATION: 'Renovation',
  OTHER: 'Other',
};

const STATUS_LABELS = {
  PLANNED: 'Planned',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  SHOWCASE: 'Showcase',
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
  name: '',
  slug: '',
  slugTouched: false,
  location: '',
  type: 'RESIDENTIAL',
  status: 'COMPLETED',
  publication_status: 'PUBLISHED',
  display_order: 0,
  description: '',
  overview: '',
  work_progress: '',
  final_result: '',
  image: '',
  mainImageId: null,
  gallery: [],
  pendingGalleryIds: [],
};

function formatLabel(value, map) {
  return map[value] || value || '—';
}

export default function SitePortfolioPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
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
  }, [search, type, status, publicationStatus]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await portfolioService.listAdmin({
        page,
        page_size: 20,
        search,
        type,
        status,
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
      setError(extractErrorMessage(err, 'Unable to load portfolio projects.'));
    } finally {
      setLoading(false);
    }
  }, [page, search, type, status, publicationStatus]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setDraft({ ...EMPTY_DRAFT });
    setEditorOpen(true);
  }

  async function openEdit(project) {
    setEditingId(project.id);
    setEditorOpen(true);
    setSaving(true);
    try {
      const detail = await portfolioService.get(project.id);
      setDraft({
        name: detail.name || '',
        slug: detail.slug || '',
        slugTouched: true,
        location: detail.location || '',
        type: detail.type || 'RESIDENTIAL',
        status: detail.status || 'COMPLETED',
        publication_status: detail.publication_status || 'PUBLISHED',
        display_order: detail.display_order ?? 0,
        description: detail.description || '',
        overview: detail.overview || '',
        work_progress: detail.work_progress || '',
        final_result: detail.final_result || '',
        image: detail.main_image?.url || '',
        mainImageId: detail.main_image_id ?? detail.main_image?.id ?? null,
        gallery: detail.gallery || [],
        pendingGalleryIds: [],
      });
    } catch (err) {
      toast(extractErrorMessage(err, 'Unable to load this project.'), 'error');
      setEditorOpen(false);
    } finally {
      setSaving(false);
    }
  }

  function setName(name) {
    setDraft((current) => ({
      ...current,
      name,
      slug: current.slugTouched ? current.slug : slugifyPortfolioName(name),
    }));
  }

  async function handleMainImageChange(event) {
    const file = Array.from(event.target.files || []).find((entry) => entry.type.startsWith('image/'));
    event.target.value = '';
    if (!file) {
      toast('Choose an image file to upload.', 'error');
      return;
    }
    setUploading(true);
    try {
      const uploaded = await cmsUploadService.uploadImage(file, 'projects');
      setDraft((current) => ({
        ...current,
        image: uploaded.url || uploaded.url_path,
        mainImageId: uploaded.id,
      }));
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not upload this image.'), 'error');
    } finally {
      setUploading(false);
    }
  }

  async function handleGalleryImagesChange(event) {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/'));
    event.target.value = '';
    if (!files.length) {
      toast('Choose one or more image files to upload.', 'error');
      return;
    }
    setUploading(true);
    try {
      const uploaded = files.length === 1
        ? [await cmsUploadService.uploadImage(files[0], 'projects')]
        : await cmsUploadService.uploadImages(files, 'projects');
      const ids = uploaded.map((media) => media.id).filter((id) => id != null);
      if (editingId && ids.length) {
        const updated = await portfolioService.attachGallery(editingId, ids);
        setDraft((current) => ({
          ...current,
          gallery: updated.gallery || [],
        }));
        toast('Gallery images attached.');
        return;
      }
      setDraft((current) => ({
        ...current,
        pendingGalleryIds: [...current.pendingGalleryIds, ...ids],
        gallery: [
          ...current.gallery,
          ...uploaded.map((media) => ({
            media_id: media.id,
            url: media.url || media.url_path,
          })),
        ],
      }));
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not upload gallery images.'), 'error');
    } finally {
      setUploading(false);
    }
  }

  async function handleDetachGallery(mediaId) {
    if (!mediaId) return;
    if (editingId) {
      try {
        const updated = await portfolioService.detachGalleryMedia(editingId, mediaId);
        setDraft((current) => ({ ...current, gallery: updated.gallery || [] }));
      } catch (err) {
        toast(extractErrorMessage(err, 'Could not remove this gallery image.'), 'error');
      }
      return;
    }
    setDraft((current) => ({
      ...current,
      pendingGalleryIds: current.pendingGalleryIds.filter((id) => id !== mediaId),
      gallery: current.gallery.filter((entry) => entry.media_id !== mediaId),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const name = draft.name.trim();
    const slug = slugifyPortfolioName(draft.slug || name);
    if (!name) {
      toast('Enter a project name.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const payload = {
          name,
          slug,
          location: draft.location.trim() || null,
          type: draft.type,
          status: draft.status,
          publication_status: draft.publication_status,
          display_order: Number(draft.display_order) || 0,
          description: draft.description.trim() || null,
          overview: draft.overview.trim() || null,
          work_progress: draft.work_progress.trim() || null,
          final_result: draft.final_result.trim() || null,
        };
        if (draft.mainImageId) {
          payload.main_image_id = Number(draft.mainImageId);
        } else {
          payload.clear_main_image = true;
        }
        await portfolioService.update(editingId, payload);
        toast('Portfolio project updated.');
      } else {
        await portfolioService.create({
          name,
          slug,
          location: draft.location.trim() || null,
          type: draft.type,
          status: draft.status,
          publication_status: draft.publication_status,
          display_order: Number(draft.display_order) || 0,
          description: draft.description.trim() || null,
          overview: draft.overview.trim() || null,
          work_progress: draft.work_progress.trim() || null,
          final_result: draft.final_result.trim() || null,
          main_image_id: draft.mainImageId ? Number(draft.mainImageId) : null,
          gallery_media_ids: draft.pendingGalleryIds,
        });
        toast('Portfolio project saved to the website CMS.');
      }
      setEditorOpen(false);
      await load();
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not save this portfolio project.'), 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(project) {
    openConfirm({
      title: 'Delete portfolio project?',
      message: `“${project.name}” will be removed from the website CMS.`,
      confirmLabel: 'Delete project',
      danger: true,
      onConfirm: async () => {
        try {
          await portfolioService.delete(project.id);
          toast('Portfolio project deleted.');
          await load();
        } catch (err) {
          toast(extractErrorMessage(err, 'Could not delete this project.'), 'error');
        }
      },
    });
  }

  return (
    <div>
      <PageHeader
        title="Portfolio"
        description="Create website portfolio projects. Upload a cover image, then save with main_image_id so it appears on the public site when published."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add project
          </Button>
        }
      />

      <section aria-label="Portfolio projects">
        <div className="mb-4 flex flex-col gap-3 border-y border-line py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              aria-label="Filter by type"
              className="h-9 rounded-lg border border-line bg-white px-3 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            >
              <option value="">All types</option>
              {PORTFOLIO_TYPES.map((value) => (
                <option key={value} value={value}>
                  {TYPE_LABELS[value]}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter by status"
              className="h-9 rounded-lg border border-line bg-white px-3 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            >
              <option value="">All statuses</option>
              {PORTFOLIO_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
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
            <span className="text-xs text-faint">{total} projects</span>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search portfolio"
              aria-label="Search portfolio"
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
              {items.map((project) => (
                <article key={project.id} className="overflow-hidden rounded-lg border border-line bg-white">
                  <div className="relative aspect-[16/10] overflow-hidden bg-surface">
                    {project.main_image?.url ? (
                      <img
                        src={project.main_image.url}
                        alt={project.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-faint">
                        <Briefcase className="h-8 w-8" />
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted shadow-sm">
                      {PUBLICATION_LABELS[project.publication_status] || project.publication_status || 'Draft'}
                    </span>
                  </div>
                  <div className="p-3.5">
                    <h2 className="truncate text-sm font-semibold text-ink">{project.name}</h2>
                    <p className="mt-1 flex items-center gap-1 text-[13px] text-muted">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-faint" />
                      <span className="truncate">{project.location || 'Location not set'}</span>
                    </p>
                    <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs">
                      <span className="text-muted">{formatLabel(project.type, TYPE_LABELS)}</span>
                      <div className="flex items-center gap-1">
                        <span className="rounded bg-surface px-2 py-1 font-medium text-ink">
                          {formatLabel(project.status, STATUS_LABELS)}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEdit(project)}
                          title="Edit project"
                          aria-label={`Edit ${project.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:bg-surface hover:text-brand"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(project)}
                          title="Delete project"
                          aria-label={`Delete ${project.name}`}
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
            icon={Briefcase}
            title="No portfolio projects"
            description="Add a project, upload a cover image, and publish it to show on the public website."
            actionLabel="Add project"
            onAction={openCreate}
          />
        )}
      </section>

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editingId ? 'Edit portfolio project' : 'Add portfolio project'}
        description="Upload a cover image first. The returned media ID is sent as main_image_id when the project is saved."
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="portfolio-project-form" disabled={saving || uploading} loading={saving}>
              {editingId ? 'Save changes' : 'Save to website'}
            </Button>
          </>
        }
      >
        <form id="portfolio-project-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <span className="text-[13px] font-medium text-ink">Cover image</span>
            <div className="mt-1.5 rounded-lg border border-dashed border-[#C5D3DF] bg-surface p-3">
              {draft.image ? (
                <div className="relative overflow-hidden rounded-md bg-white">
                  <img src={draft.image} alt="Cover preview" className="max-h-52 w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setDraft((current) => ({ ...current, image: '', mainImageId: null }))}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md bg-white/95 text-muted shadow-sm hover:text-danger"
                    aria-label="Remove cover image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-md bg-white px-4 py-5 text-center hover:bg-[#FBFDFF]">
                  <Upload className="h-5 w-5 text-brand" />
                  <span className="text-[13px] font-medium text-ink">Choose a cover image</span>
                  <span className="text-xs text-faint">PNG, JPG, or WebP. Uploaded to the projects folder.</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleMainImageChange} />
                </label>
              )}
              {uploading ? <p className="mt-2 text-center text-xs text-muted">Uploading…</p> : null}
            </div>
          </div>

          <div>
            <label htmlFor="portfolio-name" className="text-[13px] font-medium text-ink">
              Project name
            </label>
            <input
              id="portfolio-name"
              value={draft.name}
              onChange={(event) => setName(event.target.value)}
              maxLength={200}
              required
              placeholder="e.g. Baner Residence"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="portfolio-slug" className="text-[13px] font-medium text-ink">
              Slug
            </label>
            <input
              id="portfolio-slug"
              value={draft.slug}
              onChange={(event) =>
                setDraft((current) => ({ ...current, slug: event.target.value, slugTouched: true }))
              }
              maxLength={220}
              required
              placeholder="baner-residence"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="portfolio-location" className="text-[13px] font-medium text-ink">
              Location
            </label>
            <input
              id="portfolio-location"
              value={draft.location}
              onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))}
              maxLength={200}
              placeholder="Pune"
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label htmlFor="portfolio-type">
              <span className="text-[13px] font-medium text-ink">Type</span>
              <select
                id="portfolio-type"
                value={draft.type}
                onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}
                className={fieldClass}
              >
                {PORTFOLIO_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {TYPE_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="portfolio-status">
              <span className="text-[13px] font-medium text-ink">Status</span>
              <select
                id="portfolio-status"
                value={draft.status}
                onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
                className={fieldClass}
              >
                {PORTFOLIO_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="portfolio-publication">
              <span className="text-[13px] font-medium text-ink">Publication</span>
              <select
                id="portfolio-publication"
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
            <label htmlFor="portfolio-order">
              <span className="text-[13px] font-medium text-ink">Display order</span>
              <input
                id="portfolio-order"
                type="number"
                min="0"
                value={draft.display_order}
                onChange={(event) => setDraft((current) => ({ ...current, display_order: event.target.value }))}
                className={fieldClass}
              />
            </label>
          </div>

          <div>
            <label htmlFor="portfolio-description" className="text-[13px] font-medium text-ink">
              Description <span className="font-normal text-faint">(optional)</span>
            </label>
            <textarea
              id="portfolio-description"
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              rows={3}
              className={textAreaClass}
            />
          </div>

          <div>
            <span className="text-[13px] font-medium text-ink">Gallery images</span>
            <div className="mt-1.5 rounded-lg border border-dashed border-[#C5D3DF] bg-surface p-3">
              {draft.gallery.length ? (
                <div className="mb-3 grid grid-cols-3 gap-2">
                  {draft.gallery.map((entry) => (
                    <div key={entry.media_id || entry.id} className="relative overflow-hidden rounded-md bg-white">
                      {entry.url ? (
                        <img src={entry.url} alt="" className="aspect-square w-full object-cover" />
                      ) : (
                        <div className="flex aspect-square items-center justify-center text-faint">
                          <Briefcase className="h-5 w-5" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDetachGallery(entry.media_id)}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded bg-white/95 text-muted hover:text-danger"
                        aria-label="Remove gallery image"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md bg-white px-3 py-3 text-center hover:bg-[#FBFDFF]">
                <Upload className="h-4 w-4 text-brand" />
                <span className="text-[13px] font-medium text-ink">Add gallery images</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="sr-only"
                  onChange={handleGalleryImagesChange}
                />
              </label>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
