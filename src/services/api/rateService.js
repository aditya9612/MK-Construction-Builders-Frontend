import { apiClient } from './apiClient';

/**
 * Rate master service — hits the real backend API.
 * Endpoint base: /api/v1/rates
 *
 * UI continues to use `item` / `status`; those are mapped to `name` / `is_active`
 * so existing Rate Master screens keep working.
 */
function toActiveFlag(payload) {
  if (typeof payload?.is_active === 'boolean') return payload.is_active;
  if (payload?.status === 'Inactive') return false;
  return true;
}

function formatRatePayload(payload = {}) {
  const name = (payload.name || payload.item || '').toString().trim();
  const category = (payload.category || '').toString().trim();
  const unit = (payload.unit || '').toString().trim();
  const rate = Number(payload.rate);
  const description = payload.description?.toString().trim() || null;

  return {
    name,
    category,
    unit,
    rate: Number.isFinite(rate) ? rate : 0,
    description,
    is_active: toActiveFlag(payload),
    effective_from: payload.effective_from || null,
    effective_to: payload.effective_to || null,
  };
}

function normalizeRate(rate) {
  if (!rate || typeof rate !== 'object') return rate;
  return {
    ...rate,
    item: rate.item || rate.name || '',
    name: rate.name || rate.item || '',
    rate: rate.rate != null ? Number(rate.rate) : 0,
    status: rate.status || (rate.is_active === false ? 'Inactive' : 'Active'),
  };
}

export const rateService = {
  /**
   * List rates with pagination and optional filters.
   * Endpoint: GET /api/v1/rates
   */
  async list({
    page = 1,
    page_size = 20,
    search = '',
    category = '',
    unit = '',
    is_active = null,
  } = {}) {
    const params = {
      page,
      page_size: Math.min(Math.max(Number(page_size) || 20, 1), 100),
    };
    if (search && String(search).trim()) {
      params.search = String(search).trim();
    }
    if (category && String(category).trim()) {
      params.category = String(category).trim();
    }
    if (unit && String(unit).trim()) {
      params.unit = String(unit).trim();
    }
    if (is_active !== null && is_active !== undefined && is_active !== '') {
      params.is_active = is_active;
    }

    const response = await apiClient.get('/api/v1/rates', { params });
    const resData = response.data;
    const data = resData?.data || resData;
    const items = Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
      ? data.items
      : [];

    return {
      items: items.map(normalizeRate),
      total: data?.total ?? items.length,
      page: data?.page ?? page,
      page_size: data?.page_size ?? params.page_size,
      total_pages: data?.total_pages ?? 1,
    };
  },

  /**
   * Get all rates as an array for listing screens and quotation defaults.
   * Endpoint: GET /api/v1/rates
   */
  async getAll() {
    try {
      const first = await this.list({ page: 1, page_size: 100 });
      const pages = first.total_pages || 1;
      if (pages <= 1) return first.items;

      const rest = await Promise.all(
        Array.from({ length: pages - 1 }, (_, i) =>
          this.list({ page: i + 2, page_size: 100 })
        )
      );
      return first.items.concat(...rest.map((page) => page.items));
    } catch {
      return [];
    }
  },

  async getById(id) {
    const response = await apiClient.get(`/api/v1/rates/${id}`);
    const resData = response.data;
    return normalizeRate(resData?.data || resData);
  },

  /**
   * Create rate.
   * Endpoint: POST /api/v1/rates
   */
  async create(payload) {
    const response = await apiClient.post('/api/v1/rates', formatRatePayload(payload));
    const resData = response.data;
    return normalizeRate(resData?.data || resData);
  },

  async update(id, patch) {
    const response = await apiClient.put(`/api/v1/rates/${id}`, formatRatePayload(patch));
    const resData = response.data;
    return normalizeRate(resData?.data || resData);
  },

  async delete(id) {
    const response = await apiClient.delete(`/api/v1/rates/${id}`);
    return response.data;
  },
};
