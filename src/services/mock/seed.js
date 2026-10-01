import { storage } from '../../utils/storage/localStorage';
import { STORAGE_KEYS } from '../../constants';
import { MOCK_CUSTOMERS } from '../../mock/customers';
import { MOCK_PROJECTS } from '../../mock/projects';
import { MOCK_QUOTATIONS } from '../../mock/quotations';
import { MOCK_RATES } from '../../mock/rates';
import { MOCK_MATERIALS } from '../../mock/materials';
import { MOCK_ELECTRICAL_MASTER } from '../../mock/electrical';
import { MOCK_PLUMBING } from '../../mock/plumbing';
import { MOCK_DOORS } from '../../mock/doors';
import { MOCK_WINDOWS } from '../../mock/windows';
import { MOCK_TILES, MOCK_GRANITE } from '../../mock/tiles';
import { MOCK_PAINTING } from '../../mock/painting';
import { MOCK_TERMS } from '../../mock/terms';
import { DEFAULT_COMPANY, DEFAULT_USERS } from '../../mock/company';

export function seedIfNeeded() {
  if (!storage.get(STORAGE_KEYS.seeded, false)) {
    storage.set(STORAGE_KEYS.customers, MOCK_CUSTOMERS);
    storage.set(STORAGE_KEYS.projects, MOCK_PROJECTS);
    storage.set(STORAGE_KEYS.quotations, MOCK_QUOTATIONS);
    storage.set(STORAGE_KEYS.rates, MOCK_RATES);
    storage.set(STORAGE_KEYS.materials, MOCK_MATERIALS);
    storage.set(STORAGE_KEYS.electricalMaster, MOCK_ELECTRICAL_MASTER);
    storage.set(STORAGE_KEYS.plumbingMaster, MOCK_PLUMBING);
    storage.set(STORAGE_KEYS.doorsWindowsMaster, [...MOCK_DOORS, ...MOCK_WINDOWS]);
    storage.set(STORAGE_KEYS.tilesGraniteMaster, [...MOCK_TILES, ...MOCK_GRANITE]);
    storage.set(STORAGE_KEYS.paintingMaster, MOCK_PAINTING);
    storage.set(STORAGE_KEYS.terms, MOCK_TERMS);
    storage.set(STORAGE_KEYS.company, DEFAULT_COMPANY);
    storage.set(STORAGE_KEYS.users, DEFAULT_USERS);
    storage.set(STORAGE_KEYS.quotationSeq, 15);
    storage.set(STORAGE_KEYS.notifications, [
      { id: 'n1', title: 'Quotation MKQ-2026-0014 approved', time: '2 hours ago', read: false },
      { id: 'n2', title: 'Draft MKQ-2026-0015 awaiting review', time: 'Yesterday', read: false },
      { id: 'n3', title: 'Rate master updated for RCC', time: '3 days ago', read: true },
    ]);
    storage.set(STORAGE_KEYS.seeded, true);
  }
  if (!storage.get(STORAGE_KEYS.company, null)) storage.set(STORAGE_KEYS.company, DEFAULT_COMPANY);
}
