import axios from 'axios';

/**
 * Axios instance for a future FastAPI backend.
 * UI code should call service modules, not this client directly from pages.
 * Swap mock services to use apiClient.get/post/put/delete when the API is ready.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const session = (() => {
    try {
      return JSON.parse(window.localStorage.getItem('mk.session') || 'null');
    } catch {
      return null;
    }
  })();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});
