import { storage } from '../../utils/storage/localStorage';
import { STORAGE_KEYS } from '../../constants';
import { MOCK_RATES } from '../../mock/rates';
import { crudStore } from './crudStore';
import { uid } from '../../utils/formatting';

const repo = crudStore(storage, STORAGE_KEYS.rates, MOCK_RATES);

export const rateService = {
  getAll: () => repo.getAll(),
  getById: (id) => repo.getById(id),
  create: async (payload) => repo.create({ id: uid('rate'), status: 'Active', ...payload }),
  update: (id, patch) => repo.update(id, patch),
  delete: (id) => repo.delete(id),
};
