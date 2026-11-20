import { Link, Navigate, Outlet } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { storage } from '../utils/storage/localStorage';
import { STORAGE_KEYS } from '../constants';
import { Button } from '../components/common/Button';

export function RequireAdmin() {
  const session = storage.get(STORAGE_KEYS.session, null);
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const roleName = String(
    session.role?.name || (typeof session.role === 'string' ? session.role : '')
  ).toUpperCase();

  if (roleName !== 'ADMIN') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600 shadow-sm">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-red-600">403 Forbidden</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">
          Administrator Access Required
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Customer Feedback Management is strictly restricted to MK Construction &amp; Builders administrators.
          Your current role (<span className="font-semibold text-ink">{roleName || 'User'}</span>) does not have sufficient permissions.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/dashboard">
            <Button className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

export default RequireAdmin;
