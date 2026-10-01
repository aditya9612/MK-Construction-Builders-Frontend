import { Navigate, Outlet } from 'react-router-dom';
import { storage } from '../utils/storage/localStorage';
import { STORAGE_KEYS } from '../constants';

export function RequireSession() {
  const session = storage.get(STORAGE_KEYS.session, null);
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}
