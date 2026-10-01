import { Outlet } from 'react-router-dom';

export function QuotationLayout() {
  return (
    <div className="min-h-screen bg-surface">
      <Outlet />
    </div>
  );
}
