import { storage } from '../../utils/storage/localStorage';
import { STORAGE_KEYS } from '../../constants';
import { DEFAULT_COMPANY } from '../../mock/company';

export const companyService = {
  async get() {
    return storage.get(STORAGE_KEYS.company, DEFAULT_COMPANY);
  },
  async update(patch) {
    const current = storage.get(STORAGE_KEYS.company, DEFAULT_COMPANY);
    const next = { ...current, ...patch };
    storage.set(STORAGE_KEYS.company, next);
    return next;
  },
};
