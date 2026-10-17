import { apiClient } from './apiClient';

/**
 * Material master service — hits the real backend API.
 * Endpoint base: /api/v1/materials
 *
 * UI keeps using labels like "RCC Materials" and `status`; those are mapped
 * to Swagger `MaterialCategory` enums and `is_active`.
 */
const CATEGORY_TO_API = {
  'RCC Materials': 'RCC',
  'Brick & Plaster Materials': 'BRICK_PLASTER',
  'Granite & Tiles': 'GRANITE_TILES',
  'Electrical Materials': 'ELECTRICAL',
  'Plumbing Materials': 'PLUMBING',
  'Doors & Frames': 'DOORS_FRAMES',
  Sliding: 'SLIDING',
  Painting: 'PAINTING',
};

const API_TO_CATEGORY = Object.fromEntries(
  Object.entries(CATEGORY_TO_API).map(([label, value]) => [value, label])
);

function toApiCategory(category) {
  if (!category) return category;
  if (CATEGORY_TO_API[category]) return CATEGORY_TO_API[category];
  const upper = String(category).trim().toUpperCase().replace(/[\s&-]+/g, '_');
  return CATEGORY_TO_API[category] || upper;
}

function toUiCategory(category) {
  if (!category) return category;
  return API_TO_CATEGORY[category] || API_TO_CATEGORY[String(category).toUpperCase()] || category;
}

function toActiveFlag(payload) {
  if (typeof payload?.is_active === 'boolean') return payload.is_active;
  if (payload?.status === 'Inactive') return false;
  return true;
}

/**
 * Build a MaterialCreate body for POST /api/v1/materials.
 */
function formatMaterialCreatePayload(payload = {}) {
  return {
    name: (payload.name || '').toString().trim(),
    category: toApiCategory(payload.category),
    brand: payload.brand?.toString().trim() || null,
    specification: payload.specification?.toString().trim() || null,
    unit: (payload.unit || '').toString().trim(),
    description: payload.description?.toString().trim() || null,
    is_active: toActiveFlag(payload),
  };
}

/**
 * Build a MaterialUpdate body for PUT /api/v1/materials/{material_id}.
 * UI fields `status` and category labels map to `is_active` and MaterialCategory.
 */
function formatMaterialUpdatePayload(payload = {}) {
  const name = payload.name?.toString().trim();
  const category = payload.category ? toApiCategory(payload.category) : undefined;
  const unit = payload.unit?.toString().trim();
  const brand =
    payload.brand === undefined ? undefined : payload.brand?.toString().trim() || null;
  const specification =
    payload.specification === undefined
      ? undefined
      : payload.specification?.toString().trim() || null;
  const description =
    payload.description === undefined
      ? undefined
      : payload.description?.toString().trim() || null;

  const body = {};
  if (name) body.name = name;
  if (category) body.category = category;
  if (unit) body.unit = unit;
  if (brand !== undefined) body.brand = brand;
  if (specification !== undefined) body.specification = specification;
  if (description !== undefined) body.description = description;
  if (typeof payload.is_active === 'boolean') {
    body.is_active = payload.is_active;
  } else if (payload.status === 'Inactive') {
    body.is_active = false;
  } else if (payload.status === 'Active') {
    body.is_active = true;
  }
  return body;
}

function normalizeMaterial(material) {
  if (!material || typeof material !== 'object') return material;
  return {
    ...material,
    category: toUiCategory(material.category),
    status: material.status || (material.is_active === false ? 'Inactive' : 'Active'),
  };
}

export const materialService = {
  /**
   * List materials with pagination and optional filters.
   * Endpoint: GET /api/v1/materials
   */
  async list({
    page = 1,
    page_size = 20,
    search = '',
    category = '',
    brand = '',
    is_active = null,
  } = {}) {
    const params = {
      page,
      page_size: Math.min(Math.max(Number(page_size) || 20, 1), 100),
    };
    if (search && String(search).trim()) {
      params.search = String(search).trim();
    }
    if (category && String(category).trim()) {
      params.category = toApiCategory(String(category).trim());
    }
    if (brand && String(brand).trim()) {
      params.brand = String(brand).trim();
    }
    if (is_active !== null && is_active !== undefined && is_active !== '') {
      params.is_active = is_active;
    }

    const response = await apiClient.get('/api/v1/materials', { params });
    const resData = response.data;
    const data = resData?.data || resData;
    const items = Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
      ? data.items
      : [];

    return {
      items: items.map(normalizeMaterial),
      total: data?.total ?? items.length,
      page: data?.page ?? page,
      page_size: data?.page_size ?? params.page_size,
      total_pages: data?.total_pages ?? 1,
    };
  },

  /**
   * Get all materials as an array for listing screens and quotation specs.
   * Endpoint: GET /api/v1/materials
   */
  async getAll() {
    try {
      const first = await this.list({ page: 1, page_size: 100 });
      const pages = first.total_pages || 1;
      if (pages <= 1) return first.items;

      const rest = await Promise.all(
        Array.from({ length: pages - 1 }, (_, i) =>
          this.list({ page: i + 2, page_size: 100 })
        )
      );
      return first.items.concat(...rest.map((page) => page.items));
    } catch {
      return [];
    }
  },

  /**
   * Get a single material by id.
   * Endpoint: GET /api/v1/materials/{material_id}
   * Response: { success, message, data: MaterialOut }
   */
  async getById(materialId) {
    const response = await apiClient.get(`/api/v1/materials/${materialId}`);
    const resData = response.data;
    const material = resData?.data ?? resData;
    return normalizeMaterial(material);
  },

  /**
   * Create material.
   * Endpoint: POST /api/v1/materials
   * Body: MaterialCreate { name, category, brand, specification, unit, description, is_active }
   */
  async create(payload) {
    const response = await apiClient.post(
      '/api/v1/materials',
      formatMaterialCreatePayload(payload)
    );
    const resData = response.data;
    return normalizeMaterial(resData?.data ?? resData);
  },

  /**
   * Update material.
   * Endpoint: PUT /api/v1/materials/{material_id}
   * Body: MaterialUpdate { name, category, brand, specification, unit, description, is_active }
   */
  async update(materialId, patch) {
    const response = await apiClient.put(
      `/api/v1/materials/${materialId}`,
      formatMaterialUpdatePayload(patch)
    );
    const resData = response.data;
    return normalizeMaterial(resData?.data ?? resData);
  },

  async delete(id) {
    const response = await apiClient.delete(`/api/v1/materials/${id}`);
    return response.data;
  },
};
