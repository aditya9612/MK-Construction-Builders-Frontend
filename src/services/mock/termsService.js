import { storage } from '../../utils/storage/localStorage';
import { STORAGE_KEYS } from '../../constants';
import { MOCK_TERMS } from '../../mock/terms';
import { crudStore } from './crudStore';
import { uid } from '../../utils/formatting';

const repo = crudStore(storage, STORAGE_KEYS.terms, MOCK_TERMS);

export const termsService = {
  getAll: () => repo.getAll(),
  getById: (id) => repo.getById(id),
  create: async (payload) => repo.create({ id: uid('term'), selected: true, ...payload }),
  update: (id, patch) => repo.update(id, patch),
  delete: (id) => repo.delete(id),
};
