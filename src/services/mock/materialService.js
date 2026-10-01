import { storage } from '../../utils/storage/localStorage';
import { STORAGE_KEYS } from '../../constants';
import { MOCK_MATERIALS } from '../../mock/materials';
import { crudStore } from './crudStore';
import { uid } from '../../utils/formatting';

const repo = crudStore(storage, STORAGE_KEYS.materials, MOCK_MATERIALS);

export const materialService = {
  getAll: () => repo.getAll(),
  getById: (id) => repo.getById(id),
  create: async (payload) => repo.create({ id: uid('mat'), status: 'Active', ...payload }),
  update: (id, patch) => repo.update(id, patch),
  delete: (id) => repo.delete(id),
};
