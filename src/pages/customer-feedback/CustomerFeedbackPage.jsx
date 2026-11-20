import { useCallback, useEffect, useState } from 'react';
import {
  MessageSquare,
  RefreshCw,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { FeedbackStatsCards } from '../../features/customer-feedback/FeedbackStatsCards';
import { FeedbackFilters } from '../../features/customer-feedback/FeedbackFilters';
import { FeedbackTable } from '../../features/customer-feedback/FeedbackTable';
import { FeedbackDetailDrawer } from '../../features/customer-feedback/FeedbackDetailDrawer';
import { FeedbackFormModal } from '../../features/customer-feedback/FeedbackFormModal';
import { customerFeedbackService } from '../../services/api/customerFeedbackService';
import { extractErrorMessage } from '../../services/api/authService';
import { toast, useUiStore } from '../../store/uiStore';

export default function CustomerFeedbackPage() {
  // Statistics State
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  // Listing State
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState('');

  // Filters State
  const [search, setSearch] = useState('');
  const [rating, setRating] = useState('');
  const [reviewSource, setReviewSource] = useState('');
  const [isPublished, setIsPublished] = useState('');
  const [isFeatured, setIsFeatured] = useState('');
  const [sortBy, setSortBy] = useState('display_order');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modal & Drawer State
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // In-flight Action Loading State (per-item)
  const [actionLoadingIds, setActionLoadingIds] = useState({});

  // Confirmation dialog store action
  const openConfirm = useUiStore((state) => state.openConfirm);

  // Load Statistics
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError('');
    try {
      const data = await customerFeedbackService.getAdminStatistics();
      setStats(data);
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to fetch customer feedback statistics.');
      setStatsError(msg);
      if (err.response?.status === 403) {
        toast('Access denied. Administrator privileges required.', 'error');
      }
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Load Listing
  const loadFeedbackList = useCallback(async () => {
    setTableLoading(true);
    setTableError('');
    try {
      const data = await customerFeedbackService.listAdmin({
        page,
        page_size: pageSize,
        search,
        rating,
        review_source: reviewSource,
        is_published: isPublished,
        is_featured: isFeatured,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to fetch customer feedback records.');
      setTableError(msg);
      if (err.response?.status === 403) {
        toast('Access denied: Admin role required for feedback management.', 'error');
      }
    } finally {
      setTableLoading(false);
    }
  }, [page, pageSize, search, rating, reviewSource, isPublished, isFeatured, sortBy, sortOrder]);

  // Initial stats load
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Initial and reactive list load
  useEffect(() => {
    loadFeedbackList();
  }, [loadFeedbackList]);

  // Reset page to 1 whenever any filter or search changes
  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1);
  };

  const handleRatingChange = (val) => {
    setRating(val);
    setPage(1);
  };

  const handleReviewSourceChange = (val) => {
    setReviewSource(val);
    setPage(1);
  };

  const handleIsPublishedChange = (val) => {
    setIsPublished(val);
    setPage(1);
  };

  const handleIsFeaturedChange = (val) => {
    setIsFeatured(val);
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
    setRating('');
    setReviewSource('');
    setIsPublished('');
    setIsFeatured('');
    setSortBy('display_order');
    setSortOrder('asc');
    setPage(1);
  };

  const handleRefreshAll = () => {
    loadStats();
    loadFeedbackList();
    toast('Customer feedback data refreshed', 'info');
  };

  // Open Add Modal
  const handleAddNew = () => {
    setEditingFeedback(null);
    setFormModalOpen(true);
  };

  // Open Edit Modal
  const handleEdit = (item) => {
    setEditingFeedback(item);
    setFormModalOpen(true);
  };

  // View Details Drawer
  const handleViewDetails = (item) => {
    setSelectedFeedback(item);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedFeedback(null);
  };

  // Delete Action with Confirmation Dialog
  const handleDelete = (item) => {
    if (!item?.id) return;

    openConfirm({
      title: 'Delete Customer Review',
      message: `Are you sure you want to permanently delete the review from "${item.customer_name}"? This action cannot be undone.`,
      danger: true,
      confirmLabel: 'Delete Review',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        setActionLoadingIds((prev) => ({ ...prev, [item.id]: true }));
        try {
          await customerFeedbackService.deleteFeedback(item.id);
          toast('Customer feedback deleted successfully', 'success');
          // Refresh list and stats
          loadFeedbackList();
          loadStats();
          if (selectedFeedback?.id === item.id) {
            handleCloseDrawer();
          }
        } catch (err) {
          toast(extractErrorMessage(err, 'Failed to delete customer feedback.'), 'error');
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

  // Toggle Publication Status
  const handleTogglePublish = async (item, shouldRefreshStats = true) => {
    if (!item?.id) return;

    const key = `${item.id}-publish`;
    setActionLoadingIds((prev) => ({ ...prev, [key]: true }));

    try {
      const updated = await customerFeedbackService.publishFeedback(item.id, !item.is_published);
      // Optimistically update list
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
      if (selectedFeedback?.id === updated.id) {
        setSelectedFeedback(updated);
      }
      toast(
        `Feedback ${updated.is_published ? 'published' : 'unpublished'} successfully`,
        'success'
      );
      if (shouldRefreshStats) {
        loadStats();
      }
    } catch (err) {
      toast(extractErrorMessage(err, 'Failed to update publication status.'), 'error');
    } finally {
      setActionLoadingIds((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  // Toggle Featured Status
  const handleToggleFeatured = async (item, shouldRefreshStats = true) => {
    if (!item?.id) return;

    const key = `${item.id}-featured`;
    setActionLoadingIds((prev) => ({ ...prev, [key]: true }));

    try {
      const updated = await customerFeedbackService.featureFeedback(item.id, !item.is_featured);
      // Optimistically update list
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
      if (selectedFeedback?.id === updated.id) {
        setSelectedFeedback(updated);
      }
      toast(
        `Feedback ${updated.is_featured ? 'marked as featured' : 'unmarked as featured'} successfully`,
        'success'
      );
      if (shouldRefreshStats) {
        loadStats();
      }
    } catch (err) {
      toast(extractErrorMessage(err, 'Failed to update featured status.'), 'error');
    } finally {
      setActionLoadingIds((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  // Update Display Order
  const handleUpdateDisplayOrder = async (item, newOrder) => {
    if (!item?.id) return;

    const key = `${item.id}-order`;
    setActionLoadingIds((prev) => ({ ...prev, [key]: true }));

    try {
      const updated = await customerFeedbackService.updateDisplayOrder(item.id, newOrder);
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
      if (selectedFeedback?.id === updated.id) {
        setSelectedFeedback(updated);
      }
      toast(`Display order updated to #${updated.display_order}`, 'success');
      loadFeedbackList(); // Re-sort according to backend order
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

  // Handle Form Submission Success
  const handleFormSuccess = () => {
    loadFeedbackList();
    loadStats();
  };

  const hasActiveFilters = Boolean(
    (search && search.trim() !== '') ||
      rating !== '' ||
      reviewSource !== '' ||
      isPublished !== '' ||
      isFeatured !== '' ||
      sortBy !== 'display_order' ||
      sortOrder !== 'asc'
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        eyebrow="Public Site Data"
        title="Customer Feedback"
        description="Manage client ratings, verify Google reviews, publish customer testimonials, and update showcase rankings for the MK Construction & Builders website."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleRefreshAll}
              disabled={statsLoading || tableLoading}
              className="inline-flex items-center gap-1.5 h-10 px-3.5 text-xs font-semibold text-slate-700 hover:text-brand"
              title="Refresh all metrics and listing"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${statsLoading || tableLoading ? 'animate-spin text-brand' : ''}`}
              />
              <span>Refresh</span>
            </Button>

            <Button
              type="button"
              onClick={handleAddNew}
              className="inline-flex items-center gap-1.5 h-10 px-4 text-xs font-semibold shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add Feedback</span>
            </Button>
          </div>
        }
      />

      {/* Section 1: Dashboard Statistics Cards & Rating Distribution */}
      <section aria-label="Customer Feedback Statistics">
        <FeedbackStatsCards
          stats={stats}
          loading={statsLoading}
          error={statsError}
          onRetry={loadStats}
        />
      </section>

      {/* Section 2: Search and Filter Controls */}
      <section aria-label="Feedback Filters and Search">
        <FeedbackFilters
          search={search}
          onSearchChange={handleSearchChange}
          rating={rating}
          onRatingChange={handleRatingChange}
          reviewSource={reviewSource}
          onReviewSourceChange={handleReviewSourceChange}
          isPublished={isPublished}
          onIsPublishedChange={handleIsPublishedChange}
          isFeatured={isFeatured}
          onIsFeaturedChange={handleIsFeaturedChange}
          sortBy={sortBy}
          onSortByChange={handleSortByChange}
          sortOrder={sortOrder}
          onSortOrderChange={handleSortOrderChange}
          onClearFilters={handleClearFilters}
          totalResults={total}
        />
      </section>

      {/* Section 3: Feedback Listing Table & Pagination */}
      <section aria-label="Customer Feedback Table">
        {tableError ? (
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-center">
            <p className="text-sm font-semibold text-red-600">{tableError}</p>
            <Button
              variant="secondary"
              onClick={loadFeedbackList}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry Listing
            </Button>
          </div>
        ) : (
          <FeedbackTable
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
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onTogglePublish={handleTogglePublish}
            onToggleFeatured={handleToggleFeatured}
            onUpdateDisplayOrder={handleUpdateDisplayOrder}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
            actionLoadingIds={actionLoadingIds}
          />
        )}
      </section>

      {/* Add / Edit Feedback Modal */}
      <FeedbackFormModal
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingFeedback(null);
        }}
        onSuccess={handleFormSuccess}
        initialData={editingFeedback}
      />

      {/* Review Details Slide-over Drawer */}
      <FeedbackDetailDrawer
        feedbackId={selectedFeedback?.id}
        initialData={selectedFeedback}
        open={drawerOpen}
        onClose={handleCloseDrawer}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onTogglePublish={handleTogglePublish}
        onToggleFeatured={handleToggleFeatured}
      />
    </div>
  );
}
