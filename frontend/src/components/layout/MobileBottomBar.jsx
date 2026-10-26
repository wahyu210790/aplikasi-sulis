import { NavLink } from 'react-router';
import { useAuth } from '../../auth/useAuth.js';
import { cn } from '../../lib/cn.js';
import { bottomBarItems } from './NavItems.js';

// Gudang role on mobile only. Hidden when no menu item has bottomBar: true.
export function MobileBottomBar() {
  const { user } = useAuth();
  const items = bottomBarItems(user);
  if (items.length === 0) return null;

  return (
    <nav aria-label="Menu cepat" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn('flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium', isActive ? 'text-primary' : 'text-muted')
              }
            >
              <item.icon aria-hidden="true" className="h-5 w-5" />
              {item.bottomLabel ?? item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
