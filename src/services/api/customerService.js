import { apiClient } from './apiClient';

export const customerService = {
  /**
   * List customers with pagination, search, and sorting.
   * Endpoint: GET /api/v1/customers
   */
  async list({
    page = 1,
    page_size = 50,
    search = '',
    is_active = null,
    sort_by = 'created_at',
    sort_order = 'desc',
  } = {}) {
    const params = {
      page,
      page_size,
      sort_by,
      sort_order,
    };
    if (search && search.trim()) {
      params.search = search.trim();
    }
    if (is_active !== null && is_active !== undefined && is_active !== '') {
      params.is_active = is_active;
    }

    const response = await apiClient.get('/api/v1/customers', { params });
    const resData = response.data;
    return resData?.data || resData;
  },

  /**
   * Get all customers (returns array of items for listing & dropdowns).
   */
  async getAll() {
    const data = await this.list({ page_size: 100 });
    return data?.items || [];
  },

  /**
   * Get single customer by ID.
   * Endpoint: GET /api/v1/customers/{customer_id}
   */
  async getById(id) {
    const response = await apiClient.get(`/api/v1/customers/${id}`);
    const resData = response.data;
    return resData?.data || resData;
  },

  /**
   * Create customer.
   * Endpoint: POST /api/v1/customers
   */
  async create(payload) {
    const cleanPayload = {
      name: payload.name?.trim() || '',
      mobile: payload.mobile?.trim() || '',
      email: payload.email?.trim() || null,
      customer_type: (payload.customer_type || payload.type || 'INDIVIDUAL').toUpperCase(),
      address: payload.address?.trim() || '',
      city: payload.city?.trim() || '',
      state: payload.state?.trim() || '',
      pincode: payload.pincode?.trim() || '',
      notes: payload.notes?.trim() || '',
      is_active: payload.is_active ?? true,
    };

    const response = await apiClient.post('/api/v1/customers', cleanPayload);
    const resData = response.data;
    return resData?.data || resData;
  },

  /**
   * Update customer.
   * Endpoint: PUT /api/v1/customers/{customer_id}
   */
  async update(id, payload) {
    const cleanPayload = {
      name: payload.name?.trim() || '',
      mobile: payload.mobile?.trim() || '',
      email: payload.email?.trim() || null,
      customer_type: (payload.customer_type || payload.type || 'INDIVIDUAL').toUpperCase(),
      address: payload.address?.trim() || '',
      city: payload.city?.trim() || '',
      state: payload.state?.trim() || '',
      pincode: payload.pincode?.trim() || '',
      notes: payload.notes?.trim() || '',
      is_active: payload.is_active ?? true,
    };

    const response = await apiClient.put(`/api/v1/customers/${id}`, cleanPayload);
    const resData = response.data;
    return resData?.data || resData;
  },

  /**
   * Soft-delete / deactivate customer.
   * Endpoint: DELETE /api/v1/customers/{customer_id}
   */
  async delete(id) {
    const response = await apiClient.delete(`/api/v1/customers/${id}`);
    return response.data;
  },
};
