import { apiClient } from './apiClient';
import { mediaUrl } from './cmsUploadService';

export const SERVICE_PUBLICATION_STATUSES = ['DRAFT', 'PUBLISHED'];

function unwrapData(response) {
  const resData = response.data;
  return resData?.data ?? resData;
}

function unwrapList(response, page, pageSize) {
  const data = unwrapData(response);
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
    ? data.items
    : [];
  return {
    items,
    total: data?.total ?? items.length,
    page: data?.page ?? page,
    page_size: data?.page_size ?? pageSize,
    total_pages: data?.total_pages ?? 1,
  };
}

async function requestNoContent(request) {
  try {
    const response = await request();
    return { success: true, status: response.status || 204 };
  } catch (error) {
    const status = error.response?.status;
    if (status === 204 || status === 200) {
      return { success: true, status };
    }
    const message = error.message || '';
    if (!error.response && /unexpected end of json|json.parse/i.test(message)) {
      return { success: true, status: 204 };
    }
    throw error;
  }
}

function normalizeMedia(media) {
  if (!media || typeof media !== 'object') return media || null;
  return {
    ...media,
    url: mediaUrl(media.url_path || media.url),
  };
}

export function slugifyServiceTitle(title) {
  const slug = String(title || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 220);
  return slug || `service-${Date.now()}`;
}

export function normalizeCmsService(item) {
  if (!item || typeof item !== 'object') return item;
  const imageRef = item.image && typeof item.image === 'object' ? item.image : item.media;
  const urlPath =
    (typeof item.image === 'string' ? item.image : null) ||
    imageRef?.url_path ||
    imageRef?.url ||
    item.src_full ||
    item.src;
  const features = Array.isArray(item.features)
    ? item.features.filter((entry) => typeof entry === 'string' && entry.trim())
    : [];
  return {
    ...item,
    image_id: item.image_id ?? imageRef?.id ?? null,
    image: imageRef ? { ...normalizeMedia(imageRef), url: mediaUrl(urlPath) } : urlPath ? { url: mediaUrl(urlPath) } : null,
    features,
  };
}

export const cmsServiceService = {
  /**
   * List all website services (admin).
   * Endpoint: GET /api/v1/admin/services
   */
  async list({
    page = 1,
    page_size = 20,
    search = '',
    publication_status = '',
    sort_by = 'display_order',
    sort_order = 'asc',
  } = {}) {
    const params = {
      page,
      page_size: Math.min(Math.max(Number(page_size) || 20, 1), 100),
      sort_by: sort_by || 'display_order',
      sort_order: sort_order || 'asc',
    };
    if (search && String(search).trim()) params.search = String(search).trim();
    if (publication_status && String(publication_status).trim()) {
      params.publication_status = String(publication_status).trim();
    }

    const response = await apiClient.get('/api/v1/admin/services', { params });
    const result = unwrapList(response, page, params.page_size);
    return {
      ...result,
      items: result.items.map(normalizeCmsService),
    };
  },

  /**
   * Get one service by id (admin).
   * Endpoint: GET /api/v1/admin/services/{service_id}
   */
  async get(serviceId) {
    const response = await apiClient.get(`/api/v1/admin/services/${serviceId}`);
    return normalizeCmsService(unwrapData(response));
  },

  /**
   * Create a website service.
   * Endpoint: POST /api/v1/admin/services
   * Payload includes image_id from POST /api/v1/admin/upload/image (folder=services).
   */
  async create(payload) {
    const response = await apiClient.post('/api/v1/admin/services', payload);
    return normalizeCmsService(unwrapData(response));
  },

  /**
   * Update a website service.
   * Endpoint: PUT /api/v1/admin/services/{service_id}
   */
  async update(serviceId, payload) {
    const response = await apiClient.put(`/api/v1/admin/services/${serviceId}`, payload);
    return normalizeCmsService(unwrapData(response));
  },

  /**
   * Delete a website service.
   * Endpoint: DELETE /api/v1/admin/services/{service_id}
   * Success: 204 No Content
   */
  async delete(serviceId) {
    return requestNoContent(() =>
      apiClient.delete(`/api/v1/admin/services/${serviceId}`, {
        validateStatus: (status) => status === 204 || (status >= 200 && status < 300),
        transformResponse: [(data) => (data == null || data === '' ? null : data)],
      })
    );
  },
};
