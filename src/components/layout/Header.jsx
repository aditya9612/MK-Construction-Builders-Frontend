import { Bell, Menu, PanelLeftClose, PanelLeftOpen, Search, User, Building2, LogOut } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUiStore } from '../../store/uiStore';
import { Breadcrumb } from '../common/PageHeader';
import { BrandLogo } from '../common/BrandLogo';
import { initials } from '../../utils/formatting';
import { storage } from '../../utils/storage/localStorage';
import { STORAGE_KEYS } from '../../constants';

const CRUMBS = [
  { test: /^\/dashboard/, items: [{ label: 'Dashboard' }] },
  { test: /^\/quotations\/new/, items: [{ label: 'Quotations', to: '/quotations' }, { label: 'New Quotation' }] },
  { test: /^\/quotations\/.+\/edit/, items: [{ label: 'Quotations', to: '/quotations' }, { label: 'Edit' }] },
  { test: /^\/quotations\/.+/, items: [{ label: 'Quotations', to: '/quotations' }, { label: 'Details' }] },
  { test: /^\/quotations/, items: [{ label: 'Quotations' }] },
  { test: /^\/customers\/.+/, items: [{ label: 'Customers', to: '/customers' }, { label: 'Details' }] },
  { test: /^\/customers/, items: [{ label: 'Customers' }] },
  { test: /^\/projects\/.+/, items: [{ label: 'Projects', to: '/projects' }, { label: 'Details' }] },
  { test: /^\/projects/, items: [{ label: 'Projects' }] },
  { test: /^\/masters/, items: [{ label: 'Masters' }] },
  { test: /^\/reports/, items: [{ label: 'Reports' }] },
  { test: /^\/terms/, items: [{ label: 'Terms' }] },
  { test: /^\/profile/, items: [{ label: 'Profile' }] },
  { test: /^\/company/, items: [{ label: 'Company Settings' }] },
  { test: /^\/settings/, items: [{ label: 'Settings' }] },
  { test: /^\/users/, items: [{ label: 'Users' }] },
  { test: /^\/help/, items: [{ label: 'Help' }] },
];

export function Header() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);
  const location = useLocation();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(false);
  const [notes, setNotes] = useState(false);
  const searchRef = useRef(null);
  const [session, setSession] = useState(() =>
    storage.get(STORAGE_KEYS.session, { name: 'User', role: 'Admin' })
  );
  const notifications = storage.get(STORAGE_KEYS.notifications, []);
  const crumbs = useMemo(() => CRUMBS.find((c) => c.test.test(location.pathname))?.items || [{ label: 'App' }], [location.pathname]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    const updateSession = () => {
      setSession(storage.get(STORAGE_KEYS.session, { name: 'User', role: 'Admin' }));
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('storage', updateSession);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('storage', updateSession);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center gap-4 border-b border-line bg-white px-4 no-print">
      <button type="button" className="rounded-md p-2 text-muted transition duration-ui hover:bg-surface hover:text-ink lg:hidden" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
        <Menu className="h-4 w-4" />
      </button>
      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white lg:hidden">
        <BrandLogo variant="compact" className="h-7 max-w-7" />
      </div>
      <button type="button" className="hidden rounded-md p-2 text-muted transition duration-ui hover:bg-surface hover:text-ink lg:inline-flex" onClick={toggleSidebar} aria-label="Collapse sidebar">
        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </button>
      <div className="hidden min-w-0 md:block">
        <Breadcrumb items={crumbs} />
      </div>
      <form
        className="relative mx-auto hidden w-full max-w-md md:block"
        onSubmit={(e) => {
          e.preventDefault();
          navigate(`/quotations?q=${encodeURIComponent(q)}`);
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" />
        <input
          ref={searchRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search quotations, customers, projects..."
          className="h-10 w-full rounded-[10px] border border-line bg-surface pl-9 pr-16 text-sm text-ink placeholder:text-faint transition duration-ui focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-line bg-white px-1.5 py-0.5 text-[10px] text-faint sm:inline">
          Ctrl K
        </kbd>
      </form>
      <div className="ml-auto flex items-center gap-1">
        <div className="relative">
          <button type="button" className="relative rounded-md p-2 text-muted transition duration-ui hover:bg-surface hover:text-ink" aria-label="Notifications" onClick={() => { setNotes((v) => !v); setMenu(false); }}>
            <Bell className="h-4 w-4" />
            {notifications.some((n) => !n.read) ? <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger" /> : null}
          </button>
          {notes ? (
            <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-lg border border-line bg-white p-1 shadow-pop">
              <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-faint">Notifications</p>
              {notifications.map((n) => (
                <div key={n.id} className="rounded-md px-3 py-2 text-sm hover:bg-surface">
                  <p className="font-medium text-ink">{n.title}</p>
                  <p className="text-xs text-muted">{n.time}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="relative">
          <button type="button" className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition duration-ui hover:bg-surface" onClick={() => { setMenu((v) => !v); setNotes(false); }}>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-navy text-[11px] font-semibold text-white">{initials(session.name)}</span>
            <span className="hidden text-left lg:block">
              <span className="block text-[13px] font-medium text-ink">{session.name}</span>
              <span className="block text-[11px] text-muted">{session.role}</span>
            </span>
          </button>
          {menu ? (
            <div className="absolute right-0 mt-2 w-52 rounded-lg border border-line bg-white p-1.5 shadow-pop">
              <button
                type="button"
                className="flex items-center gap-2.5 w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-surface transition-colors"
                onClick={() => {
                  setMenu(false);
                  navigate('/profile');
                }}
              >
                <User className="h-4 w-4 text-[#0284c7]" />
                <span>My Profile</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-2.5 w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-surface transition-colors"
                onClick={() => {
                  setMenu(false);
                  navigate('/company');
                }}
              >
                <Building2 className="h-4 w-4 text-[#0284c7]" />
                <span>Company Settings</span>
              </button>
              <div className="my-1 border-t border-line" />
              <button
                type="button"
                className="flex items-center gap-2.5 w-full rounded-md px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                onClick={() => {
                  storage.remove(STORAGE_KEYS.session);
                  window.location.assign('/login');
                }}
              >
                <LogOut className="h-4 w-4 text-rose-500" />
                <span>Logout</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
