import { storage } from '../../utils/storage/localStorage';
import { STORAGE_KEYS } from '../../constants';
import { MOCK_QUOTATIONS } from '../../mock/quotations';
import { crudStore } from './crudStore';
import { uid } from '../../utils/formatting';
import { calculateQuotationTotals } from '../../utils/calculations';
import { companyService } from './companyService';

const repo = crudStore(storage, STORAGE_KEYS.quotations, MOCK_QUOTATIONS);

async function nextNumber() {
  const company = await companyService.get();
  const year = new Date().getFullYear();
  const seq = Number(storage.get(STORAGE_KEYS.quotationSeq, 0)) + 1;
  storage.set(STORAGE_KEYS.quotationSeq, seq);
  const prefix = company?.quotationPrefix || 'MKQ';
  return `${prefix}-${year}-${String(seq).padStart(4, '0')}`;
}

function withTotals(quotation) {
  return { ...quotation, ...calculateQuotationTotals(quotation), updatedAt: new Date().toISOString() };
}

export const quotationService = {
  getAll: () => repo.getAll(),
  getById: (id) => repo.getById(id),
  async create(payload) {
    const quotationNumber = payload.quotationNumber || (await nextNumber());
    const record = withTotals({
      id: uid('q'),
      createdAt: new Date().toISOString(),
      ...payload,
      quotationNumber,
    });
    return repo.create(record);
  },
  async update(id, patch) {
    const current = await repo.getById(id);
    if (!current) return null;
    return repo.update(id, withTotals({ ...current, ...patch, id }));
  },
  delete: (id) => repo.delete(id),
  async duplicate(id) {
    const current = await repo.getById(id);
    if (!current) return null;
    const quotationNumber = await nextNumber();
    const copy = withTotals({
      ...current,
      id: uid('q'),
      quotationNumber,
      status: 'Draft',
      quotationDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    });
    return repo.create(copy);
  },
};
