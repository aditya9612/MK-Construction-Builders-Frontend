import { useCallback, useEffect, useState } from 'react';
import { Eye, Inbox, Mail, Phone, Search } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/common/States';
import { Drawer } from '../../components/modals/Modal';
import { toast, useUiStore } from '../../store/uiStore';
import { useEnquiryStore } from '../../store/enquiryStore';
import { extractErrorMessage } from '../../services/api/authService';
import { ENQUIRY_STATUSES, enquiryService } from '../../services/api/enquiryService';
import { cn, formatDate } from '../../utils/formatting';

const STATUS_STYLES = {
  NEW: 'border-sky-200 bg-sky-50 text-sky-700',
  READ: 'border-slate-200 bg-slate-50 text-slate-700',
  CONTACTED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CLOSED: 'border-slate-200 bg-[#F1F4F7] text-[#5F7185]',
  SPAM: 'border-rose-200 bg-rose-50 text-rose-700',
};

const STATUS_LABELS = {
  NEW: 'New',
  READ: 'Read',
  CONTACTED: 'Contacted',
  CLOSED: 'Closed',
  SPAM: 'Spam',
};

const textAreaClass =
  'mt-1.5 w-full resize-y rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10';

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function StatusChip({ status }) {
  return (
    <Badge className={cn('border', STATUS_STYLES[status] || 'border-line bg-surface text-muted')}>
      {STATUS_LABELS[status] || status || '—'}
    </Badge>
  );
}

