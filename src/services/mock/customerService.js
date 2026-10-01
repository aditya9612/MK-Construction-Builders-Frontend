import { storage } from '../../utils/storage/localStorage';
import { STORAGE_KEYS } from '../../constants';
import { MOCK_CUSTOMERS } from '../../mock/customers';
import { crudStore } from './crudStore';
import { uid } from '../../utils/formatting';

const repo = crudStore(storage, STORAGE_KEYS.customers, MOCK_CUSTOMERS);

export const customerService = {
  getAll: () => repo.getAll(),
  getById: (id) => repo.getById(id),
  create: async (payload) =>
    repo.create({
      id: uid('cust'),
      status: 'Active',
      notes: '',
      address: '',
      ...payload,
    }),
  update: (id, patch) => repo.update(id, patch),
  delete: (id) => repo.delete(id),
};
