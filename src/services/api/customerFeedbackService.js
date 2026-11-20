import { apiClient } from './apiClient';
import { mediaUrl } from './cmsUploadService';

export const REVIEW_SOURCES = [
  { value: 'google', label: 'Google Review' },
  { value: 'website', label: 'Website Review' },
  { value: 'manual', label: 'Manual Entry' },
];

export const ALLOWED_FEEDBACK_SORT_FIELDS = [
  { value: 'display_order', label: 'Display Order' },
  { value: 'rating', label: 'Rating' },
  { value: 'review_date', label: 'Review Date' },
  { value: 'created_at', label: 'Created Date' },
  { value: 'customer_name', label: 'Customer Name' },
  { value: 'updated_at', label: 'Last Updated' },
  { value: 'id', label: 'Feedback ID' },
];

export const RATING_FILTER_OPTIONS = [
  { value: '', label: 'All Ratings' },
  { value: '5', label: '5 Stars ★★★★★' },
  { value: '4', label: '4 Stars ★★★★☆' },
  { value: '3', label: '3 Stars ★★★☆☆' },
  { value: '2', label: '2 Stars ★★☆☆☆' },
  { value: '1', label: '1 Star ★☆☆☆☆' },
];

export const PUBLICATION_FILTER_OPTIONS = [
  { value: '', label: 'All Publication Statuses' },
  { value: 'true', label: 'Published' },
  { value: 'false', label: 'Pending / Unpublished' },
];

export const FEATURED_FILTER_OPTIONS = [
  { value: '', label: 'All Featured Statuses' },
  { value: 'true', label: 'Featured Only' },
  { value: 'false', label: 'Standard Only' },
];

/**
 * Unwrap backend response data safely.
 */
function unwrapData(response) {
  const resData = response.data;
  return resData?.data ?? resData;
}

/**
 * Normalize a single customer feedback object.
 * Resolves relative customer photo URLs into absolute URLs via mediaUrl().
 */
export function normalizeCustomerFeedback(item) {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    customer_photo_url: item.customer_photo ? mediaUrl(item.customer_photo) : null,
    rating: typeof item.rating === 'number' ? item.rating : Number(item.rating) || 0,
    display_order: typeof item.display_order === 'number' ? item.display_order : Number(item.display_order) || 0,
    is_featured: Boolean(item.is_featured),
    is_published: Boolean(item.is_published),
    review_source: String(item.review_source || 'website').toLowerCase(),
  };
}

/**
 * Format query parameters for the admin feedback listing endpoint.
 */
function buildAdminListParams({
  page = 1,
  page_size = 10,
  search = '',
  rating = '',
  review_source = '',
  is_published = '',
  is_featured = '',
  sort_by = 'display_order',
  sort_order = 'asc',
} = {}) {
  const params = {
    page: Math.max(1, Number(page) || 1),
    page_size: Math.min(100, Math.max(1, Number(page_size) || 10)),
    sort_by: sort_by || 'display_order',
    sort_order: sort_order || 'asc',
  };

  if (search && String(search).trim()) {
    params.search = String(search).trim();
  }

  if (rating !== '' && rating != null && rating !== 'all') {
    const r = Number(rating);
    if (!Number.isNaN(r) && r >= 1 && r <= 5) {
      params.rating = r;
    }
  }

  if (review_source && review_source !== 'all') {
    params.review_source = String(review_source).trim().toLowerCase();
  }

  if (is_published !== '' && is_published != null && is_published !== 'all') {
    params.is_published = is_published === true || is_published === 'true';
  }

  if (is_featured !== '' && is_featured != null && is_featured !== 'all') {
    params.is_featured = is_featured === true || is_featured === 'true';
  }

  return params;
}

export const customerFeedbackService = {
  /**
   * Get administrative customer feedback statistics.
   * Endpoint: GET /api/v1/customer-feedback/admin/statistics
   */
  async getAdminStatistics() {
    const response = await apiClient.get('/api/v1/customer-feedback/admin/statistics');
    const raw = unwrapData(response) || {};

    return {
      total_reviews: raw.total_reviews ?? 0,
      published_reviews: raw.published_reviews ?? 0,
      pending_reviews: raw.pending_reviews ?? 0,
      featured_reviews: raw.featured_reviews ?? 0,
      average_rating: Number(raw.average_rating) || 0,
      google_review_count: raw.google_review_count ?? 0,
      website_review_count: raw.website_review_count ?? 0,
      manual_review_count: raw.manual_review_count ?? 0,
      rating_distribution: {
        '1': raw.rating_distribution?.['1'] ?? 0,
        '2': raw.rating_distribution?.['2'] ?? 0,
        '3': raw.rating_distribution?.['3'] ?? 0,
        '4': raw.rating_distribution?.['4'] ?? 0,
        '5': raw.rating_distribution?.['5'] ?? 0,
      },
    };
  },

  /**
   * List customer feedback with filters, pagination, and sorting (admin).
   * Endpoint: GET /api/v1/customer-feedback
   */
  async listAdmin(options = {}) {
    const params = buildAdminListParams(options);
    const response = await apiClient.get('/api/v1/customer-feedback', { params });
    const raw = unwrapData(response) || {};

    const items = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.items)
      ? raw.items
      : [];

    const total = typeof raw.total === 'number' ? raw.total : items.length;
    const page = typeof raw.page === 'number' ? raw.page : params.page;
    const pageSize = typeof raw.page_size === 'number' ? raw.page_size : params.page_size;
    const totalPages =
      typeof raw.total_pages === 'number'
        ? raw.total_pages
        : Math.ceil(total / Math.max(1, pageSize));

    return {
      items: items.map(normalizeCustomerFeedback),
      total,
      page,
      page_size: pageSize,
      total_pages: totalPages,
    };
  },

  /**
   * Get complete feedback details by ID (admin).
   * Endpoint: GET /api/v1/customer-feedback/{feedback_id}
   */
  async getAdminById(feedbackId) {
    if (!feedbackId) {
      throw new Error('Feedback ID is required');
    }
    const response = await apiClient.get(`/api/v1/customer-feedback/${feedbackId}`);
    return normalizeCustomerFeedback(unwrapData(response));
  },
};
