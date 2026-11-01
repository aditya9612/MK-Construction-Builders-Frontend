import { useMemo, useState } from 'react';
import {
  ExternalLink,
  Film,
  ImagePlus,
  Images,
  Link2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/modals/Modal';
import { storage } from '../../utils/storage/localStorage';
import { toast, useUiStore } from '../../store/uiStore';

const STORAGE_KEY = 'mk_site_gallery_demo_v1';
const DEMO_ITEMS = [
  {
    id: 'demo-home',
    title: 'Contemporary home exterior',
    description: 'A sample project image for the public site gallery.',
    type: 'image',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1100&q=85',
    createdAt: '2026-10-24T10:00:00.000Z',
    demo: true,
  },
  {
    id: 'demo-interior',
    title: 'Interior finish showcase',
    description: 'A sample interior image. Edit or remove this demo item.',
    type: 'image',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1100&q=85',
    createdAt: '2026-10-18T10:00:00.000Z',
    demo: true,
  },
];

const fieldClass = 'mt-1.5 h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10';
const textAreaClass = 'mt-1.5 w-full resize-y rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10';

function readImage(file) {
  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      const maxDimension = 1440;
      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Could not process this image.'));
        return;
      }
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Could not process this image.'));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Could not read this image.'));
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.82);
    };
    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error('This image could not be opened.'));
    };
    image.src = imageUrl;
  });
}

function formatAddedDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

