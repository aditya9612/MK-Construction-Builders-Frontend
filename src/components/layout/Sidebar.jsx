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
  Settings,
  UserCog,
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
      { to: '/settings', label: 'Company Settings', icon: Settings },
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
          'group relative flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] transition duration-ui',
          isActive ? 'bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]' : 'text-white/65 hover:bg-white/[0.05] hover:text-white',
          collapsed && 'justify-center px-0'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? <span className="absolute left-0 top-1/2 h-[18px] w-[3px] -translate-y-1/2 rounded-r bg-brand" /> : null}
          <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-[#9EC4EE]' : 'text-white/50 group-hover:text-white/80')} />
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
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,#0B223D_0%,#102F4F_100%)] text-white">
      <div className={cn('border-b border-white/[0.08]', collapsed ? 'flex justify-center px-2 py-5' : 'px-5 py-6')}>
        <div className={cn('flex flex-col items-center', collapsed ? '' : 'w-full')}>
          <div className={cn('flex items-center justify-center rounded-xl bg-white', collapsed ? 'h-11 w-11 p-1' : 'w-full px-3 py-3')}>
            <BrandLogo variant={collapsed ? 'compact' : 'full'} className={collapsed ? 'h-8 max-w-8' : 'h-auto w-[168px] max-w-full'} />
          </div>
          {collapsed ? null : (
            <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#8AA0B5]">Construction Estimation</p>
          )}
        </div>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-4">
        {GROUPS.map((group) => (
          <div key={group.label}>
            {collapsed ? null : <p className="nav-label">{group.label}</p>}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <Item key={item.to} {...item} collapsed={collapsed} onClick={closeMobile} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/[0.08] p-2">
        <button
          type="button"
          title={collapsed ? 'Logout' : undefined}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-white/60 transition duration-ui hover:bg-white/[0.04] hover:text-white',
            collapsed && 'justify-center px-0'
          )}
          onClick={() => {
            storage.remove(STORAGE_KEYS.session);
            window.location.assign('/login');
          }}
        >
          <LogOut className="h-4 w-4" />
          {collapsed ? <span className="sr-only">Logout</span> : 'Logout'}
        </button>
      </div>
    </div>
  );
}
