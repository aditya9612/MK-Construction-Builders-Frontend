import { apiClient } from './apiClient';

export const ALLOWED_INSTAGRAM_DOMAINS = [
  'instagram.com',
  'www.instagram.com',
  'm.instagram.com',
];

export const ALLOWED_REEL_SORT_FIELDS = [
  { value: 'display_order', label: 'Display Order' },
  { value: 'created_at', label: 'Created Date' },
  { value: 'updated_at', label: 'Last Updated' },
  { value: 'title', label: 'Reel Title' },
  { value: 'is_published', label: 'Publish Status' },
  { value: 'id', label: 'Reel ID' },
];

export const REEL_PUBLICATION_FILTER_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'true', label: 'Published' },
  { value: 'false', label: 'Unpublished / Draft' },
];

const PATH_REGEX = /^\/(reel|reels|p)\/([^/]+)\/?$/i;
const SHORTCODE_REGEX = /^(?=.*[A-Za-z0-9])[A-Za-z0-9_-]{4,64}$/;

/**
 * Unwrap backend SuccessResponse wrapper safely.
 */
function unwrapData(response) {
  const resData = response?.data;
  return resData?.data ?? resData;
}

/**
 * Validate and normalize an Instagram Reel or Post URL to canonical HTTPS and embed URLs.
 * Mirrors backend `parse_and_normalize_instagram_url` validation rules.
 */
export function parseAndNormalizeInstagramUrl(rawUrl) {
  if (typeof rawUrl !== 'string') {
    return { valid: false, error: 'Instagram URL must be a string.' };
  }

  const cleaned = rawUrl.trim();
  if (!cleaned) {
    return { valid: false, error: 'Instagram URL is required.' };
  }
  if (cleaned.length > 500) {
    return { valid: false, error: 'Instagram URL must not exceed 500 characters.' };
  }
  if (/[\s\x00-\x1f\\]/.test(cleaned)) {
    return { valid: false, error: 'Instagram URL contains invalid characters or spaces.' };
  }

  let parsed;
  try {
    parsed = new URL(cleaned);
  } catch {
    return { valid: false, error: 'Enter a valid Instagram URL (e.g. https://www.instagram.com/reel/CODE/).' };
  }

  if (parsed.protocol.toLowerCase() !== 'https:') {
    return { valid: false, error: 'Instagram URL must use https://.' };
  }

  if (parsed.username || parsed.password || parsed.host.includes('@')) {
    return { valid: false, error: 'Instagram URL must not contain embedded credentials.' };
  }

  const host = parsed.host.toLowerCase();
  if (!ALLOWED_INSTAGRAM_DOMAINS.includes(host)) {
    return {
      valid: false,
      error: 'URL must use instagram.com, www.instagram.com, or m.instagram.com.',
    };
  }

  const match = PATH_REGEX.exec(parsed.pathname || '');
  if (!match) {
    return {
      valid: false,
      error: 'URL path must be /reel/{code}/, /reels/{code}/, or /p/{code}/.',
    };
  }

  const kind = match[1].toLowerCase();
  const shortcode = match[2];
  if (!SHORTCODE_REGEX.test(shortcode)) {
    return { valid: false, error: 'Instagram URL contains an invalid reel/post shortcode.' };
  }

  const canonicalKind = kind === 'p' ? 'p' : 'reel';
  const canonicalUrl = `https://www.instagram.com/${canonicalKind}/${shortcode}/`;
  const embedUrl = `https://www.instagram.com/${canonicalKind}/${shortcode}/embed/`;

  if (canonicalUrl.length > 500 || embedUrl.length > 500) {
    return { valid: false, error: 'Normalized Instagram URL exceeds maximum length of 500 characters.' };
  }

  return {
    valid: true,
    canonicalUrl,
    embedUrl,
    shortcode,
    kind: canonicalKind,
  };
}

/**
 * Extract shortcode from a normalized or raw Instagram URL for display badges.
 */
export function extractInstagramShortcode(url) {
  const parsed = parseAndNormalizeInstagramUrl(url);
  return parsed.valid ? parsed.shortcode : '';
}

