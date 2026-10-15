import { apiClient } from './apiClient';

/**
 * Safe numeric parsing for backend responses, especially handling scientific notations,
 * arbitrary-precision decimal strings, and negative/positive prefixed integers.
 */
export function parseSafeDecimal(val, fallback = 0) {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : fallback;
  }
  const str = String(val).trim();
  const num = Number(str);
  if (!Number.isFinite(num)) return fallback;
  // If extreme scientific notation overflow (e.g. test dummy numbers > 1e15), cap reasonably or return float
  if (Math.abs(num) > 1e14) {
    // Check if original string has a reasonable small prefix
    return fallback;
  }
  return num;
}

/**
 * Normalizes quotation data returned by the backend API.
 * Ensures consistent access whether frontend components use camelCase or snake_case.
 */
export function normalizeQuotation(raw) {
  if (!raw) return null;

  const id = raw.id;
  const quotationNumber = raw.quotation_number || raw.quotationNumber || (id ? `MKQ-${String(id).padStart(4, '0')}` : 'MKQ-DRAFT');
  const quotationDate = raw.quotation_date || raw.quotationDate || new Date().toISOString().slice(0, 10);
  const status = (raw.status || 'DRAFT').toUpperCase();
  const customerId = raw.customer_id ?? raw.customerId ?? raw.customer?.id ?? 0;
  const projectId = raw.project_id ?? raw.projectId ?? raw.project?.id ?? 0;
  const notes = raw.notes || '';

  // Safe totals & summary
  const subtotal = parseSafeDecimal(raw.subtotal, 0);
  const discountPercentage = parseSafeDecimal(raw.discount_percentage ?? raw.discountPercentage ?? raw.discount, 0);
  const discountAmount = parseSafeDecimal(raw.discount_amount ?? raw.discountAmount, 0);
  const taxableAmount = parseSafeDecimal(raw.taxable_amount ?? raw.taxableAmount, subtotal - discountAmount);
  const gstPercentage = parseSafeDecimal(raw.gst_percentage ?? raw.gstPercentage ?? raw.gst, 18);
  const gstAmount = parseSafeDecimal(raw.gst_amount ?? raw.gstAmount, 0);
  const grandTotal = parseSafeDecimal(raw.grand_total ?? raw.grandTotal, subtotal - discountAmount + gstAmount);

  // Normalize customer
  const rawCustomer = raw.customer || {};
  const customer = {
    id: rawCustomer.id || customerId,
    customer_code: rawCustomer.customer_code || rawCustomer.customerCode || '',
    name: rawCustomer.name || 'Unknown Customer',
    mobile: rawCustomer.mobile || '',
    email: rawCustomer.email || '',
    customer_type: rawCustomer.customer_type || rawCustomer.type || 'INDIVIDUAL',
    type: rawCustomer.customer_type || rawCustomer.type || 'INDIVIDUAL',
    address: rawCustomer.address || '',
    city: rawCustomer.city || '',
    state: rawCustomer.state || '',
    pincode: rawCustomer.pincode || '',
    notes: rawCustomer.notes || '',
  };

  // Normalize project
  const rawProject = raw.project || {};
  const project = {
    id: rawProject.id || projectId,
    project_code: rawProject.project_code || rawProject.projectCode || '',
    project_name: rawProject.project_name || rawProject.name || 'Construction Site',
    name: rawProject.project_name || rawProject.name || 'Construction Site',
    site_address: rawProject.site_address || rawProject.siteAddress || '',
    siteAddress: rawProject.site_address || rawProject.siteAddress || '',
    plot_area: parseSafeDecimal(rawProject.plot_area ?? rawProject.plotArea, 0),
    plotArea: parseSafeDecimal(rawProject.plot_area ?? rawProject.plotArea, 0),
    construction_area: parseSafeDecimal(rawProject.construction_area ?? rawProject.constructionArea, 0),
    constructionArea: parseSafeDecimal(rawProject.construction_area ?? rawProject.constructionArea, 0),
    number_of_floors: rawProject.number_of_floors ?? rawProject.numberOfFloors ?? 1,
    floor_type: rawProject.floor_type || rawProject.floors || 'G+1',
    floors: rawProject.floor_type || rawProject.floors || 'G+1',
    start_date: rawProject.start_date || rawProject.startDate || '',
    status: rawProject.status || 'PLANNING',
  };

  // Normalize calculation summary if present
  const rawSummary = raw.calculation_summary || raw.calculationSummary || {};
  const calculationSummary = {
    construction_total: parseSafeDecimal(rawSummary.construction_total, 0),
    additional_total: parseSafeDecimal(rawSummary.additional_total, 0),
    electrical_total: parseSafeDecimal(rawSummary.electrical_total, 0),
    plumbing_total: parseSafeDecimal(rawSummary.plumbing_total, 0),
    door_total: parseSafeDecimal(rawSummary.door_total, 0),
    window_total: parseSafeDecimal(rawSummary.window_total, 0),
    tile_total: parseSafeDecimal(rawSummary.tile_total, 0),
    granite_total: parseSafeDecimal(rawSummary.granite_total, 0),
    painting_total: parseSafeDecimal(rawSummary.painting_total, 0),
    subtotal: parseSafeDecimal(rawSummary.subtotal, subtotal),
    discount_percentage: parseSafeDecimal(rawSummary.discount_percentage, discountPercentage),
    discount_amount: parseSafeDecimal(rawSummary.discount_amount, discountAmount),
    taxable_amount: parseSafeDecimal(rawSummary.taxable_amount, taxableAmount),
    gst_percentage: parseSafeDecimal(rawSummary.gst_percentage, gstPercentage),
    gst_amount: parseSafeDecimal(rawSummary.gst_amount, gstAmount),
    grand_total: parseSafeDecimal(rawSummary.grand_total, grandTotal),
  };

  // Normalize nested item arrays
  const constructionItems = (raw.construction_items || raw.constructionItems || []).map((i, idx) => ({
    id: i.id || `ci_${idx}`,
    rate_master_id: i.rate_master_id ?? i.rateMasterId ?? 0,
    description: i.description || '',
    quantity: parseSafeDecimal(i.quantity, 0),
    unit: i.unit || 'sqft',
    rate: parseSafeDecimal(i.rate, 0),
    amount: parseSafeDecimal(i.amount, parseSafeDecimal(i.quantity, 0) * parseSafeDecimal(i.rate, 0)),
    sort_order: i.sort_order ?? idx,
  }));

  const additionalItems = (raw.additional_items || raw.additionalWorks || []).map((i, idx) => ({
    id: i.id || `ai_${idx}`,
    category: (i.category || 'WATER_TANK').toUpperCase(),
    description: i.description || '',
    quantity: parseSafeDecimal(i.quantity, 0),
    unit: i.unit || 'sqft',
    rate: parseSafeDecimal(i.rate, 0),
    amount: parseSafeDecimal(i.amount, parseSafeDecimal(i.quantity, 0) * parseSafeDecimal(i.rate, 0)),
    sort_order: i.sort_order ?? idx,
  }));

  const electricalItems = (raw.electrical_items || raw.electricalItems || []).map((i, idx) => ({
    id: i.id || `ei_${idx}`,
    area: i.area || i.room || 'General',
    room: i.area || i.room || 'General',
    item_name: i.item_name || i.description || '',
    description: i.item_name || i.description || '',
    quantity: parseSafeDecimal(i.quantity, 0),
    unit: i.unit || 'nos',
    rate: parseSafeDecimal(i.rate, 0),
    amount: parseSafeDecimal(i.amount, parseSafeDecimal(i.quantity, 0) * parseSafeDecimal(i.rate, 0)),
    sort_order: i.sort_order ?? idx,
  }));

  const plumbingItems = (raw.plumbing_items || raw.plumbingItems || []).map((i, idx) => ({
    id: i.id || `pi_${idx}`,
    item_name: i.item_name || i.description || '',
    description: i.item_name || i.description || '',
    quantity: parseSafeDecimal(i.quantity, 0),
    unit: i.unit || 'nos',
    rate: parseSafeDecimal(i.rate, 0),
    amount: parseSafeDecimal(i.amount, parseSafeDecimal(i.quantity, 0) * parseSafeDecimal(i.rate, 0)),
    sort_order: i.sort_order ?? idx,
  }));

  const doors = (raw.doors || []).map((i, idx) => ({
    id: i.id || `dr_${idx}`,
    item_id: i.item_id ?? i.masterId ?? 0,
    item_name: i.item_name || i.description || '',
    description: i.item_name || i.description || '',
    quantity: parseSafeDecimal(i.quantity, 0),
    unit: i.unit || 'nos',
    rate: parseSafeDecimal(i.rate, 0),
    amount: parseSafeDecimal(i.amount, parseSafeDecimal(i.quantity, 0) * parseSafeDecimal(i.rate, 0)),
    sort_order: i.sort_order ?? idx,
  }));

  const windows = (raw.windows || []).map((i, idx) => {
    const len = parseSafeDecimal(i.length, 1);
    const wid = parseSafeDecimal(i.width, 1);
    const area = parseSafeDecimal(i.area, len * wid);
    const rate = parseSafeDecimal(i.rate, 0);
    return {
      id: i.id || `wn_${idx}`,
      item_id: i.item_id ?? i.masterId ?? 0,
      item_name: i.item_name || i.description || '',
      description: i.item_name || i.description || '',
      length: len,
      width: wid,
      area: area,
      quantity: area,
      unit: i.unit || 'sqft',
      rate: rate,
      amount: parseSafeDecimal(i.amount, area * rate),
      sort_order: i.sort_order ?? idx,
    };
  });

  const tiles = (raw.tiles || []).map((i, idx) => ({
    id: i.id || `tl_${idx}`,
    item_id: i.item_id ?? i.masterId ?? 0,
    category: (i.category || 'TILE').toUpperCase(),
    description: i.description || i.item_name || '',
    area: parseSafeDecimal(i.area ?? i.quantity, 0),
    quantity: parseSafeDecimal(i.area ?? i.quantity, 0),
    unit: i.unit || 'sqft',
    rate: parseSafeDecimal(i.rate, 0),
    amount: parseSafeDecimal(i.amount, parseSafeDecimal(i.area ?? i.quantity, 0) * parseSafeDecimal(i.rate, 0)),
    sort_order: i.sort_order ?? idx,
  }));

  const granite = (raw.granite || []).map((i, idx) => ({
    id: i.id || `gr_${idx}`,
    item_id: i.item_id ?? i.masterId ?? 0,
    category: (i.category || 'GRANITE').toUpperCase(),
    description: i.description || i.item_name || '',
    area: parseSafeDecimal(i.area ?? i.quantity, 0),
    quantity: parseSafeDecimal(i.area ?? i.quantity, 0),
    unit: i.unit || 'sqft',
    rate: parseSafeDecimal(i.rate, 0),
    amount: parseSafeDecimal(i.amount, parseSafeDecimal(i.area ?? i.quantity, 0) * parseSafeDecimal(i.rate, 0)),
    sort_order: i.sort_order ?? idx,
  }));

  const painting = (raw.painting || []).map((i, idx) => ({
    id: i.id || `pt_${idx}`,
    category: (i.category || (i.group === 'outer' ? 'OUTER' : 'INNER') || 'OUTER').toUpperCase(),
    description: i.description || i.item_name || '',
    area: parseSafeDecimal(i.area ?? i.quantity, 0),
    quantity: parseSafeDecimal(i.area ?? i.quantity, 0),
    unit: i.unit || 'sqft',
    rate: parseSafeDecimal(i.rate, 0),
    amount: parseSafeDecimal(i.amount, parseSafeDecimal(i.area ?? i.quantity, 0) * parseSafeDecimal(i.rate, 0)),
    sort_order: i.sort_order ?? idx,
  }));

  const materials = (raw.materials || []).map((i, idx) => ({
    id: i.id || `mat_${idx}`,
    material_id: i.material_id ?? i.materialId ?? 0,
    name: i.name || '',
    category: i.category || '',
    brand: i.brand || '',
    specification: i.specification || '',
    unit: i.unit || 'nos',
    sort_order: i.sort_order ?? idx,
    selected: i.selected ?? true,
  }));

  const terms = (raw.terms || []).map((i, idx) => ({
    id: i.id || `t_${idx}`,
    term_id: i.term_id ?? i.termId ?? idx + 1,
    term_order: i.term_order ?? i.order ?? idx,
    title: i.title || (i.custom_content ? String(i.custom_content).slice(0, 30) : `Term ${idx + 1}`),
    body: i.body || i.custom_content || '',
    custom_content: i.custom_content || i.body || i.title || '',
  }));

  return {
    ...raw,
    id,
    quotation_number: quotationNumber,
    quotationNumber,
    quotation_date: quotationDate,
    quotationDate,
    status,
    customer_id: customerId,
    customerId,
    project_id: projectId,
    projectId,
    notes,
    subtotal,
    discount_percentage: discountPercentage,
    discountPercentage,
    discount: discountPercentage,
    discount_amount: discountAmount,
    discountAmount,
    taxable_amount: taxableAmount,
    taxableAmount,
    gst_percentage: gstPercentage,
    gstPercentage,
    gst: gstPercentage,
    gst_amount: gstAmount,
    gstAmount,
    grand_total: grandTotal,
    grandTotal,
    customer,
    project,
    calculation_summary: calculationSummary,
    calculationSummary,
    construction_items: constructionItems,
    constructionItems,
    additional_items: additionalItems,
    additionalWorks: additionalItems,
    electrical_items: electricalItems,
    electricalItems,
    plumbing_items: plumbingItems,
    plumbingItems,
    doors,
    windows,
    tiles,
    granite,
    painting,
    materials,
    terms,
    created_at: raw.created_at || raw.createdAt,
    updated_at: raw.updated_at || raw.updatedAt,
  };
}

