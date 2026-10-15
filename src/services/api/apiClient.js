import axios from 'axios';

const resolveBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl !== undefined && envUrl !== '') {
    return envUrl;
  }
  // In dev mode, use relative URL to leverage Vite proxy and avoid browser CORS preflight issues
  if (import.meta.env.DEV) {
    return '';
  }
  return 'https://api.mkconstruction.site';
};

export const apiClient = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/plain, */*',
  },
});

apiClient.interceptors.request.use((config) => {
  const session = (() => {
    try {
      return JSON.parse(window.localStorage.getItem('mk.session') || 'null');
    } catch {
      return null;
    }
  })();

  const token = session?.access_token || session?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatic token refresh interceptor for 401 responses
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Trigger refresh only for 401 errors on protected endpoints
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const rawSession = window.localStorage.getItem('mk.session');
        const session = rawSession ? JSON.parse(rawSession) : null;
        const refreshToken = session?.refresh_token;

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const baseURL = apiClient.defaults.baseURL || 'https://api.mkconstruction.site';
        const refreshResponse = await axios.post(
          `${baseURL.replace(/\/$/, '')}/api/v1/auth/refresh`,
          { refresh_token: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const resData = refreshResponse.data;
        const authData = resData?.data || resData;
        const newAccessToken = authData?.access_token;
        const newRefreshToken = authData?.refresh_token || refreshToken;

        if (!newAccessToken) {
          throw new Error('No access token returned from refresh');
        }

        const updatedSession = {
          ...session,
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          token: newAccessToken,
        };
        window.localStorage.setItem('mk.session', JSON.stringify(updatedSession));

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        window.localStorage.removeItem('mk.session');
        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
