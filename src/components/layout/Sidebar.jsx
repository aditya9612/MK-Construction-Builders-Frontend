import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Plus,
  Files,
  Users,
  Building2,
  Gauge,
  Boxes,
  Zap,
  Droplets,
  DoorOpen,
  Square,
  Paintbrush,
  BarChart3,
  ScrollText,
  UserCog,
  User,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { cn } from '../../utils/formatting';
import { useUiStore } from '../../store/uiStore';
import { storage } from '../../utils/storage/localStorage';
import { STORAGE_KEYS } from '../../constants';

const GROUPS = [
  {
    label: 'Workspace',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Quotations',
    items: [
      { to: '/quotations/new', label: 'New Quotation', icon: Plus },
      { to: '/quotations', label: 'All Quotations', icon: Files, end: true },
      { to: '/quotations?status=Draft', label: 'Drafts', icon: FileText },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/customers', label: 'Customers', icon: Users },
      { to: '/projects', label: 'Projects', icon: Building2 },
    ],
  },
  {
    label: 'Masters',
    items: [
      { to: '/masters/rates', label: 'Rate Master', icon: Gauge },
      { to: '/masters/materials', label: 'Material Master', icon: Boxes },
      { to: '/masters/electrical', label: 'Electrical', icon: Zap },
      { to: '/masters/plumbing', label: 'Plumbing', icon: Droplets },
      { to: '/masters/doors-windows', label: 'Doors & Windows', icon: DoorOpen },
      { to: '/masters/tiles-granite', label: 'Tiles & Granite', icon: Square },
      { to: '/masters/painting', label: 'Painting', icon: Paintbrush },
    ],
  },
  {
    label: 'Business',
    items: [
      { to: '/reports', label: 'Reports', icon: BarChart3 },
      { to: '/terms', label: 'Terms & Conditions', icon: ScrollText },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/profile', label: 'My Profile', icon: User },
      { to: '/company', label: 'Company Settings', icon: Building2 },
      { to: '/users', label: 'Users', icon: UserCog },
      { to: '/help', label: 'Help', icon: HelpCircle },
    ],
  },
];

function Item({ to, label, icon: Icon, collapsed, onClick, end }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition duration-ui',
          isActive
            ? 'bg-white/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
            : 'text-white/65 hover:bg-white/[0.05] hover:text-white',
          collapsed && 'justify-center px-0 h-9 w-9 mx-auto'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <span className="absolute left-0 top-1/2 h-[18px] w-[3px] -translate-y-1/2 rounded-r-full bg-[#38bdf8]" />
          ) : null}
          <Icon
            className={cn(
              'h-4 w-4 shrink-0 transition-colors',
              isActive ? 'text-[#38bdf8]' : 'text-white/50 group-hover:text-white/80'
            )}
          />
          {collapsed ? <span className="sr-only">{label}</span> : <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);
  const closeMobile = () => setMobileNavOpen(false);

  return (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,#0B223D_0%,#102F4F_100%)] text-white select-none">
      {/* Sleek, modern header aligning with top navbar height (h-[68px]) */}
      <div
        className={cn(
          'flex h-[68px] items-center border-b border-white/[0.08] transition-all',
          collapsed ? 'justify-center px-2' : 'px-4'
        )}
      >
        <div className={cn('flex items-center gap-2.5', collapsed ? 'justify-center' : 'w-full')}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white p-1 shadow-sm">
            <BrandLogo variant="compact" className="h-7 w-7 object-contain" />
          </div>
          {collapsed ? null : (
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[13.5px] font-bold tracking-tight text-white leading-tight">
                MK Construction
              </h1>
              <p className="truncate text-[10px] font-medium uppercase tracking-[0.12em] text-[#8AA0B5]">
                Estimation Platform
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-3.5">
        {GROUPS.map((group) => (
          <div key={group.label}>
            {collapsed ? null : (
              <p className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <Item key={item.to} {...item} collapsed={collapsed} onClick={closeMobile} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Compact, modern footer */}
      <div className="border-t border-white/[0.08] p-2">
        <button
          type="button"
          title={collapsed ? 'Sign out' : undefined}
          className={cn(
            'flex items-center rounded-lg text-[13px] font-medium text-white/70 transition duration-ui hover:bg-white/[0.08] hover:text-white',
            collapsed
              ? 'h-9 w-9 justify-center mx-auto'
              : 'w-full gap-2.5 px-2.5 py-2'
          )}
          onClick={() => {
            storage.remove(STORAGE_KEYS.session);
            window.location.assign('/login');
          }}
        >
          <LogOut className="h-4 w-4 shrink-0 text-white/50" />
          {collapsed ? (
            <span className="sr-only">Sign out</span>
          ) : (
            <div className="flex flex-1 items-center justify-between min-w-0">
              <span className="truncate">Sign out</span>
              <span className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-semibold text-white/40 tracking-wider">
                v2.0
              </span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