/**
 * Formats a frontend quotation object into the exact POST/PUT API payload
 * expected by https://api.mkconstruction.site/api/v1/quotations.
 */
export function formatQuotationPayload(data) {
  const customerId = Number(data.customer_id ?? data.customerId ?? data.customer?.id) || 0;
  const projectId = Number(data.project_id ?? data.projectId ?? data.project?.id) || 0;
  const quotationDate = data.quotation_date || data.quotationDate || new Date().toISOString().slice(0, 10);
  const notes = String(data.notes || '').trim();
  const discountPercentage = Number(data.discount_percentage ?? data.discountPercentage ?? data.discount) || 0;
  const gstPercentage = Number(data.gst_percentage ?? data.gstPercentage ?? data.gst) || 18;

  // 1. construction_items
  const constructionItems = (data.construction_items || data.constructionItems || []).map((item, idx) => ({
    quantity: Number(item.quantity) || 0,
    unit: String(item.unit || 'sqft').trim(),
    rate: Number(item.rate) || 0,
    sort_order: Number(item.sort_order ?? idx),
    rate_master_id: Number(item.rate_master_id ?? item.rateMasterId) || 0,
    description: String(item.description || '').trim(),
  }));

  // 2. additional_items
  const additionalItems = (data.additional_items || data.additionalWorks || []).map((item, idx) => ({
    quantity: Number(item.quantity) || 0,
    unit: String(item.unit || 'sqft').trim(),
    rate: Number(item.rate) || 0,
    sort_order: Number(item.sort_order ?? idx),
    category: String(item.category || 'WATER_TANK').toUpperCase(),
    description: String(item.description || '').trim(),
  }));

  // 3. electrical_items
  const electricalItems = (data.electrical_items || data.electricalItems || []).map((item, idx) => ({
    quantity: Number(item.quantity) || 0,
    unit: String(item.unit || 'nos').trim(),
    rate: Number(item.rate) || 0,
    sort_order: Number(item.sort_order ?? idx),
    area: String(item.area || item.room || 'General').trim(),
    item_name: String(item.item_name || item.description || '').trim(),
  }));

  // 4. plumbing_items
  const plumbingItems = (data.plumbing_items || data.plumbingItems || []).map((item, idx) => ({
    quantity: Number(item.quantity) || 0,
    unit: String(item.unit || 'nos').trim(),
    rate: Number(item.rate) || 0,
    sort_order: Number(item.sort_order ?? idx),
    item_name: String(item.item_name || item.description || '').trim(),
  }));

  // 5. doors
  const doors = (data.doors || []).map((item, idx) => ({
    quantity: Number(item.quantity) || 0,
    unit: String(item.unit || 'nos').trim(),
    rate: Number(item.rate) || 0,
    sort_order: Number(item.sort_order ?? idx),
    item_id: Number(item.item_id ?? item.masterId) || 0,
    item_name: String(item.item_name || item.description || '').trim(),
  }));

  // 6. windows
  const windows = (data.windows || []).map((item, idx) => {
    const len = Number(item.length) || 1;
    const wid = Number(item.width) || 1;
    return {
      item_id: Number(item.item_id ?? item.masterId) || 0,
      item_name: String(item.item_name || item.description || '').trim(),
      length: len,
      width: wid,
      unit: String(item.unit || 'sqft').trim(),
      rate: Number(item.rate) || 0,
      sort_order: Number(item.sort_order ?? idx),
    };
  });

  // 7. tiles
  const tiles = (data.tiles || []).map((item, idx) => ({
    item_id: Number(item.item_id ?? item.masterId) || 0,
    category: String(item.category || 'TILE').toUpperCase(),
    description: String(item.description || item.item_name || '').trim(),
    area: Number(item.area ?? item.quantity) || 0,
    unit: String(item.unit || 'sqft').trim(),
    rate: Number(item.rate) || 0,
    sort_order: Number(item.sort_order ?? idx),
  }));

  // 8. granite
  const granite = (data.granite || []).map((item, idx) => ({
    item_id: Number(item.item_id ?? item.masterId) || 0,
    category: String(item.category || 'GRANITE').toUpperCase(),
    description: String(item.description || item.item_name || '').trim(),
    area: Number(item.area ?? item.quantity) || 0,
    unit: String(item.unit || 'sqft').trim(),
    rate: Number(item.rate) || 0,
    sort_order: Number(item.sort_order ?? idx),
  }));

  // 9. painting
  const painting = (data.painting || []).map((item, idx) => ({
    category: String(item.category || (item.group === 'outer' ? 'OUTER' : 'INNER') || 'OUTER').toUpperCase(),
    description: String(item.description || item.item_name || '').trim(),
    area: Number(item.area ?? item.quantity) || 0,
    unit: String(item.unit || 'sqft').trim(),
    rate: Number(item.rate) || 0,
    sort_order: Number(item.sort_order ?? idx),
  }));

  // 10. materials
  const materials = (data.materials || [])
    .filter((item) => item.selected !== false)
    .map((item, idx) => ({
      material_id: Number(item.material_id ?? item.materialId) || 0,
      name: String(item.name || '').trim(),
      category: String(item.category || '').trim(),
      brand: String(item.brand || '').trim(),
      specification: String(item.specification || '').trim(),
      unit: String(item.unit || 'nos').trim(),
      sort_order: Number(item.sort_order ?? idx),
    }));

  // 11. terms
  const terms = (data.terms || []).map((item, idx) => ({
    term_id: Number(item.term_id ?? item.termId ?? idx + 1) || 0,
    term_order: Number(item.term_order ?? item.order ?? idx) || 0,
    custom_content: String(item.custom_content || item.body || item.title || '').trim(),
  }));

  return {
    customer_id: customerId,
    project_id: projectId,
    quotation_date: quotationDate,
    notes,
    discount_percentage: discountPercentage,
    gst_percentage: gstPercentage,
    construction_items: constructionItems,
    additional_items: additionalItems,
    electrical_items: electricalItems,
    plumbing_items: plumbingItems,
    doors,
    windows,
    tiles,
    granite,
    painting,
    materials,
    terms,
  };
}

