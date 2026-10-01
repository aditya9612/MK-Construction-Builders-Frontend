import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { useUiStore } from '../store/uiStore';
import { cn } from '../utils/formatting';

export function AppLayout() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);

  return (
    <div className="min-h-screen bg-surface">
      <div className={cn('fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-ui lg:block', collapsed ? 'w-[76px]' : 'w-[268px]')}>
        <Sidebar />
      </div>
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-brand-navy/40" aria-label="Close menu" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[268px] animate-modal">
            <Sidebar />
          </div>
        </div>
      ) : null}
      <div className={cn('min-h-screen transition-[padding] duration-ui', collapsed ? 'lg:pl-[76px]' : 'lg:pl-[268px]')}>
        <Header />
        <main className="mx-auto max-w-app px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
