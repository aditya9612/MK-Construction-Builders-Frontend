import { uid } from '../utils/formatting';
import { calculateItemAmount, calculateQuotationTotals } from '../utils/calculations';
import { getRateByItem, MOCK_RATES } from './rates';
import { MOCK_CUSTOMERS } from './customers';
import { MOCK_PROJECTS } from './projects';
import { MOCK_TERMS } from './terms';
import { MOCK_MATERIALS } from './materials';
import { MOCK_ELECTRICAL_MASTER } from './electrical';
import { MOCK_PLUMBING } from './plumbing';
import { MOCK_DOORS } from './doors';
import { MOCK_WINDOWS } from './windows';
import { MOCK_TILES, MOCK_GRANITE } from './tiles';
import { MOCK_PAINTING } from './painting';

export function findRate(item, rates = MOCK_RATES) {
  return getRateByItem(item, rates)?.rate ?? 0;
}

export function lineItem({ description, quantity = 0, unit = 'sqft', rate = 0, extra = {} }) {
  return {
    id: uid('item'),
    description,
    quantity,
    unit,
    rate,
    amount: calculateItemAmount(quantity, rate),
    ...extra,
  };
}

export function defaultConstructionItems(constructionArea = 2000, rates = MOCK_RATES) {
  const area = Number(constructionArea) || 0;
  return [
    lineItem({ description: 'Foundation Level (50%)', quantity: area, unit: 'sqft', rate: findRate('Foundation Level (50%)', rates) }),
    lineItem({ description: 'Ground Floor / Covered Parking', quantity: area, unit: 'sqft', rate: findRate('Ground Floor / Covered Parking', rates) }),
    lineItem({ description: 'Super Structure / First Floor', quantity: area, unit: 'sqft', rate: findRate('Super Structure / First Floor', rates) }),
    lineItem({ description: 'Top Terrace + Staircase', quantity: Math.round(area * 0.35), unit: 'sqft', rate: findRate('Top Terrace + Staircase', rates) }),
    lineItem({ description: 'Excavation', quantity: Math.round(area * 4), unit: 'cft', rate: findRate('Excavation', rates) }),
  ];
}

export function defaultElectricalItems(rates = MOCK_RATES) {
  const pointRate = findRate('Electrical Point', rates);
  const acRate = findRate('AC Point', rates);
  const socketRate = findRate('Main Board Socket', rates);
  const earthRate = findRate('Earthing', rates);
  const qtyMap = {
    hall_light: 8,
    hall_fan: 2,
    hall_main_socket: 4,
    hall_tv: 1,
    hall_ac: 1,
    hall_charging: 2,
    hall_bell: 1,
    hall_washing: 1,
    hall_balcony_light: 2,
    bedroom_light: 4,
    bedroom_fan: 2,
    bedroom_main_socket: 4,
    bedroom_charging: 2,
    bedroom_ac: 2,
    kitchen_light: 3,
    kitchen_fan: 1,
    kitchen_main_socket: 2,
    kitchen_mixer: 1,
    kitchen_oven: 1,
    kitchen_fridge: 1,
    kitchen_exhaust: 1,
    kitchen_aqua: 1,
    bathroom_light: 2,
    bathroom_exhaust: 2,
    bathroom_trimmer: 1,
    bathroom_geyser: 2,
    bathroom_passage: 2,
    bathroom_mirror: 2,
    parking_light: 2,
    parking_socket: 1,
    terrace_terrace_light: 2,
    terrace_stair_light: 4,
    terrace_earthing: 1,
  };
  return MOCK_ELECTRICAL_MASTER.map((row) => {
    const key = `${row.room === 'Hall' ? 'hall' : row.room === 'Bedroom' ? 'bedroom' : row.room === 'Kitchen' ? 'kitchen' : row.room === 'Bathroom' ? 'bathroom' : row.room === 'Open Parking' ? 'parking' : 'terrace'}_${row.code}`;
    const quantity = qtyMap[key] ?? 0;
    let rate = pointRate;
    if (row.code === 'ac') rate = acRate;
    if (row.code === 'main_socket' || row.code === 'socket') rate = socketRate;
    if (row.code === 'earthing') rate = earthRate;
    return lineItem({
      description: `${row.room} — ${row.name}`,
      quantity,
      unit: 'nos',
      rate,
      extra: { room: row.room, code: row.code, masterId: row.id },
    });
  });
}

export function defaultPlumbingItems(rates = MOCK_RATES) {
  const qty = {
    'Underground Water Tank': 5000,
    'Terrace Water Tank': 2000,
    Mixer: 3,
    Tap: 6,
    Shower: 3,
    Basin: 3,
    'English Commode': 3,
    Flush: 3,
  };
  return MOCK_PLUMBING.map((row) =>
    lineItem({
      description: row.item,
      quantity: qty[row.item] ?? 0,
      unit: row.unit,
      rate: findRate(row.item, rates),
      extra: { category: row.category, masterId: row.id },
    })
  );
}