export const quotationService = {
  /**
   * 2. List quotations with pagination, search, status, and sorting.
   * Endpoint: GET /api/v1/quotations?page=1&page_size=20&sort_by=created_at&sort_order=desc
   */
  async list({
    page = 1,
    page_size = 20,
    search = '',
    status = '',
    customer_id = null,
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
    if (status && status !== 'ALL') {
      params.status = String(status).toUpperCase();
    }
    if (customer_id !== null && customer_id !== undefined && customer_id !== '' && customer_id !== 'ALL') {
      params.customer_id = Number(customer_id);
    }

    const response = await apiClient.get('/api/v1/quotations', { params });
    const resData = response.data;
    const data = resData?.data || resData || {};

    const rawItems = Array.isArray(data.items)
      ? data.items
      : Array.isArray(data)
      ? data
      : [];

    const items = rawItems.map(normalizeQuotation);
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
   * Retrieve all quotations (for selectors & cross-referencing).
   */
  async getAll({ search = '', status = '', customer_id = null } = {}) {
    const data = await this.list({
      page: 1,
      page_size: 100,
      search,
      status,
      customer_id,
    });
    return data?.items || [];
  },

  /**
   * 3. Get single quotation by ID.
   * Endpoint: GET /api/v1/quotations/{id}
   */
  async getById(id) {
    if (!id) return null;
    const response = await apiClient.get(`/api/v1/quotations/${id}`);
    const resData = response.data;
    const raw = resData?.data || resData;
    return normalizeQuotation(raw);
  },

  /**
   * 1. Create a new quotation.
   * Endpoint: POST /api/v1/quotations
   */
  async create(payload) {
    const cleanPayload = formatQuotationPayload(payload);
    const response = await apiClient.post('/api/v1/quotations', cleanPayload);
    const resData = response.data;
    const created = resData?.data || resData;
    return normalizeQuotation(created);
  },

  /**
   * 4. Update an existing quotation.
   * Endpoint: PUT /api/v1/quotations/{id}
   */
  async update(id, payload) {
    if (!id) throw new Error('Quotation ID is required for update');
    const cleanPayload = formatQuotationPayload(payload);
    const response = await apiClient.put(`/api/v1/quotations/${id}`, cleanPayload);
    const resData = response.data;
    const updated = resData?.data || resData;
    return normalizeQuotation(updated);
  },

  /**
   * 5. Delete quotation.
   * Endpoint: DELETE /api/v1/quotations/{id}
   */
  async delete(id) {
    if (!id) throw new Error('Quotation ID is required for deletion');
    const response = await apiClient.delete(`/api/v1/quotations/${id}`);
    return response.data;
  },

  /**
   * 6. Duplicate quotation.
   * Endpoint: POST /api/v1/quotations/{id}/duplicate
   */
  async duplicate(id) {
    if (!id) throw new Error('Quotation ID is required for duplicate');
    const response = await apiClient.post(`/api/v1/quotations/${id}/duplicate`);
    const resData = response.data;
    const duplicated = resData?.data || resData;
    return normalizeQuotation(duplicated);
  },

  /**
   * 7. Send quotation (marks as SENT).
   * Endpoint: POST /api/v1/quotations/{id}/send
   */
  async send(id) {
    if (!id) throw new Error('Quotation ID is required');
    const response = await apiClient.post(`/api/v1/quotations/${id}/send`);
    const resData = response.data;
    return resData?.data || resData;
  },

  /**
   * 8. Approve quotation (marks as APPROVED).
   * Endpoint: POST /api/v1/quotations/{id}/approve
   */
  async approve(id) {
    if (!id) throw new Error('Quotation ID is required');
    const response = await apiClient.post(`/api/v1/quotations/${id}/approve`);
    const resData = response.data;
    return resData?.data || resData;
  },

  /**
   * 9. Reject quotation (marks as REJECTED).
   * Endpoint: POST /api/v1/quotations/{id}/reject
   */
  async reject(id) {
    if (!id) throw new Error('Quotation ID is required');
    const response = await apiClient.post(`/api/v1/quotations/${id}/reject`);
    const resData = response.data;
    return resData?.data || resData;
  },

  /**
   * 10. Expire quotation (marks as EXPIRED).
   * Endpoint: POST /api/v1/quotations/{id}/expire
   */
  async expire(id) {
    if (!id) throw new Error('Quotation ID is required');
    const response = await apiClient.post(`/api/v1/quotations/${id}/expire`);
    const resData = response.data;
    return resData?.data || resData;
  },

  /**
   * 11. Get quotation calculation summary.
   * Endpoint: GET /api/v1/quotations/{id}/summary
   */
  async getSummary(id) {
    if (!id) throw new Error('Quotation ID is required');
    const response = await apiClient.get(`/api/v1/quotations/${id}/summary`);
    const resData = response.data;
    const data = resData?.data || resData || {};
    return {
      construction_total: parseSafeDecimal(data.construction_total, 0),
      additional_total: parseSafeDecimal(data.additional_total, 0),
      electrical_total: parseSafeDecimal(data.electrical_total, 0),
      plumbing_total: parseSafeDecimal(data.plumbing_total, 0),
      door_total: parseSafeDecimal(data.door_total, 0),
      window_total: parseSafeDecimal(data.window_total, 0),
      tile_total: parseSafeDecimal(data.tile_total, 0),
      granite_total: parseSafeDecimal(data.granite_total, 0),
      painting_total: parseSafeDecimal(data.painting_total, 0),
      subtotal: parseSafeDecimal(data.subtotal, 0),
      discount_percentage: parseSafeDecimal(data.discount_percentage, 0),
      discount_amount: parseSafeDecimal(data.discount_amount, 0),
      taxable_amount: parseSafeDecimal(data.taxable_amount, 0),
      gst_percentage: parseSafeDecimal(data.gst_percentage, 18),
      gst_amount: parseSafeDecimal(data.gst_amount, 0),
      grand_total: parseSafeDecimal(data.grand_total, 0),
    };
  },

  /**
   * 12. Get quotation preview.
   * Endpoint: GET /api/v1/quotations/{id}/preview
   */
  async getPreview(id) {
    if (!id) throw new Error('Quotation ID is required');
    const response = await apiClient.get(`/api/v1/quotations/${id}/preview`, {
      headers: { Accept: 'application/json, text/html, */*' },
    });
    return response.data;
  },
};

export default quotationService;