export default function SiteEnquiriesPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const openConfirm = useUiStore((state) => state.openConfirm);
  const adjustUnread = useEnquiryStore((state) => state.adjustUnread);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [search, status, unreadOnly]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await enquiryService.list({
        page,
        page_size: 20,
        search,
        status,
        is_read: unreadOnly ? false : undefined,
        sort_by: 'created_at',
        sort_order: 'desc',
      });
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      setItems([]);
      setTotal(0);
      setError(extractErrorMessage(err, 'Unable to load website enquiries.'));
    } finally {
      setLoading(false);
    }
  }, [page, search, status, unreadOnly]);

  useEffect(() => {
    load();
  }, [load]);

  function patchRow(enquiryId, patch) {
    setItems((current) => current.map((row) => (row.id === enquiryId ? { ...row, ...patch } : row)));
  }

  async function openDetail(row) {
    const wasUnread = row.is_read === false;
    setDetailLoading(true);
    setDetail({ ...row });
    try {
      const data = await enquiryService.get(row.id);
      setDetail(data);
      setNotes(data.admin_notes || '');
      patchRow(row.id, {
        is_read: data.is_read,
        status: data.status,
        message_preview: data.message_preview || row.message_preview,
      });
      if (wasUnread && data.is_read) {
        adjustUnread(-1);
      }
    } catch (err) {
      toast(extractErrorMessage(err, 'Unable to load this enquiry.'), 'error');
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setDetail(null);
    setNotes('');
  }

  async function handleStatus(nextStatus) {
    if (!detail?.id) return;
    setSaving(true);
    try {
      const data = await enquiryService.update(detail.id, { status: nextStatus });
      const next = data && typeof data === 'object' ? { ...detail, ...data, status: data.status || nextStatus } : { ...detail, status: nextStatus };
      setDetail(next);
      setNotes(next.admin_notes || '');
      patchRow(detail.id, { status: next.status, is_read: next.is_read });
      toast('Enquiry updated successfully');
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not update this enquiry.'), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNotes() {
    if (!detail?.id) return;
    setSaving(true);
    try {
      const data = await enquiryService.update(detail.id, { admin_notes: notes });
      const next = data && typeof data === 'object' ? { ...detail, ...data, admin_notes: notes } : { ...detail, admin_notes: notes };
      setDetail(next);
      setNotes(next.admin_notes || '');
      toast('Enquiry updated successfully');
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not save notes.'), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkUnread() {
    if (!detail?.id) return;
    setSaving(true);
    try {
      const data = await enquiryService.markUnread(detail.id);
      const wasRead = detail.is_read !== false;
      const next = data && typeof data === 'object' ? { ...detail, ...data, is_read: false } : { ...detail, is_read: false };
      setDetail(next);
      patchRow(detail.id, { is_read: false, status: next.status });
      if (wasRead) adjustUnread(1);
      toast('Marked as unread');
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not mark this enquiry unread.'), 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(enquiry) {
    if (!enquiry?.id) return;
    openConfirm({
      title: 'Delete enquiry?',
      message: `The enquiry from “${enquiry.name || 'this visitor'}” will be permanently removed.`,
      confirmLabel: 'Delete enquiry',
      danger: true,
      onConfirm: async () => {
        try {
          await enquiryService.delete(enquiry.id);
          if (enquiry.is_read === false) adjustUnread(-1);
          toast('Enquiry deleted.');
          if (detail?.id === enquiry.id) closeDetail();
          await load();
        } catch (err) {
          toast(extractErrorMessage(err, 'Could not delete this enquiry.'), 'error');
        }
      },
    });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Public Site Data"
        title="Enquiries"
        description="Messages submitted through the public website enquiry form."
      />

      <section aria-label="Website enquiries">
        <div className="mb-4 flex flex-col gap-3 border-y border-line py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter by status"
              className="h-9 rounded-lg border border-line bg-white px-3 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            >
              <option value="">All statuses</option>
              {ENQUIRY_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </select>
            <label className="flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-3 text-[13px] text-ink">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(event) => setUnreadOnly(event.target.checked)}
              />
              Unread only
            </label>
            <span className="text-xs text-faint">{total} enquiries</span>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search enquiries"
              aria-label="Search enquiries"
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
            <div className="hidden overflow-x-auto rounded-[12px] border border-line md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 table-head">
                  <tr>
                    <th className="whitespace-nowrap border-b border-line px-3 py-3">Date</th>
                    <th className="whitespace-nowrap border-b border-line px-3 py-3">Name</th>
                    <th className="whitespace-nowrap border-b border-line px-3 py-3">Mobile</th>
                    <th className="whitespace-nowrap border-b border-line px-3 py-3">Email</th>
                    <th className="whitespace-nowrap border-b border-line px-3 py-3">Project type</th>
                    <th className="whitespace-nowrap border-b border-line px-3 py-3">Location</th>
                    <th className="whitespace-nowrap border-b border-line px-3 py-3">Area</th>
                    <th className="whitespace-nowrap border-b border-line px-3 py-3">Preview</th>
                    <th className="whitespace-nowrap border-b border-line px-3 py-3">Status</th>
                    <th className="whitespace-nowrap border-b border-line px-3 py-3">Read</th>
                    <th className="border-b border-line px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr
                      key={row.id}
                      className={cn(
                        'border-t border-line transition duration-ui hover:bg-[#F8FBFE]',
                        row.is_read === false && 'bg-sky-50/70 font-semibold text-ink'
                      )}
                    >
                      <td className="h-16 whitespace-nowrap px-3 py-3 align-middle text-muted">
                        {formatDate(row.created_at)}
                      </td>
                      <td className="px-3 py-3 align-middle">{row.name || '—'}</td>
                      <td className="px-3 py-3 align-middle font-normal">{row.mobile || '—'}</td>
                      <td className="px-3 py-3 align-middle font-normal">{row.email || '—'}</td>
                      <td className="px-3 py-3 align-middle font-normal">{row.project_type || '—'}</td>
                      <td className="px-3 py-3 align-middle font-normal">{row.location || '—'}</td>
                      <td className="px-3 py-3 align-middle font-normal">{row.construction_area || '—'}</td>
                      <td className="max-w-48 truncate px-3 py-3 align-middle font-normal text-muted">
                        {row.message_preview || '—'}
                      </td>
                      <td className="px-3 py-3 align-middle font-normal">
                        <StatusChip status={row.status} />
                      </td>
                      <td className="px-3 py-3 align-middle font-normal text-muted">
                        {row.is_read ? 'Read' : 'Unread'}
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <Button size="sm" variant="secondary" onClick={() => openDetail(row)}>
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {items.map((row) => (
                <article
                  key={row.id}
                  className={cn(
                    'rounded-lg border border-line bg-white p-3.5',
                    row.is_read === false && 'border-sky-200 bg-sky-50/70'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={cn('text-ink', row.is_read === false ? 'font-semibold' : 'font-medium')}>
                        {row.name || '—'}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted">{row.email || row.mobile}</p>
                    </div>
                    <StatusChip status={row.status} />
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-ink">{row.message_preview || 'No preview'}</p>
                  <p className="mt-1 text-xs text-muted">
                    {row.location || '—'} · {formatDateTime(row.created_at)}
                  </p>
                  <Button className="mt-3 w-full" size="sm" variant="secondary" onClick={() => openDetail(row)}>
                    <Eye className="h-4 w-4" />
                    View enquiry
                  </Button>
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
            icon={Inbox}
            title="No website enquiries"
            description={
              unreadOnly || search || status
                ? 'No enquiries match these filters.'
                : 'When a visitor submits the public enquiry form, it will appear here.'
            }
          />
        )}
      </section>

      <Drawer
        open={Boolean(detail)}
        onClose={closeDetail}
        title={detail?.name || 'Enquiry details'}
        width="max-w-xl"
      >
        {detailLoading && !detail?.message ? (
          <LoadingSkeleton rows={6} />
        ) : detail ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip status={detail.status} />
              <Badge className={detail.is_read ? 'bg-[#F1F4F7] text-[#5F7185]' : 'bg-sky-50 text-sky-700'}>
                {detail.is_read ? 'Read' : 'Unread'}
              </Badge>
              {detail.source ? <Badge className="bg-brand-pale text-brand-deep">{detail.source}</Badge> : null}
            </div>

            <div className="grid gap-3 rounded-lg border border-line bg-surface p-3 sm:grid-cols-2">
              <DetailField label="Name" value={detail.name} />
              <DetailField
                label="Mobile"
                value={detail.mobile}
                href={detail.mobile ? `tel:${detail.mobile}` : undefined}
                icon={Phone}
              />
              <DetailField
                label="Email"
                value={detail.email}
                href={detail.email ? `mailto:${detail.email}` : undefined}
                icon={Mail}
              />
              <DetailField label="Project type" value={detail.project_type} />
              <DetailField label="Location" value={detail.location} />
              <DetailField label="Construction area" value={detail.construction_area} />
              <DetailField label="Created" value={formatDateTime(detail.created_at)} />
              <DetailField label="Updated" value={formatDateTime(detail.updated_at)} />
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">Message</p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-ink">{detail.message || '—'}</p>
            </div>

            <label htmlFor="enquiry-notes" className="block">
              <span className="text-[13px] font-medium text-ink">Admin notes</span>
              <textarea
                id="enquiry-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                className={textAreaClass}
                placeholder="Call notes, follow-up, visit date…"
              />
            </label>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">Status</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" disabled={saving} onClick={() => handleStatus('CONTACTED')}>
                  Contacted
                </Button>
                <Button size="sm" variant="secondary" disabled={saving} onClick={() => handleStatus('CLOSED')}>
                  Closed
                </Button>
                <Button size="sm" variant="danger" disabled={saving} onClick={() => handleStatus('SPAM')}>
                  Spam
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-line pt-4">
              <Button size="sm" disabled={saving} loading={saving} onClick={handleSaveNotes}>
                Save notes
              </Button>
              <Button size="sm" variant="secondary" disabled={saving} onClick={handleMarkUnread}>
                Mark unread
              </Button>
              <Button size="sm" variant="danger" disabled={saving} onClick={() => handleDelete(detail)}>
                Delete
              </Button>
            </div>

            <div className="rounded-lg border border-dashed border-line bg-surface px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">Meta</p>
              <p className="mt-2 break-all text-xs text-muted">
                <span className="font-medium text-ink">IP:</span> {detail.ip_address || '—'}
              </p>
              <p className="mt-1 break-all text-xs text-muted">
                <span className="font-medium text-ink">User agent:</span> {detail.user_agent || '—'}
              </p>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}

function DetailField({ label, value, href, icon: Icon }) {
  const content = value || '—';
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">{label}</p>
      {href ? (
        <a
          href={href}
          className="mt-1 flex items-center gap-1.5 break-all text-[13px] font-medium text-brand hover:underline"
        >
          {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : null}
          {content}
        </a>
      ) : (
        <p className="mt-1 flex items-center gap-1.5 break-all text-[13px] font-medium text-ink">
          {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 text-muted" /> : null}
          {content}
        </p>
      )}
    </div>
  );
}
