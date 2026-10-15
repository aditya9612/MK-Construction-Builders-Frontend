import { apiClient } from './apiClient';
import { storage } from '../../utils/storage/localStorage';
import { STORAGE_KEYS } from '../../constants';

/**
 * Decode JWT token payload safely without external dependencies.
 */
export function decodeJwt(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.warn('Unable to decode JWT token:', err);
    return null;
  }
}

/**
 * Format a human-readable display name from email or JWT claims.
 */
function deriveDisplayName(email, payload) {
  if (payload?.name && typeof payload.name === 'string') {
    return payload.name;
  }
  if (payload?.full_name && typeof payload.full_name === 'string') {
    return payload.full_name;
  }
  const cleanEmail = payload?.email || email || '';
  const prefix = cleanEmail.split('@')[0] || 'User';
  // Capitalize first letter or split by dot/underscore
  return prefix
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ') || 'User';
}

/**
 * Extract an error message from FastAPI or standard axios error responses.
 */
export function extractErrorMessage(error, defaultMsg = 'Authentication failed. Please check your credentials.') {
  if (!error) return defaultMsg;
  const resData = error.response?.data;
  if (!resData) {
    return error.message || defaultMsg;
  }
  if (typeof resData === 'string') return resData;
  if (resData.message) return resData.message;
  if (resData.detail) {
    if (typeof resData.detail === 'string') return resData.detail;
    if (Array.isArray(resData.detail) && resData.detail.length > 0) {
      return resData.detail.map((d) => d.msg || d.message || JSON.stringify(d)).join(', ');
    }
  }
  return defaultMsg;
}

export const authService = {
  /**
   * Login with email and password.
   * Endpoint: POST /api/v1/auth/login
   */
  async login({ email, password }) {
    const response = await apiClient.post('/api/v1/auth/login', {
      email,
      password,
    });

    const resData = response.data;
    // Server response can be { success: true, message: "...", data: { access_token, refresh_token, token_type } }
    const authData = resData?.data || resData;
    const accessToken = authData?.access_token;
    const refreshToken = authData?.refresh_token;
    const tokenType = authData?.token_type || 'bearer';

    if (!accessToken) {
      throw new Error(resData?.message || 'Authentication succeeded but no access token was returned.');
    }

    const payload = decodeJwt(accessToken);
    const userEmail = payload?.email || email;
    const userName = deriveDisplayName(userEmail, payload);
    const userRole = payload?.role || 'Admin';

    const session = {
      name: userName,
      email: userEmail,
      role: userRole,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: tokenType,
      token: accessToken, // Maintained for backward compatibility with existing components
      expires_at: payload?.exp ? payload.exp * 1000 : null,
    };

    // Save initial session
    storage.set(STORAGE_KEYS.session, session);

    // Try fetching the full user profile from GET /api/v1/auth/me
    try {
      const meResponse = await apiClient.get('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userData = meResponse.data?.data || meResponse.data;
      if (userData) {
        if (userData.name) session.name = userData.name;
        if (userData.email) session.email = userData.email;
        if (userData.phone) session.phone = userData.phone;
        if (userData.role?.name) session.role = userData.role.name;
        if (userData.is_active !== undefined) session.is_active = userData.is_active;
        if (userData.id) session.id = userData.id;
        storage.set(STORAGE_KEYS.session, session);
      }
    } catch (meErr) {
      console.warn('Could not fetch profile right after login:', meErr);
    }

    window.dispatchEvent(new Event('storage'));
    return { session, raw: resData };
  },

  /**
   * Return the authenticated user profile.
   * Endpoint: GET /api/v1/auth/me
   */
  async getCurrentUser() {
    const response = await apiClient.get('/api/v1/auth/me');
    const resData = response.data;
    const userData = resData?.data || resData;

    // Update stored session with the latest profile details
    const currentSession = storage.get(STORAGE_KEYS.session, null);
    if (currentSession && userData) {
      const updatedSession = {
        ...currentSession,
        id: userData.id ?? currentSession.id,
        name: userData.name || currentSession.name,
        email: userData.email || currentSession.email,
        phone: userData.phone ?? currentSession.phone,
        role: userData.role?.name || (typeof userData.role === 'string' ? userData.role : currentSession.role),
        role_id: userData.role_id || userData.role?.id,
        is_active: userData.is_active,
      };
      storage.set(STORAGE_KEYS.session, updatedSession);
      window.dispatchEvent(new Event('storage'));
    }

    return userData;
  },

  /**
   * Refresh access token using a valid refresh token.
   * Endpoint: POST /api/v1/auth/refresh
   */
  async refreshToken(providedRefreshToken) {
    const currentSession = storage.get(STORAGE_KEYS.session, null);
    const tokenToUse = providedRefreshToken || currentSession?.refresh_token;

    if (!tokenToUse) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post('/api/v1/auth/refresh', {
      refresh_token: tokenToUse,
    });

    const resData = response.data;
    const authData = resData?.data || resData;
    const newAccessToken = authData?.access_token;
    const newRefreshToken = authData?.refresh_token || tokenToUse;
    const tokenType = authData?.token_type || 'bearer';

    if (!newAccessToken) {
      throw new Error(resData?.message || 'Token refresh succeeded but no access token was returned.');
    }

    const payload = decodeJwt(newAccessToken);
    const updatedSession = {
      ...(currentSession || {}),
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      token_type: tokenType,
      token: newAccessToken,
      expires_at: payload?.exp ? payload.exp * 1000 : null,
      name: currentSession?.name || deriveDisplayName(currentSession?.email, payload),
      email: currentSession?.email || payload?.email || '',
      role: currentSession?.role || payload?.role || 'Admin',
    };

    storage.set(STORAGE_KEYS.session, updatedSession);
    return { session: updatedSession, raw: resData };
  },

  /**
   * Verify and refresh active session if refresh token exists.
   */
  async refreshSession() {
    const currentSession = storage.get(STORAGE_KEYS.session, null);
    if (!currentSession?.refresh_token) {
      return null;
    }
    return await this.refreshToken(currentSession.refresh_token);
  },

  /**
   * Clear session.
   */
  logout() {
    storage.remove(STORAGE_KEYS.session);
  },

  /**
   * Get current stored session.
   */
  getSession() {
    return storage.get(STORAGE_KEYS.session, null);
  },

  /**
   * Check if a session exists.
   */
  isAuthenticated() {
    const session = this.getSession();
    return Boolean(session?.access_token || session?.token);
  },
};
