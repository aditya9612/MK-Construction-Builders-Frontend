import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Film,
  Globe,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/cards/Card';
import { InstagramSectionSettingsCard } from '../../features/instagram-reels/InstagramSectionSettingsCard';
import { InstagramReelsFilters } from '../../features/instagram-reels/InstagramReelsFilters';
import { InstagramReelsTable } from '../../features/instagram-reels/InstagramReelsTable';
import { InstagramReelFormModal } from '../../features/instagram-reels/InstagramReelFormModal';
import { InstagramReelDetailDrawer } from '../../features/instagram-reels/InstagramReelDetailDrawer';
import { instagramReelsService } from '../../services/api/instagramReelsService';
import { extractErrorMessage } from '../../services/api/authService';
import { toast, useUiStore } from '../../store/uiStore';

function SummaryCard({ label, value, subtext, icon: Icon, colorClass, bgClass, borderClass }) {
  return (
    <Card className="border p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          {subtext ? <p className="mt-0.5 truncate text-xs text-slate-500">{subtext}</p> : null}
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${borderClass} ${bgClass} ${colorClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

export default function InstagramReelsPage() {
  // Section Visibility Settings State
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  // Listing State
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState('');

  // Filters & Sorting State
  const [search, setSearch] = useState('');
  const [isPublished, setIsPublished] = useState('');
  const [sortBy, setSortBy] = useState('display_order');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modals & Detail Drawer State
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingReel, setEditingReel] = useState(null);
  const [selectedReel, setSelectedReel] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Per-row Action Loading State
  const [actionLoadingIds, setActionLoadingIds] = useState({});

  const openConfirm = useUiStore((state) => state.openConfirm);

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    setSettingsError('');
    try {
      const data = await instagramReelsService.getSettings();
      setSettings(data);
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to fetch Instagram section settings.');
      setSettingsError(msg);
      if (err?.response?.status === 403) {
        toast('Access denied. Administrator privileges required.', 'error');
      }
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const loadReels = useCallback(async () => {
    setTableLoading(true);
    setTableError('');
    try {
      const data = await instagramReelsService.listAdmin({
        page,
        page_size: pageSize,
        search,
        is_published: isPublished,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      setItems(data.items);
      setTotal(data.total);
      setTotalPages(Math.max(1, data.total_pages || 1));
      if (data.total_pages > 0 && page > data.total_pages) {
        setPage(data.total_pages);
      }
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to fetch Instagram reels.');
      setTableError(msg);
      if (err?.response?.status === 403) {
        toast('Access denied: Administrator role required.', 'error');
      }
    } finally {
      setTableLoading(false);
    }
  }, [page, pageSize, search, isPublished, sortBy, sortOrder]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    loadReels();
  }, [loadReels]);

  const handleToggleSection = async (nextEnabled) => {
    if (settingsSaving) return;
    setSettingsSaving(true);
    try {
      const updated = await instagramReelsService.updateSettings(nextEnabled);
      setSettings(updated);
      toast(
        updated.is_enabled
          ? 'Instagram Reels section enabled on the public website'
          : 'Instagram Reels section hidden from the public website',
        'success'
      );
    } catch (err) {
      toast(
        extractErrorMessage(err, 'Failed to update Instagram section settings.'),
        'error'
      );
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleSearchChange = useCallback((val) => {
    setSearch(val);
    setPage(1);
  }, []);

  const handleIsPublishedChange = (val) => {
    setIsPublished(val);
    setPage(1);
  };

  const handleSortByChange = (val) => {
    setSortBy(val);
    setPage(1);
  };

  const handleSortOrderChange = (val) => {
    setSortOrder(val);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setIsPublished('');
    setSortBy('display_order');
    setSortOrder('asc');
    setPage(1);
  };

  const handleRefreshAll = () => {
    loadSettings();
    loadReels();
    toast('Instagram reels refreshed', 'info');
  };

  const handleAddNew = () => {
    setEditingReel(null);
    setFormModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingReel(item);
    setFormModalOpen(true);
  };

  const handlePreview = (item) => {
    setSelectedReel(item);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedReel(null);
  };

  const handleDelete = (item) => {
    if (!item?.id) return;

    openConfirm({
      title: 'Delete Instagram Reel',
      message: `Are you sure you want to permanently delete "${item.title}"? This action cannot be undone.`,
      danger: true,
      confirmLabel: 'Delete Reel',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        setActionLoadingIds((prev) => ({ ...prev, [item.id]: true }));
        try {
          await instagramReelsService.deleteReel(item.id);
          toast('Instagram reel deleted successfully', 'success');
          if (selectedReel?.id === item.id) {
            handleCloseDrawer();
          }
          await loadReels();
        } catch (err) {
          toast(extractErrorMessage(err, 'Failed to delete Instagram reel.'), 'error');
        } finally {
          setActionLoadingIds((prev) => {
            const copy = { ...prev };
            delete copy[item.id];
            return copy;
          });
        }
      },
    });
  };

  const handleTogglePublish = async (item) => {
    if (!item?.id) return;
    const key = `${item.id}-publish`;
    setActionLoadingIds((prev) => ({ ...prev, [key]: true }));

    try {
      const updated = await instagramReelsService.publishReel(
        item.id,
        !item.is_published
      );
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
      if (selectedReel?.id === updated.id) {
        setSelectedReel(updated);
      }
      toast(
        `Instagram reel ${updated.is_published ? 'published' : 'unpublished'} successfully`,
        'success'
      );
    } catch (err) {
      toast(extractErrorMessage(err, 'Failed to update publish status.'), 'error');
    } finally {
      setActionLoadingIds((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const handleDrawerPublishSync = (updatedReel) => {
    if (!updatedReel?.id) return;
    setItems((prev) =>
      prev.map((it) => (it.id === updatedReel.id ? updatedReel : it))
    );
    setSelectedReel(updatedReel);
  };

  const handleUpdateDisplayOrder = async (item, newOrder) => {
    if (!item?.id) return;
    const key = `${item.id}-order`;
    setActionLoadingIds((prev) => ({ ...prev, [key]: true }));

    try {
      const updated = await instagramReelsService.updateDisplayOrder(item.id, newOrder);
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
      if (selectedReel?.id === updated.id) {
        setSelectedReel(updated);
      }
      toast(`Display order updated to #${updated.display_order}`, 'success');
      await loadReels();
    } catch (err) {
      toast(extractErrorMessage(err, 'Failed to update display order.'), 'error');
    } finally {
      setActionLoadingIds((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const hasActiveFilters = Boolean(
    (search && search.trim() !== '') ||
      isPublished !== '' ||
      sortBy !== 'display_order' ||
      sortOrder !== 'asc'
  );

  const pageStats = useMemo(() => {
    const publishedOnPage = items.filter((it) => it.is_published).length;
    const unpublishedOnPage = items.length - publishedOnPage;
    return { publishedOnPage, unpublishedOnPage };
  }, [items]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Public Site Data"
        title="Instagram Reels"
        description="Curate official MK Construction Instagram reels, control display ordering, preview embeds, and toggle public website visibility."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleRefreshAll}
              disabled={settingsLoading || tableLoading}
              className="inline-flex h-10 items-center gap-1.5 px-3.5 text-xs font-semibold text-slate-700 hover:text-brand"
              title="Refresh settings and reels listing"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  settingsLoading || tableLoading ? 'animate-spin text-brand' : ''
                }`}
              />
              <span>Refresh</span>
            </Button>

            <Button
              type="button"
              onClick={handleAddNew}
              className="inline-flex h-10 items-center gap-1.5 px-4 text-xs font-semibold shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add Reel</span>
            </Button>
          </div>
        }
      />

      {/* Global Public Section Toggle */}
      <section aria-label="Instagram Section Settings">
        <InstagramSectionSettingsCard
          settings={settings}
          loading={settingsLoading}
          saving={settingsSaving}
          error={settingsError}
          onToggle={handleToggleSection}
          onRetry={loadSettings}
        />
      </section>

      {/* Summary Strip */}
      <section aria-label="Instagram Reels Summary">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Matching Reels"
            value={total}
            subtext={hasActiveFilters ? 'Filtered catalog results' : 'Total reels in catalog'}
            icon={Film}
            colorClass="text-brand-navy"
            bgClass="bg-slate-100"
            borderClass="border-slate-200"
          />
          <SummaryCard
            label="Published (Page)"
            value={pageStats.publishedOnPage}
            subtext="Ready for public display"
            icon={CheckCircle2}
            colorClass="text-emerald-700"
            bgClass="bg-emerald-50"
            borderClass="border-emerald-200"
          />
          <SummaryCard
            label="Unpublished (Page)"
            value={pageStats.unpublishedOnPage}
            subtext="Hidden draft entries"
            icon={Clock}
            colorClass="text-amber-700"
            bgClass="bg-amber-50"
            borderClass="border-amber-200"
          />
          <SummaryCard
            label="Website Section"
            value={settingsLoading ? '...' : settings?.is_enabled ? 'Enabled' : 'Disabled'}
            subtext="Public API delivery state"
            icon={Globe}
            colorClass={settings?.is_enabled ? 'text-emerald-700' : 'text-amber-700'}
            bgClass={settings?.is_enabled ? 'bg-emerald-50' : 'bg-amber-50'}
            borderClass={settings?.is_enabled ? 'border-emerald-200' : 'border-amber-200'}
          />
        </div>
      </section>

      {/* Search & Filters */}
      <section aria-label="Instagram Reels Filters">
        <InstagramReelsFilters
          search={search}
          onSearchChange={handleSearchChange}
          isPublished={isPublished}
          onIsPublishedChange={handleIsPublishedChange}
          sortBy={sortBy}
          onSortByChange={handleSortByChange}
          sortOrder={sortOrder}
          onSortOrderChange={handleSortOrderChange}
          onClearFilters={handleClearFilters}
          totalResults={total}
        />
      </section>

      {/* Listing Table & Mobile Cards */}
      <section aria-label="Instagram Reels Table">
        {tableError ? (
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-center">
            <p className="text-sm font-semibold text-red-600">{tableError}</p>
            <Button
              variant="secondary"
              onClick={loadReels}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry Listing</span>
            </Button>
          </div>
        ) : (
          <InstagramReelsTable
            items={items}
            loading={tableLoading}
            page={page}
            pageSize={pageSize}
            total={total}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            onAddNew={handleAddNew}
            onPreview={handlePreview}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onTogglePublish={handleTogglePublish}
            onUpdateDisplayOrder={handleUpdateDisplayOrder}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
            actionLoadingIds={actionLoadingIds}
          />
        )}
      </section>

      {/* Add / Edit Reel Modal */}
      <InstagramReelFormModal
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingReel(null);
        }}
        onSuccess={() => {
          loadReels();
        }}
        initialData={editingReel}
      />

      {/* Preview & Details Slide-over Drawer */}
      <InstagramReelDetailDrawer
        reelId={selectedReel?.id}
        initialData={selectedReel}
        open={drawerOpen}
        onClose={handleCloseDrawer}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onTogglePublish={handleDrawerPublishSync}
      />
    </div>
  );
}