/**
 * Normalize a single InstagramReelOut object from backend responses.
 */
export function normalizeInstagramReel(item) {
  if (!item || typeof item !== 'object') return item;

  const parsed = parseAndNormalizeInstagramUrl(item.instagram_url || '');
  const embedUrl = item.embed_url || (parsed.valid ? parsed.embedUrl : '');

  return {
    id: item.id,
    title: item.title ?? '',
    instagram_url: item.instagram_url ?? '',
    embed_url: embedUrl,
    description: item.description ?? null,
    is_published: Boolean(item.is_published),
    display_order:
      typeof item.display_order === 'number'
        ? item.display_order
        : Math.max(0, Number(item.display_order) || 0),
    created_at: item.created_at ?? null,
    updated_at: item.updated_at ?? null,
  };
}

/**
 * Normalize InstagramSectionSettingsOut object from backend responses.
 */
export function normalizeInstagramSectionSettings(item) {
  if (!item || typeof item !== 'object') {
    return { id: 1, is_enabled: true, updated_at: null };
  }
  return {
    id: item.id ?? 1,
    is_enabled: Boolean(item.is_enabled),
    updated_at: item.updated_at ?? null,
  };
}

/**
 * Parse structured FastAPI / Pydantic v2 validation errors.
 */
export function parseInstagramValidationErrors(error) {
  const res = error?.response?.data;
  const fieldErrors = {};

  if (res?.errors && Array.isArray(res.errors)) {
    res.errors.forEach((err) => {
      if (err.field) {
        fieldErrors[err.field] = err.message || 'Invalid field value';
      }
    });
  } else if (res?.detail && Array.isArray(res.detail)) {
    res.detail.forEach((err) => {
      const field = Array.isArray(err.loc) ? err.loc[err.loc.length - 1] : err.loc;
      if (field && field !== 'body') {
        fieldErrors[field] = err.msg || err.message || 'Invalid field value';
      }
    });
  }

  let detailMsg = null;
  if (typeof res?.detail === 'string') {
    detailMsg = res.detail;
  } else if (Array.isArray(res?.detail) && res.detail.length > 0) {
    detailMsg = res.detail.map((d) => d.msg || d.message).filter(Boolean).join(', ');
  }

  const generalMessage =
    res?.message ||
    detailMsg ||
    error?.message ||
    'An error occurred. Please try again.';

  return { fieldErrors, generalMessage };
}

function buildAdminListParams({
  page = 1,
  page_size = 20,
  search = '',
  is_published = '',
  sort_by = 'display_order',
  sort_order = 'asc',
} = {}) {
  const allowedSortValues = new Set(ALLOWED_REEL_SORT_FIELDS.map((f) => f.value));
  const params = {
    page: Math.max(1, Number(page) || 1),
    page_size: Math.min(100, Math.max(1, Number(page_size) || 20)),
    sort_by: allowedSortValues.has(sort_by) ? sort_by : 'display_order',
    sort_order: String(sort_order).toLowerCase() === 'desc' ? 'desc' : 'asc',
  };

  if (search && String(search).trim()) {
    params.search = String(search).trim();
  }

  if (is_published !== '' && is_published != null && is_published !== 'all') {
    params.is_published = is_published === true || is_published === 'true';
  }

  return params;
}

