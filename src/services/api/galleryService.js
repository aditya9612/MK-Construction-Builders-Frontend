import { apiClient } from './apiClient';
import { mediaUrl } from './cmsUploadService';

export const GALLERY_CATEGORIES = ['projects', 'site', 'interior', 'exterior', 'team', 'other'];
export const PUBLICATION_STATUSES = ['DRAFT', 'PUBLISHED'];

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

export function normalizeGalleryItem(item) {
  if (!item || typeof item !== 'object') return item;
  const media = item.media;
  const urlPath = item.src_full || item.src || media?.url_path;
  return {
    ...item,
    media_id: item.media_id ?? media?.id ?? null,
    image: mediaUrl(urlPath),
  };
}

export const galleryService = {
  /**
   * List all gallery items (admin).
   * Endpoint: GET /api/v1/admin/gallery
   */
  async list({
    page = 1,
    page_size = 20,
    search = '',
    category = '',
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
    if (category && String(category).trim()) params.category = String(category).trim();
    if (publication_status && String(publication_status).trim()) {
      params.publication_status = String(publication_status).trim();
    }

    const response = await apiClient.get('/api/v1/admin/gallery', { params });
    const result = unwrapList(response, page, params.page_size);
    return {
      ...result,
      items: result.items.map(normalizeGalleryItem),
    };
  },

  /**
   * Create a gallery item from an uploaded media ID.
   * Endpoint: POST /api/v1/admin/gallery
   */
  async create(payload) {
    const response = await apiClient.post('/api/v1/admin/gallery', payload);
    return normalizeGalleryItem(unwrapData(response));
  },

  /**
   * Update a gallery item.
   * Endpoint: PUT /api/v1/admin/gallery/{item_id}
   */
  async update(itemId, payload) {
    const response = await apiClient.put(`/api/v1/admin/gallery/${itemId}`, payload);
    return normalizeGalleryItem(unwrapData(response));
  },

  /**
   * Delete a gallery item (does not delete the media file).
   * Endpoint: DELETE /api/v1/admin/gallery/{item_id}
   * Success: 204 No Content
   */
  async delete(itemId) {
    return requestNoContent(() =>
      apiClient.delete(`/api/v1/admin/gallery/${itemId}`, {
        validateStatus: (status) => status === 204 || (status >= 200 && status < 300),
        transformResponse: [(data) => (data == null || data === '' ? null : data)],
      })
    );
  },
};
