import { Link } from 'react-router';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import { useAuth } from '../../auth/useAuth.js';
import { ROLE_LABELS } from '../../lib/constants.js';

// The menu button and both items are at least 44 px high, so they are easy to tap on a phone (QA bug #14).
export function UserMenu() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <Menu>
      <MenuButton className="flex min-h-11 items-center gap-2 rounded-control px-2 py-1.5 text-sm text-ink hover:bg-canvas focus:outline-none data-focus:ring-2 data-focus:ring-primary/30">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-primary">
          <UserRound aria-hidden="true" className="h-4 w-4" />
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block font-medium">{user.name}</span>
          <span className="block text-xs text-muted">{ROLE_LABELS[user.role]}</span>
        </span>
        <ChevronDown aria-hidden="true" className="h-4 w-4 text-muted" />
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        className="z-50 w-52 rounded-control border border-line bg-surface py-1 text-sm shadow-lg [--anchor-gap:6px] focus:outline-none"
      >
        <div className="border-b border-line px-3 py-2 sm:hidden">
          <p className="truncate font-medium text-ink">{user.name}</p>
          <p className="truncate text-xs text-muted">{ROLE_LABELS[user.role]}</p>
        </div>
        <MenuItem>
          <Link to="/akun" className="flex min-h-11 items-center gap-2 px-3 py-2 text-ink data-focus:bg-canvas">
            <UserRound aria-hidden="true" className="h-4 w-4 text-muted" />
            Akun Saya
          </Link>
        </MenuItem>
        <MenuItem>
          <button type="button" onClick={logout} className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-danger data-focus:bg-danger-soft">
            <LogOut aria-hidden="true" className="h-4 w-4" />
            Keluar
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
