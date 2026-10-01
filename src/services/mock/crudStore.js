import { uid } from '../../utils/formatting';

export function crudStore(storage, key, seed) {
  const read = () => {
    const current = storage.get(key, null);
    if (Array.isArray(current)) return current;
    storage.set(key, seed);
    return seed;
  };

  return {
    getAll: async () => [...read()],
    getById: async (id) => read().find((row) => row.id === id) || null,
    create: async (payload) => {
      const rows = read();
      const record = { id: uid('row'), ...payload };
      storage.set(key, [record, ...rows]);
      return record;
    },
    update: async (id, patch) => {
      const rows = read();
      const next = rows.map((row) => (row.id === id ? { ...row, ...patch, id } : row));
      storage.set(key, next);
      return next.find((row) => row.id === id) || null;
    },
    delete: async (id) => {
      const rows = read();
      storage.set(
        key,
        rows.filter((row) => row.id !== id)
      );
      return true;
    },
    replaceAll: async (rows) => {
      storage.set(key, rows);
      return rows;
    },
  };
}
