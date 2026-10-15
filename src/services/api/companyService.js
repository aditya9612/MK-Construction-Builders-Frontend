import { apiClient } from './apiClient';

/**
 * Company / settings service — hits the real backend API.
 * Endpoint base: /api/v1/company  (adjust if your backend differs)
 */
export const companyService = {
  async get() {
    try {
      const response = await apiClient.get('/api/v1/company');
      const resData = response.data;
      return resData?.data || resData || null;
    } catch {
      return null;
    }
  },

  async update(patch) {
    const response = await apiClient.put('/api/v1/company', patch);
    const resData = response.data;
    return resData?.data || resData;
  },
};