export default function SiteGalleryPage() {
  const [items, setItems] = useState(() => storage.get(STORAGE_KEY, DEMO_ITEMS));
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ title: '', description: '', type: 'image', image: '', videoUrl: '' });
  const openConfirm = useUiStore((state) => state.openConfirm);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesFilter = filter === 'all' || item.type === filter;
      const matchesQuery = !normalizedQuery || `${item.title} ${item.description}`.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [items, query, filter]);

  const counts = useMemo(() => ({
    all: items.length,
    image: items.filter((item) => item.type === 'image').length,
    video: items.filter((item) => item.type === 'video').length,
  }), [items]);

  function persist(nextItems, successMessage) {
    try {
      storage.set(STORAGE_KEY, nextItems);
      setItems(nextItems);
      toast(successMessage);
      return true;
    } catch {
      toast('Could not save this gallery item. Try a smaller image.', 'error');
      return false;
    }
  }

  function openCreate() {
    setEditingId(null);
    setDraft({ title: '', description: '', type: 'image', image: '', videoUrl: '' });
    setEditorOpen(true);
  }

  function openEdit(item) {
    setEditingId(item.id);
    setDraft({
      title: item.title,
      description: item.description || '',
      type: item.type,
      image: item.image || '',
      videoUrl: item.videoUrl || '',
    });
    setEditorOpen(true);
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Choose an image file to upload.', 'error');
      return;
    }
    setSaving(true);
    try {
      const image = await readImage(file);
      setDraft((current) => ({ ...current, image }));
    } catch (error) {
      toast(error.message || 'Could not process this image.', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    const title = draft.title.trim();
    if (!title) {
      toast('Add a title for this gallery item.', 'error');
      return;
    }
    if (draft.type === 'image' && !draft.image) {
      toast('Upload an image before saving.', 'error');
      return;
    }

    let videoUrl = '';
    if (draft.type === 'video') {
      try {
        const parsedUrl = new URL(draft.videoUrl.trim());
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error();
        videoUrl = parsedUrl.toString();
      } catch {
        toast('Enter a valid video link beginning with http:// or https://.', 'error');
        return;
      }
    }

    const previous = items.find((item) => item.id === editingId);
    const nextItem = {
      id: editingId || `gallery-${Date.now()}`,
      title,
      description: draft.description.trim(),
      type: draft.type,
      image: draft.type === 'image' ? draft.image : '',
      videoUrl: draft.type === 'video' ? videoUrl : '',
      createdAt: previous?.createdAt || new Date().toISOString(),
      demo: false,
    };
    const nextItems = editingId
      ? items.map((item) => (item.id === editingId ? nextItem : item))
      : [nextItem, ...items];

    if (persist(nextItems, editingId ? 'Gallery item updated.' : 'Gallery item added.')) {
      setEditorOpen(false);
    }
  }

  function handleDelete(item) {
    openConfirm({
      title: 'Delete gallery item?',
      message: `“${item.title}” will be removed from this demo gallery.`,
      confirmLabel: 'Delete item',
      danger: true,
      onConfirm: () => persist(items.filter((entry) => entry.id !== item.id), 'Gallery item deleted.'),
    });
  }

  return (
    <div>
      <PageHeader
        eyebrow=""
        title="Gallery"
        description="Manage the images and video links shown on your public site."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add gallery item
          </Button>
        }
      />

      <section aria-label="Gallery items">
        <div className="mb-4 flex flex-col gap-3 border-y border-line py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Filter gallery items">
            {[
              { key: 'all', label: 'All', count: counts.all },
              { key: 'image', label: 'Images', count: counts.image },
              { key: 'video', label: 'Videos', count: counts.video },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setFilter(option.key)}
                className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-[13px] font-medium transition ${filter === option.key ? 'bg-brand-navy text-white' : 'text-muted hover:bg-surface hover:text-ink'}`}
                aria-pressed={filter === option.key}
              >
                {option.label}
                <span className={filter === option.key ? 'text-white/70' : 'text-faint'}>{option.count}</span>
              </button>
            ))}
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

        {visibleItems.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-lg border border-line bg-white">
                <div className="relative aspect-[16/10] overflow-hidden bg-surface">
                  {item.type === 'image' ? (
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 bg-[#102F4F] text-white">
                      <Film className="h-8 w-8 text-sky-300" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-white/75">Video link</span>
                      <a
                        href={item.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 flex items-end justify-end p-3"
                        aria-label={`Open video: ${item.title}`}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand-navy">
                          <ExternalLink className="h-4 w-4" />
                        </span>
                      </a>
                    </div>
                  )}
                  {item.demo ? (
                    <span className="absolute left-3 top-3 rounded bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted shadow-sm">
                      Demo
                    </span>
                  ) : null}
                </div>
                <div className="p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-ink">{item.title}</h2>
                      <p className="mt-1 line-clamp-2 min-h-10 text-[13px] leading-5 text-muted">
                        {item.description || (item.type === 'video' ? item.videoUrl : 'No description')}
                      </p>
                    </div>
                    <span className="mt-0.5 shrink-0 text-faint" title={item.type === 'image' ? 'Image' : 'Video'}>
                      {item.type === 'image' ? <Images className="h-4 w-4" /> : <Film className="h-4 w-4" />}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                    <span className="text-xs text-faint">Added {formatAddedDate(item.createdAt)}</span>
                    <div className="flex items-center gap-1">
                      {item.type === 'video' ? (
                        <a
                          href={item.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Open video link"
                          aria-label={`Open video link for ${item.title}`}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:bg-surface hover:text-brand"
                        >
                          <Link2 className="h-4 w-4" />
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        title="Edit gallery item"
                        aria-label={`Edit ${item.title}`}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:bg-surface hover:text-brand"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        title="Delete gallery item"
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
        ) : (
          <div className="flex min-h-56 flex-col items-center justify-center border-b border-line px-5 py-12 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-brand">
              <Images className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-semibold text-ink">
              {items.length ? 'No matching gallery items' : 'Your gallery is empty'}
            </h2>
            <p className="mt-1 max-w-md text-sm text-muted">
              {items.length ? 'Try another search or filter.' : 'Add an image or video link to start building your site gallery.'}
            </p>
            {!items.length ? (
              <Button className="mt-4" size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Add first item
              </Button>
            ) : null}
          </div>
        )}
      </section>

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editingId ? 'Edit gallery item' : 'Add gallery item'}
        description="Add an image or link a video for your public site gallery."
        className="max-w-xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button type="submit" form="gallery-item-form" disabled={saving}>
              {editingId ? 'Save changes' : 'Add to gallery'}
            </Button>
          </>
        }
      >
        <form id="gallery-item-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="gallery-title" className="text-[13px] font-medium text-ink">Title</label>
            <input
              id="gallery-title"
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              maxLength={100}
              required
              placeholder="e.g. Completed villa exterior"
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="gallery-description" className="text-[13px] font-medium text-ink">Description <span className="font-normal text-faint">(optional)</span></label>
            <textarea
              id="gallery-description"
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              maxLength={300}
              rows={3}
              placeholder="Add a short description"
              className={textAreaClass}
            />
          </div>

          <div>
            <span className="text-[13px] font-medium text-ink">Media type</span>
            <div className="mt-1.5 inline-flex rounded-lg border border-line bg-surface p-1">
              <button
                type="button"
                onClick={() => setDraft((current) => ({ ...current, type: 'image' }))}
                aria-pressed={draft.type === 'image'}
                className={`inline-flex h-8 items-center gap-2 rounded-md px-3 text-[13px] font-medium transition ${draft.type === 'image' ? 'bg-white text-brand-navy shadow-sm' : 'text-muted hover:text-ink'}`}
              >
                <ImagePlus className="h-4 w-4" /> Image
              </button>
              <button
                type="button"
                onClick={() => setDraft((current) => ({ ...current, type: 'video' }))}
                aria-pressed={draft.type === 'video'}
                className={`inline-flex h-8 items-center gap-2 rounded-md px-3 text-[13px] font-medium transition ${draft.type === 'video' ? 'bg-white text-brand-navy shadow-sm' : 'text-muted hover:text-ink'}`}
              >
                <Film className="h-4 w-4" /> Video link
              </button>
            </div>
          </div>

          {draft.type === 'image' ? (
            <div>
              <span className="text-[13px] font-medium text-ink">Image</span>
              <div className="mt-1.5 rounded-lg border border-dashed border-[#C5D3DF] bg-surface p-3">
                {draft.image ? (
                  <div className="relative overflow-hidden rounded-md bg-white">
                    <img src={draft.image} alt="Gallery upload preview" className="max-h-52 w-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setDraft((current) => ({ ...current, image: '' }))}
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
                    <span className="text-xs text-faint">PNG, JPG, GIF, or WebP. Images are resized for the demo.</span>
                    <input type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
                  </label>
                )}
                {saving ? <p className="mt-2 text-center text-xs text-muted">Preparing image…</p> : null}
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="gallery-video-url" className="text-[13px] font-medium text-ink">Video URL</label>
              <div className="relative mt-1.5">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                <input
                  id="gallery-video-url"
                  type="url"
                  value={draft.videoUrl}
                  onChange={(event) => setDraft((current) => ({ ...current, videoUrl: event.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={`${fieldClass} mt-0 pl-9`}
                />
              </div>
              <p className="mt-1.5 text-xs text-faint">Paste a YouTube, Vimeo, or other public video link.</p>
            </div>
          )}
        </form>
      </Modal>
      <DemoNote />
    </div>
  );
}

function DemoNote() {
  return (
    <p className="mt-5 text-xs text-faint">
      Demo mode: changes are saved in this browser only.
    </p>
  );
}