export function defaultDoorItems(rates = MOCK_RATES) {
  const qty = { 'Main Door': 1, 'Bedroom Door': 4, 'Toilet/Bathroom Door': 3, 'Balcony Door': 2, 'Terrace Door': 1 };
  return MOCK_DOORS.map((row) =>
    lineItem({
      description: row.item,
      quantity: qty[row.item] ?? 0,
      unit: row.unit,
      rate: findRate(row.item, rates),
      extra: { masterId: row.id },
    })
  );
}

export function defaultWindowItems(rates = MOCK_RATES) {
  return MOCK_WINDOWS.map((row) => {
    const length = row.item === 'Window Sliding' ? 6 : 8;
    const width = row.item === 'Window Sliding' ? 4 : 7;
    const area = length * width;
    const rate = findRate(row.item, rates);
    return {
      id: uid('item'),
      description: row.item,
      length,
      width,
      quantity: area,
      area,
      unit: row.unit,
      rate,
      amount: calculateItemAmount(area, rate),
      masterId: row.id,
    };
  });
}

export function defaultTileItems(rates = MOCK_RATES) {
  const areas = { 'Floor Tiles': 1800, 'Wall Tiles': 650, 'Parking Tiles': 400 };
  return MOCK_TILES.map((row) =>
    lineItem({
      description: row.item,
      quantity: areas[row.item] ?? 0,
      unit: row.unit,
      rate: findRate(row.item, rates),
      extra: { category: row.item, masterId: row.id },
    })
  );
}

export function defaultGraniteItems(rates = MOCK_RATES) {
  const qty = { 'Black Granite': 120, 'Kitchen Oota': 40, 'Window Frame': 80, 'Door Frame': 60 };
  const itemName = (item) => (item === 'Window Frame' ? 'Window Frame Granite' : item === 'Door Frame' ? 'Door Frame Granite' : item);
  return MOCK_GRANITE.map((row) =>
    lineItem({
      description: row.item,
      quantity: qty[row.item] ?? 0,
      unit: row.unit,
      rate: findRate(itemName(row.item), rates),
      extra: { category: row.item, masterId: row.id },
    })
  );
}

export function defaultPaintingItems(rates = MOCK_RATES, area = 2000) {
  return MOCK_PAINTING.map((row) =>
    lineItem({
      description: row.item,
      quantity: row.group === 'outer' ? Math.round(area * 1.4) : Math.round(area * 2.2),
      unit: row.unit,
      rate: findRate(row.item, rates),
      extra: { group: row.group, coats: row.extra ? 2 : undefined, masterId: row.id },
    })
  );
}

export function defaultAdditionalWorks(area = 2000, rates = MOCK_RATES) {
  return [
    lineItem({ description: 'Underground / terrace waterproofing', quantity: Math.round(area * 0.4), unit: 'sqft', rate: findRate('Waterproofing', rates), extra: { category: 'waterproofing' } }),
    lineItem({ description: 'PCC for flooring', quantity: area, unit: 'sqft', rate: findRate('PCC', rates), extra: { category: 'pcc' } }),
    lineItem({ description: 'RCC additional / extra columns', quantity: Math.round(area * 0.15), unit: 'sqft', rate: findRate('RCC', rates), extra: { category: 'rcc' } }),
    lineItem({ description: 'Brick work & plaster (additional)', quantity: Math.round(area * 0.2), unit: 'sqft', rate: findRate('Brick Work & Plaster', rates), extra: { category: 'brick-plaster' } }),
  ];
}

export function defaultSelectedMaterials() {
  return MOCK_MATERIALS.filter((m) => m.status === 'Active').slice(0, 12).map((m) => ({
    id: uid('qmat'),
    materialId: m.id,
    name: m.name,
    category: m.category,
    brand: m.brand,
    specification: m.specification,
    unit: m.unit,
    selected: true,
  }));
}

