import { apiClient } from './apiClient';

export const ENQUIRY_STATUSES = ['NEW', 'READ', 'CONTACTED', 'CLOSED', 'SPAM'];

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

function listParams({
  page = 1,
  page_size = 20,
  search = '',
  status = '',
  is_read,
  date_from = '',
  date_to = '',
  sort_by = 'created_at',
  sort_order = 'desc',
} = {}) {
  const params = {
    page,
    page_size: Math.min(Math.max(Number(page_size) || 20, 1), 100),
    sort_by: sort_by || 'created_at',
    sort_order: sort_order || 'desc',
  };
  if (search && String(search).trim()) params.search = String(search).trim();
  if (status && String(status).trim()) params.status = String(status).trim();
  if (is_read === true || is_read === false || is_read === 'true' || is_read === 'false') {
    params.is_read = is_read === true || is_read === 'true';
  }
  if (date_from && String(date_from).trim()) params.date_from = String(date_from).trim();
  if (date_to && String(date_to).trim()) params.date_to = String(date_to).trim();
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

export const enquiryService = {
  /**
   * Unread badge count.
   * Endpoint: GET /api/v1/admin/enquiries/unread-count
   */
  async getUnreadCount() {
    const response = await apiClient.get('/api/v1/admin/enquiries/unread-count');
    const data = unwrapData(response);
    return Number(data?.unread_count) || 0;
  },

  /**
   * Paginated admin enquiry list.
   * Endpoint: GET /api/v1/admin/enquiries
   */
  async list(options = {}) {
    const params = listParams(options);
    const response = await apiClient.get('/api/v1/admin/enquiries', { params });
    return unwrapList(response, options.page, params.page_size);
  },

  /**
   * Enquiry detail. Opening an unread enquiry marks it read on the server.
   * Endpoint: GET /api/v1/admin/enquiries/{id}
   */
  async get(enquiryId) {
    const response = await apiClient.get(`/api/v1/admin/enquiries/${enquiryId}`);
    return unwrapData(response);
  },

  /**
   * Update status, notes, and/or read flag. Only provided fields are sent.
   * Endpoint: PATCH /api/v1/admin/enquiries/{id}
   */
  async update(enquiryId, payload = {}) {
    const body = {};
    if (payload.status != null && payload.status !== '') body.status = payload.status;
    if (Object.prototype.hasOwnProperty.call(payload, 'admin_notes')) {
      body.admin_notes = payload.admin_notes;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'is_read')) {
      body.is_read = payload.is_read;
    }
    const response = await apiClient.patch(`/api/v1/admin/enquiries/${enquiryId}`, body);
    return unwrapData(response);
  },

  /**
   * Mark an enquiry unread.
   * Endpoint: POST /api/v1/admin/enquiries/{id}/mark-unread
   */
  async markUnread(enquiryId) {
    const response = await apiClient.post(`/api/v1/admin/enquiries/${enquiryId}/mark-unread`);
    return unwrapData(response);
  },

  /**
   * Delete an enquiry.
   * Endpoint: DELETE /api/v1/admin/enquiries/{id}
   * Success: 204 No Content
   */
  async delete(enquiryId) {
    return requestNoContent(() =>
      apiClient.delete(`/api/v1/admin/enquiries/${enquiryId}`, {
        validateStatus: (status) => status === 204 || (status >= 200 && status < 300),
        transformResponse: [(data) => (data == null || data === '' ? null : data)],
      })
    );
  },
};
