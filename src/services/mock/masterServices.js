import { storage } from '../../utils/storage/localStorage';
import { STORAGE_KEYS } from '../../constants';
import { MOCK_ELECTRICAL_MASTER } from '../../mock/electrical';
import { MOCK_PLUMBING } from '../../mock/plumbing';
import { MOCK_DOORS } from '../../mock/doors';
import { MOCK_WINDOWS } from '../../mock/windows';
import { MOCK_TILES, MOCK_GRANITE } from '../../mock/tiles';
import { MOCK_PAINTING } from '../../mock/painting';
import { crudStore } from './crudStore';
import { uid } from '../../utils/formatting';

export const electricalMasterService = crudStore(storage, STORAGE_KEYS.electricalMaster, MOCK_ELECTRICAL_MASTER);
export const plumbingMasterService = {
  ...crudStore(storage, STORAGE_KEYS.plumbingMaster, MOCK_PLUMBING),
  create: async (payload) =>
    crudStore(storage, STORAGE_KEYS.plumbingMaster, MOCK_PLUMBING).create({ id: uid('pl'), ...payload }),
};
export const doorsWindowsMasterService = crudStore(storage, STORAGE_KEYS.doorsWindowsMaster, [...MOCK_DOORS, ...MOCK_WINDOWS]);
export const tilesGraniteMasterService = crudStore(storage, STORAGE_KEYS.tilesGraniteMaster, [...MOCK_TILES, ...MOCK_GRANITE]);
export const paintingMasterService = crudStore(storage, STORAGE_KEYS.paintingMaster, MOCK_PAINTING);