export function createEmptyQuotation({ companyPrefix = 'MKQ', quotationNumber = 'MKQ-2026-0001' } = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const quotation = {
    id: uid('q'),
    quotationNumber,
    quotationDate: today,
    status: 'Draft',
    customer: { id: '', name: '', mobile: '', email: '', type: 'Individual' },
    project: {
      id: '',
      name: '',
      siteAddress: '',
      plotArea: '',
      constructionArea: 2000,
      floors: 'G+1',
    },
    constructionItems: defaultConstructionItems(2000),
    additionalWorks: defaultAdditionalWorks(2000),
    electricalItems: defaultElectricalItems(),
    plumbingItems: defaultPlumbingItems(),
    doors: defaultDoorItems(),
    windows: defaultWindowItems(),
    tiles: defaultTileItems(),
    granite: defaultGraniteItems(),
    painting: defaultPaintingItems(MOCK_RATES, 2000),
    materials: defaultSelectedMaterials(),
    terms: MOCK_TERMS.filter((t) => t.selected).map((t) => ({ ...t })),
    discount: 0,
    gst: 0,
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return { ...quotation, ...calculateQuotationTotals(quotation) };
}

function buildQuotation({ id, number, date, status, customerId, projectId, discount = 0, gst = 0 }) {
  const customer = MOCK_CUSTOMERS.find((c) => c.id === customerId);
  const project = MOCK_PROJECTS.find((p) => p.id === projectId);
  const area = project?.constructionArea || 2000;
  const base = {
    id,
    quotationNumber: number,
    quotationDate: date,
    status,
    customer: { id: customer.id, name: customer.name, mobile: customer.mobile, email: customer.email, type: customer.type },
    project: {
      id: project.id,
      name: project.name,
      siteAddress: project.siteAddress,
      plotArea: project.plotArea,
      constructionArea: area,
      floors: project.floors,
    },
    constructionItems: defaultConstructionItems(area),
    additionalWorks: defaultAdditionalWorks(area),
    electricalItems: defaultElectricalItems(),
    plumbingItems: defaultPlumbingItems(),
    doors: defaultDoorItems(),
    windows: defaultWindowItems(),
    tiles: defaultTileItems(),
    granite: defaultGraniteItems(),
    painting: defaultPaintingItems(MOCK_RATES, area),
    materials: defaultSelectedMaterials(),
    terms: MOCK_TERMS.filter((t) => t.selected).map((t) => ({ ...t })),
    discount,
    gst,
    notes: '',
    createdAt: `${date}T10:00:00.000Z`,
    updatedAt: `${date}T10:00:00.000Z`,
  };
  return { ...base, ...calculateQuotationTotals(base) };
}

export const MOCK_QUOTATIONS = [
  buildQuotation({ id: 'q_01', number: 'MKQ-2026-0001', date: '2026-01-08', status: 'Approved', customerId: 'cust_01', projectId: 'proj_01', gst: 0 }),
  buildQuotation({ id: 'q_02', number: 'MKQ-2026-0002', date: '2026-01-18', status: 'Sent', customerId: 'cust_02', projectId: 'proj_02' }),
  buildQuotation({ id: 'q_03', number: 'MKQ-2026-0003', date: '2026-02-02', status: 'Draft', customerId: 'cust_03', projectId: 'proj_03' }),
  buildQuotation({ id: 'q_04', number: 'MKQ-2026-0004', date: '2026-02-12', status: 'Approved', customerId: 'cust_04', projectId: 'proj_04', discount: 2 }),
  buildQuotation({ id: 'q_05', number: 'MKQ-2026-0005', date: '2026-02-21', status: 'Rejected', customerId: 'cust_05', projectId: 'proj_05' }),
  buildQuotation({ id: 'q_06', number: 'MKQ-2026-0006', date: '2026-03-03', status: 'Sent', customerId: 'cust_06', projectId: 'proj_06' }),
  buildQuotation({ id: 'q_07', number: 'MKQ-2026-0007', date: '2026-03-14', status: 'Approved', customerId: 'cust_07', projectId: 'proj_07' }),
  buildQuotation({ id: 'q_08', number: 'MKQ-2026-0008', date: '2026-03-22', status: 'Expired', customerId: 'cust_08', projectId: 'proj_08' }),
  buildQuotation({ id: 'q_09', number: 'MKQ-2026-0009', date: '2026-04-04', status: 'Draft', customerId: 'cust_09', projectId: 'proj_09' }),
  buildQuotation({ id: 'q_10', number: 'MKQ-2026-0010', date: '2026-04-16', status: 'Sent', customerId: 'cust_10', projectId: 'proj_10' }),
  buildQuotation({ id: 'q_11', number: 'MKQ-2026-0011', date: '2026-05-02', status: 'Approved', customerId: 'cust_01', projectId: 'proj_01', discount: 1 }),
  buildQuotation({ id: 'q_12', number: 'MKQ-2026-0012', date: '2026-05-19', status: 'Draft', customerId: 'cust_02', projectId: 'proj_02' }),
  buildQuotation({ id: 'q_13', number: 'MKQ-2026-0013', date: '2026-06-06', status: 'Sent', customerId: 'cust_03', projectId: 'proj_03' }),
  buildQuotation({ id: 'q_14', number: 'MKQ-2026-0014', date: '2026-07-11', status: 'Approved', customerId: 'cust_06', projectId: 'proj_06' }),
  buildQuotation({ id: 'q_15', number: 'MKQ-2026-0015', date: '2026-08-09', status: 'Draft', customerId: 'cust_09', projectId: 'proj_09' }),
];
