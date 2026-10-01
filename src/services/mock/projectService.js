import { storage } from '../../utils/storage/localStorage';
import { STORAGE_KEYS } from '../../constants';
import { MOCK_PROJECTS } from '../../mock/projects';
import { crudStore } from './crudStore';
import { uid } from '../../utils/formatting';

const repo = crudStore(storage, STORAGE_KEYS.projects, MOCK_PROJECTS);

export const projectService = {
  getAll: () => repo.getAll(),
  getById: (id) => repo.getById(id),
  create: async (payload) =>
    repo.create({
      id: uid('proj'),
      status: 'Planning',
      ...payload,
    }),
  update: (id, patch) => repo.update(id, patch),
  delete: (id) => repo.delete(id),
};