export const instagramReelsService = {
  /**
   * List all Instagram reels (admin).
   * Endpoint: GET /api/v1/admin/instagram-reels
   */
  async listAdmin(options = {}) {
    const params = buildAdminListParams(options);
    const response = await apiClient.get('/api/v1/admin/instagram-reels', { params });
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
        : total > 0
        ? Math.ceil(total / Math.max(1, pageSize))
        : 0;

    return {
      items: items.map(normalizeInstagramReel),
      total,
      page,
      page_size: pageSize,
      total_pages: totalPages,
    };
  },

  /**
   * Get single Instagram reel by ID (admin).
   * Endpoint: GET /api/v1/admin/instagram-reels/{id}
   */
  async getAdminById(reelId) {
    if (!reelId) {
      throw new Error('Reel ID is required');
    }
    const response = await apiClient.get(`/api/v1/admin/instagram-reels/${reelId}`);
    return normalizeInstagramReel(unwrapData(response));
  },

  /**
   * Create a new Instagram reel (admin).
   * Endpoint: POST /api/v1/admin/instagram-reels
   */
  async createReel(payload) {
    const response = await apiClient.post('/api/v1/admin/instagram-reels', payload);
    return normalizeInstagramReel(unwrapData(response));
  },

  /**
   * Update an existing Instagram reel (admin, partial update).
   * Endpoint: PUT /api/v1/admin/instagram-reels/{id}
   */
  async updateReel(reelId, payload) {
    if (!reelId) {
      throw new Error('Reel ID is required for update');
    }
    const response = await apiClient.put(`/api/v1/admin/instagram-reels/${reelId}`, payload);
    return normalizeInstagramReel(unwrapData(response));
  },

  /**
   * Delete an Instagram reel (admin).
   * Endpoint: DELETE /api/v1/admin/instagram-reels/{id}
   */
  async deleteReel(reelId) {
    if (!reelId) {
      throw new Error('Reel ID is required for deletion');
    }
    const response = await apiClient.delete(`/api/v1/admin/instagram-reels/${reelId}`, {
      validateStatus: (status) => status === 204 || (status >= 200 && status < 300),
      transformResponse: [(data) => (data == null || data === '' ? null : data)],
    });
    return { success: true, status: response.status || 204 };
  },

  /**
   * Publish or unpublish an Instagram reel (admin).
   * Endpoint: PATCH /api/v1/admin/instagram-reels/{id}/publish
   */
  async publishReel(reelId, isPublished) {
    if (!reelId) {
      throw new Error('Reel ID is required');
    }
    const response = await apiClient.patch(`/api/v1/admin/instagram-reels/${reelId}/publish`, {
      is_published: Boolean(isPublished),
    });
    return normalizeInstagramReel(unwrapData(response));
  },

  /**
   * Update display order of an Instagram reel (admin).
   * Endpoint: PATCH /api/v1/admin/instagram-reels/{id}/order
   */
  async updateDisplayOrder(reelId, displayOrder) {
    if (!reelId) {
      throw new Error('Reel ID is required');
    }
    const order = Math.max(0, parseInt(displayOrder, 10) || 0);
    const response = await apiClient.patch(`/api/v1/admin/instagram-reels/${reelId}/order`, {
      display_order: order,
    });
    return normalizeInstagramReel(unwrapData(response));
  },

  /**
   * Get Instagram section visibility settings (admin).
   * Endpoint: GET /api/v1/admin/instagram-reels/settings
   */
  async getSettings() {
    const response = await apiClient.get('/api/v1/admin/instagram-reels/settings');
    return normalizeInstagramSectionSettings(unwrapData(response));
  },

  /**
   * Update Instagram section visibility settings (admin).
   * Endpoint: PUT /api/v1/admin/instagram-reels/settings
   */
  async updateSettings(isEnabled) {
    const response = await apiClient.put('/api/v1/admin/instagram-reels/settings', {
      is_enabled: Boolean(isEnabled),
    });
    return normalizeInstagramSectionSettings(unwrapData(response));
  },

  /**
   * List published Instagram reels with section status (public).
   * Endpoint: GET /api/v1/public/instagram-reels
   */
  async listPublic({ page = 1, page_size = 20 } = {}) {
    const response = await apiClient.get('/api/v1/public/instagram-reels', {
      params: {
        page: Math.max(1, Number(page) || 1),
        page_size: Math.min(100, Math.max(1, Number(page_size) || 20)),
      },
    });
    const raw = unwrapData(response) || {};
    const items = Array.isArray(raw.items) ? raw.items.map(normalizeInstagramReel) : [];
    return {
      is_enabled: Boolean(raw.is_enabled),
      items,
      total: typeof raw.total === 'number' ? raw.total : items.length,
      page: typeof raw.page === 'number' ? raw.page : page,
      page_size: typeof raw.page_size === 'number' ? raw.page_size : page_size,
      total_pages: typeof raw.total_pages === 'number' ? raw.total_pages : 0,
    };
  },
};
