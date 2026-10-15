import { apiClient } from './apiClient';

/**
 * Normalizes project objects returned by the backend API.
 * Ensures consistent access whether frontend components use camelCase or snake_case,
 * and parses raw numeric strings/decimals safely.
 */
export function normalizeProject(raw) {
  if (!raw) return null;

  const id = raw.id;
  const projectName = raw.project_name || raw.name || '';
  const customerId = raw.customer_id ?? raw.customerId ?? null;
  const siteAddress = raw.site_address || raw.siteAddress || '';

  // Parse plot area and construction area safely from high precision decimals or strings
  const plotAreaNum = raw.plot_area !== undefined && raw.plot_area !== null
    ? Number(raw.plot_area) || 0
    : Number(raw.plotArea) || 0;

  const constructionAreaNum = raw.construction_area !== undefined && raw.construction_area !== null
    ? Number(raw.construction_area) || 0
    : Number(raw.constructionArea) || 0;

  const floorType = raw.floor_type || raw.floors || 'G+1';
  const numberOfFloors = raw.number_of_floors !== undefined && raw.number_of_floors !== null
    ? Number(raw.number_of_floors) || 1
    : Number(raw.floorsCount) || 1;

  const startDate = raw.start_date || raw.startDate || '';
  const status = raw.status || 'PLANNING';
  const projectCode = raw.project_code || (id ? `PRJ-${String(id).padStart(3, '0')}` : '');
  const notes = raw.notes || '';

  return {
    ...raw,
    id,
    project_code: projectCode,
    projectCode,
    project_name: projectName,
    name: projectName,
    customer_id: customerId,
    customerId,
    site_address: siteAddress,
    siteAddress,
    plot_area: plotAreaNum,
    plotArea: plotAreaNum,
    construction_area: constructionAreaNum,
    constructionArea: constructionAreaNum,
    number_of_floors: numberOfFloors,
    numberOfFloors,
    floor_type: floorType,
    floors: floorType,
    start_date: startDate,
    startDate,
    status,
    notes,
    created_at: raw.created_at || raw.createdAt,
    updated_at: raw.updated_at || raw.updatedAt,
  };
}

export const projectService = {
  /**
   * List projects with pagination, search, status, customer_id, and sorting.
   * Endpoint: GET /api/v1/projects
   */
  async list({
    page = 1,
    page_size = 20,
    search = '',
    customer_id = null,
    status = '',
    sort_by = 'created_at',
    sort_order = 'desc',
  } = {}) {
    const params = {
      page: Math.max(1, Number(page) || 1),
      page_size: Math.min(100, Math.max(1, Number(page_size) || 20)),
      sort_by: sort_by || 'created_at',
      sort_order: sort_order || 'desc',
    };

    if (search && search.trim()) {
      params.search = search.trim();
    }

    if (customer_id !== null && customer_id !== undefined && customer_id !== '' && customer_id !== 'ALL') {
      params.customer_id = Number(customer_id);
    }

    if (status && status !== 'ALL') {
      params.status = String(status).toUpperCase().replace(/\s+/g, '_');
    }

    const response = await apiClient.get('/api/v1/projects', { params });
    const resData = response.data;
    const data = resData?.data || resData || {};

    const rawItems = Array.isArray(data.items)
      ? data.items
      : Array.isArray(data)
      ? data
      : [];

    const items = rawItems.map(normalizeProject);
    const total = typeof data.total === 'number'
      ? data.total
      : typeof data.total_items === 'number'
      ? data.total_items
      : items.length;

    const currentPage = typeof data.page === 'number' ? data.page : Number(page) || 1;
    const pageSize = typeof data.page_size === 'number' ? data.page_size : Number(page_size) || 20;
    const totalPages = typeof data.total_pages === 'number'
      ? data.total_pages
      : Math.max(1, Math.ceil(total / Math.max(1, pageSize)));

    return {
      items,
      total,
      page: currentPage,
      page_size: pageSize,
      total_pages: totalPages,
    };
  },

  /**
   * Helper to retrieve all projects for dropdowns and selectors.
   */
  async getAll({ search = '', customer_id = null, status = '' } = {}) {
    const data = await this.list({
      page: 1,
      page_size: 100,
      search,
      customer_id,
      status,
    });
    return data?.items || [];
  },

  /**
   * Get single project by ID.
   * Endpoint: GET /api/v1/projects/{project_id}
   */
  async getById(projectId) {
    if (!projectId) return null;
    const response = await apiClient.get(`/api/v1/projects/${projectId}`);
    const resData = response.data;
    const raw = resData?.data || resData;
    return normalizeProject(raw);
  },

  /**
   * Create a new project.
   * Endpoint: POST /api/v1/projects
   */
  async create(payload) {
    const cleanPayload = {
      customer_id: Number(payload.customer_id ?? payload.customerId),
      project_name: String(payload.project_name || payload.name || '').trim(),
      site_address: String(payload.site_address || payload.siteAddress || '').trim(),
      plot_area: Number(payload.plot_area ?? payload.plotArea) || 0,
      construction_area: Number(payload.construction_area ?? payload.constructionArea) || 0,
      number_of_floors: Number(payload.number_of_floors ?? payload.floorsCount) || 1,
      floor_type: String(payload.floor_type || payload.floors || 'G+1').trim(),
      start_date: payload.start_date || payload.startDate || new Date().toISOString().split('T')[0],
      status: String(payload.status || 'PLANNING').toUpperCase().replace(/\s+/g, '_'),
      notes: payload.notes?.trim() || '',
    };

    const response = await apiClient.post('/api/v1/projects', cleanPayload);
    const resData = response.data;
    const created = resData?.data || resData;
    return normalizeProject(created);
  },

  /**
   * Update an existing project.
   * Endpoint: PUT /api/v1/projects/{project_id}
   */
  async update(projectId, payload) {
    const cleanPayload = {
      project_name: String(payload.project_name || payload.name || '').trim(),
      site_address: String(payload.site_address || payload.siteAddress || '').trim(),
      plot_area: Number(payload.plot_area ?? payload.plotArea) || 0,
      construction_area: Number(payload.construction_area ?? payload.constructionArea) || 0,
      number_of_floors: Number(payload.number_of_floors ?? payload.floorsCount) || 1,
      floor_type: String(payload.floor_type || payload.floors || 'G+1').trim(),
      start_date: payload.start_date || payload.startDate || new Date().toISOString().split('T')[0],
      status: String(payload.status || 'PLANNING').toUpperCase().replace(/\s+/g, '_'),
      notes: payload.notes?.trim() || '',
    };

    // If customer_id is provided, include it as well
    if (payload.customer_id || payload.customerId) {
      cleanPayload.customer_id = Number(payload.customer_id || payload.customerId);
    }

    const response = await apiClient.put(`/api/v1/projects/${projectId}`, cleanPayload);
    const resData = response.data;
    const updated = resData?.data || resData;
    return normalizeProject(updated);
  },

  /**
   * Delete / remove project.
   * Endpoint: DELETE /api/v1/projects/{project_id}
   */
  async delete(projectId) {
    const response = await apiClient.delete(`/api/v1/projects/${projectId}`);
    return response.data;
  },
};

export default projectService;
