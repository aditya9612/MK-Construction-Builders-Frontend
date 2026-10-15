import { apiClient } from './apiClient';

/**
 * Material master service — hits the real backend API.
 * Endpoint base: /api/v1/materials
 */
export const materialService = {
  async getAll() {
    try {
      const response = await apiClient.get('/api/v1/materials');
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
    const response = await apiClient.get(`/api/v1/materials/${id}`);
    const resData = response.data;
    return resData?.data || resData;
  },

  async create(payload) {
    const response = await apiClient.post('/api/v1/materials', payload);
    const resData = response.data;
    return resData?.data || resData;
  },

  async update(id, patch) {
    const response = await apiClient.put(`/api/v1/materials/${id}`, patch);
    const resData = response.data;
    return resData?.data || resData;
  },

  async delete(id) {
    const response = await apiClient.delete(`/api/v1/materials/${id}`);
    return response.data;
  },
};
