import { apiClient } from './apiClient';

/**
 * Rate master service — hits the real backend API.
 * Endpoint base: /api/v1/rate-masters
 */
export const rateService = {
  async getAll() {
    try {
      const response = await apiClient.get('/api/v1/rate-masters');
      const resData = response.data;
      const data = resData?.data || resData;
      return Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : [];
    } catch {
      return [];
    }
  },

  async getById(id) {
    const response = await apiClient.get(`/api/v1/rate-masters/${id}`);
    const resData = response.data;
    return resData?.data || resData;
  },

  async create(payload) {
    const response = await apiClient.post('/api/v1/rate-masters', payload);
    const resData = response.data;
    return resData?.data || resData;
  },

  async update(id, patch) {
    const response = await apiClient.put(`/api/v1/rate-masters/${id}`, patch);
    const resData = response.data;
    return resData?.data || resData;
  },

  async delete(id) {
    const response = await apiClient.delete(`/api/v1/rate-masters/${id}`);
    return response.data;
  },
};
