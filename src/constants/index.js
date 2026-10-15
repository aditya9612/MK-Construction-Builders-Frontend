export const APP_NAME = 'MK Construction & Builders';
export const APP_SHORT_NAME = 'MK Construction';

export const STORAGE_KEYS = {
  customers: 'mk.customers',
  projects: 'mk.projects',
  quotations: 'mk.quotations',
  rates: 'mk.rates',
  materials: 'mk.materials',
  electricalMaster: 'mk.electricalMaster',
  plumbingMaster: 'mk.plumbingMaster',
  doorsWindowsMaster: 'mk.doorsWindowsMaster',
  tilesGraniteMaster: 'mk.tilesGraniteMaster',
  paintingMaster: 'mk.paintingMaster',
  terms: 'mk.terms',
  company: 'mk.company',
  users: 'mk.users',
  session: 'mk.session',
  quotationSeq: 'mk.quotationSeq',
  wizardDraft: 'mk.wizardDraft',
  notifications: 'mk.notifications',
  seeded: 'mk.seeded',
  rememberedEmail: 'mk.rememberedEmail',
};

export const QUOTATION_STATUSES = ['Draft', 'Sent', 'Approved', 'Rejected', 'Expired'];

export const PROJECT_STATUSES = ['Planning', 'In Progress', 'Completed', 'On Hold'];

export const CUSTOMER_TYPES = ['Individual', 'Builder', 'Architect', 'Corporate'];

export const FLOOR_OPTIONS = ['Ground', 'G+1', 'G+2', 'G+3', 'Custom'];

export const UNITS = ['sqft', 'sft', 'cft', 'rft', 'nos', 'lump sum', 'kg', 'ton', 'bag', 'sqm'];

export const ADDITIONAL_WORK_TABS = [
  { id: 'water-tank', label: 'Water Tank' },
  { id: 'waterproofing', label: 'Waterproofing' },
  { id: 'pcc', label: 'PCC' },
  { id: 'rcc', label: 'RCC' },
  { id: 'brick-plaster', label: 'Brick & Plaster' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'doors', label: 'Doors' },
  { id: 'windows', label: 'Windows' },
  { id: 'tiles', label: 'Tiles' },
  { id: 'painting', label: 'Painting' },
  { id: 'other', label: 'Other' },
];

export const WIZARD_STEPS = [
  { id: 1, title: 'Customer & Project', short: 'Customer' },
  { id: 2, title: 'Construction', short: 'Construction' },
  { id: 3, title: 'Additional Works', short: 'Works' },
  { id: 4, title: 'Materials & Specs', short: 'Materials' },
  { id: 5, title: 'Terms & Preview', short: 'Preview' },
];

export const MATERIAL_CATEGORIES = [
  'RCC Materials',
  'Brick & Plaster Materials',
  'Granite & Tiles',
  'Electrical Materials',
  'Plumbing Materials',
  'Doors & Frames',
  'Sliding',
  'Painting',
];

export const RATE_CATEGORIES = [
  'Foundation',
  'Structure',
  'RCC',
  'Masonry',
  'Finishing',
  'Electrical',
  'Plumbing',
  'Doors',
  'Windows',
  'Tiles',
  'Granite',
  'Painting',
  'Waterproofing',
  'Other',
];
