import { apiClient } from './apiClient';

export const MEDIA_FOLDERS = ['projects', 'gallery', 'services', 'company', 'reviews'];

const MEDIA_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'https://api.mkconstruction.site').replace(
  /\/$/,
  ''
) || 'https://api.mkconstruction.site';

/**
 * Turn UploadedMediaOut.url_path into an absolute URL for <img src>.
 * API returns paths like /media/gallery/....png which are not under /api.
 */
export function mediaUrl(urlPath) {
  if (!urlPath) return '';
  if (/^https?:\/\//i.test(urlPath) || urlPath.startsWith('data:')) return urlPath;
  const path = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
  return `${MEDIA_ORIGIN}${path}`;
}

function normalizeUploadedMedia(media) {
  if (!media || typeof media !== 'object') return media;
  return {
    ...media,
    url: mediaUrl(media.url_path),
  };
}

export const cmsUploadService = {
  /**
   * Upload a single website image.
   * Endpoint: POST /api/v1/admin/upload/image
   * Body: multipart/form-data { file, folder }
   * folder: projects | gallery | services | company | reviews (default gallery)
   * Success: 201 { success, message, data: UploadedMediaOut }
   */
  async uploadImage(file, folder = 'gallery') {
    if (!file) {
      throw new Error('Choose an image file to upload.');
    }

    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await apiClient.post('/api/v1/admin/upload/image', formData, {
      timeout: 60000,
    });
    const resData = response.data;
    return normalizeUploadedMedia(resData?.data ?? resData);
  },

  /**
   * Upload multiple website images.
   * Endpoint: POST /api/v1/admin/upload/images
   * Body: multipart/form-data { files[], folder }
   * folder: projects | gallery | services | company | reviews (default gallery)
   * Success: 201 { success, message, data: UploadedMediaOut[] }
   */
  async uploadImages(files, folder = 'gallery') {
    const list = Array.from(files || []).filter(Boolean);
    if (!list.length) {
      throw new Error('Choose one or more image files to upload.');
    }

    const formData = new FormData();
    list.forEach((file) => {
      formData.append('files', file);
    });
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await apiClient.post('/api/v1/admin/upload/images', formData, {
      timeout: 120000,
    });
    const resData = response.data;
    const data = resData?.data ?? resData;
    const items = Array.isArray(data) ? data : [];
    return items.map(normalizeUploadedMedia);
  },

  /**
   * Delete uploaded media by database media ID (never by filesystem path).
   * Endpoint: DELETE /api/v1/admin/upload/{file_id}
   * Success: 204 No Content (empty body — not JSON)
   */
  async deleteUpload(fileId) {
    if (fileId == null || fileId === '') {
      throw new Error('file_id is required');
    }

    try {
      const response = await apiClient.delete(`/api/v1/admin/upload/${fileId}`, {
        validateStatus: (status) => status === 204 || (status >= 200 && status < 300),
        transformResponse: [(data) => (data == null || data === '' ? null : data)],
      });
      return { success: true, status: response.status || 204 };
    } catch (error) {
      // Some proxies/axios builds throw on an empty 204 body. The file is already deleted.
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
  },
};
