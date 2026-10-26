import { NavLink } from 'react-router';
import { useAuth } from '../../auth/useAuth.js';
import { can } from '../../lib/permissions.js';
import { cn } from '../../lib/cn.js';
import { NAV_GROUPS } from './NavItems.js';

// Menu used by the desktop sidebar and the mobile drawer. Shows only items the user's role may open.
export function SidebarNav({ onNavigate }) {
  const { user } = useAuth();

  return (
    <nav aria-label="Menu utama" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((item) => can(user, item.action));
        if (items.length === 0) return null;
        return (
          <div key={group.label}>
            <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">{group.label}</p>
            <ul className="mt-2 space-y-1">
              {items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-sidebar-active text-white shadow-[inset_3px_0_0_0_var(--color-primary)]'
                          : 'text-slate-300 hover:bg-sidebar-active/60 hover:text-white',
                      )
                    }
                  >
                    <item.icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
