import { apiClient } from './apiClient';
import { mediaUrl } from './cmsUploadService';

export const PORTFOLIO_TYPES = ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'RENOVATION', 'OTHER'];
export const PORTFOLIO_STATUSES = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SHOWCASE'];

function normalizePortfolioProject(project) {
  if (!project || typeof project !== 'object') return project;
  const mainImage = project.main_image;
  return {
    ...project,
    main_image: mainImage
      ? {
          ...mainImage,
          url: mediaUrl(mainImage.url_path || mainImage.url),
        }
      : null,
  };
}

export const portfolioService = {
  /**
   * List published portfolio projects.
   * Endpoint: GET /api/v1/portfolio/projects
   */
  async list({
    page = 1,
    page_size = 20,
    search = '',
    type = '',
    status = '',
    sort_by = 'display_order',
    sort_order = 'asc',
  } = {}) {
    const params = {
      page,
      page_size: Math.min(Math.max(Number(page_size) || 20, 1), 100),
      sort_by: sort_by || 'display_order',
      sort_order: sort_order || 'asc',
    };
    if (search && String(search).trim()) {
      params.search = String(search).trim();
    }
    if (type && String(type).trim()) {
      params.type = String(type).trim();
    }
    if (status && String(status).trim()) {
      params.status = String(status).trim();
    }

    const response = await apiClient.get('/api/v1/portfolio/projects', { params });
    const resData = response.data;
    const data = resData?.data || resData;
    const items = Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
      ? data.items
      : [];

    return {
      items: items.map(normalizePortfolioProject),
      total: data?.total ?? items.length,
      page: data?.page ?? page,
      page_size: data?.page_size ?? params.page_size,
      total_pages: data?.total_pages ?? 1,
    };
  },
};
