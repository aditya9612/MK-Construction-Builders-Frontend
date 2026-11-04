import { apiClient } from './apiClient';
import { mediaUrl } from './cmsUploadService';

export const PORTFOLIO_TYPES = ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'RENOVATION', 'OTHER'];
export const PORTFOLIO_STATUSES = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SHOWCASE'];
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

function normalizeMedia(media) {
  if (!media || typeof media !== 'object') return media || null;
  return {
    ...media,
    url: mediaUrl(media.url_path || media.url),
  };
}

function normalizeGalleryEntry(entry) {
  if (!entry || typeof entry !== 'object') return entry;
  return {
    ...entry,
    media: normalizeMedia(entry.media),
    url: mediaUrl(entry.media?.url_path),
  };
}

export function normalizePortfolioProject(project) {
  if (!project || typeof project !== 'object') return project;
  const gallery = Array.isArray(project.gallery) ? project.gallery.map(normalizeGalleryEntry) : [];
  return {
    ...project,
    main_image: normalizeMedia(project.main_image),
    gallery,
  };
}

function listParams({
  page = 1,
  page_size = 20,
  search = '',
  type = '',
  status = '',
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
  if (type && String(type).trim()) params.type = String(type).trim();
  if (status && String(status).trim()) params.status = String(status).trim();
  if (publication_status && String(publication_status).trim()) {
    params.publication_status = String(publication_status).trim();
  }
  return params;
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

export function slugifyPortfolioName(name) {
  const slug = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 220);
  return slug || `project-${Date.now()}`;
}

export const portfolioService = {
  /**
   * List published portfolio projects (public).
   * Endpoint: GET /api/v1/portfolio/projects
   */
  async list(options = {}) {
    const params = listParams(options);
    const response = await apiClient.get('/api/v1/portfolio/projects', { params });
    const result = unwrapList(response, options.page, params.page_size);
    return {
      ...result,
      items: result.items.map(normalizePortfolioProject),
    };
  },

  /**
   * List all portfolio projects including drafts (admin).
   * Endpoint: GET /api/v1/admin/portfolio/projects
   */
  async listAdmin(options = {}) {
    const params = listParams(options);
    const response = await apiClient.get('/api/v1/admin/portfolio/projects', { params });
    const result = unwrapList(response, options.page, params.page_size);
    return {
      ...result,
      items: result.items.map(normalizePortfolioProject),
    };
  },

  /**
   * Get one portfolio project by id (admin).
   * Endpoint: GET /api/v1/admin/portfolio/projects/{project_id}
   */
  async get(projectId) {
    const response = await apiClient.get(`/api/v1/admin/portfolio/projects/${projectId}`);
    return normalizePortfolioProject(unwrapData(response));
  },

  /**
   * Create a portfolio project.
   * Endpoint: POST /api/v1/admin/portfolio/projects
   * Payload includes main_image_id from the upload API.
   */
  async create(payload) {
    const response = await apiClient.post('/api/v1/admin/portfolio/projects', payload);
    return normalizePortfolioProject(unwrapData(response));
  },

  /**
   * Update a portfolio project.
   * Endpoint: PUT /api/v1/admin/portfolio/projects/{project_id}
   */
  async update(projectId, payload) {
    const response = await apiClient.put(`/api/v1/admin/portfolio/projects/${projectId}`, payload);
    return normalizePortfolioProject(unwrapData(response));
  },

  /**
   * Delete a portfolio project.
   * Endpoint: DELETE /api/v1/admin/portfolio/projects/{project_id}
   * Success: 204 No Content
   */
  async delete(projectId) {
    return requestNoContent(() =>
      apiClient.delete(`/api/v1/admin/portfolio/projects/${projectId}`, {
        validateStatus: (status) => status === 204 || (status >= 200 && status < 300),
        transformResponse: [(data) => (data == null || data === '' ? null : data)],
      })
    );
  },

  /**
   * Attach gallery images by media IDs.
   * Endpoint: POST /api/v1/admin/portfolio/projects/{project_id}/gallery
   */
  async attachGallery(projectId, mediaIds, displayOrders) {
    const payload = { media_ids: mediaIds };
    if (displayOrders) payload.display_orders = displayOrders;
    const response = await apiClient.post(
      `/api/v1/admin/portfolio/projects/${projectId}/gallery`,
      payload
    );
    return normalizePortfolioProject(unwrapData(response));
  },

  /**
   * Detach one gallery image by media ID.
   * Endpoint: DELETE /api/v1/admin/portfolio/projects/{project_id}/gallery/{media_id}
   */
  async detachGalleryMedia(projectId, mediaId) {
    const response = await apiClient.delete(
      `/api/v1/admin/portfolio/projects/${projectId}/gallery/${mediaId}`
    );
    return normalizePortfolioProject(unwrapData(response));
  },
};
