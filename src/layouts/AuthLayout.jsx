import { Outlet } from 'react-router-dom';
import { BrandLogo } from '../components/common/BrandLogo';

export function AuthLayout() {
  return (
    <div className="auth-grid flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-[420px] rounded-[14px] border border-white/10 bg-white p-8 shadow-paper">
        <div className="mb-8 flex flex-col items-center">
          <BrandLogo variant="dark" className="h-auto w-[180px] max-w-full" />
          <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.16em] text-faint">Construction Estimation</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
