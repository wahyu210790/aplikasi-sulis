import { LogOut } from 'lucide-react';
import { useAuth } from '../../auth/useAuth.js';
import { ROLE_LABELS } from '../../lib/constants.js';
import { IconButton } from '../ui/IconButton.jsx';

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function SidebarUser() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="flex items-center gap-3 border-t border-white/10 px-4 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-active text-xs font-semibold text-white">
        {initials(user.name)}
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-medium text-white">{user.name}</p>
        <p className="truncate text-xs text-slate-400">{ROLE_LABELS[user.role]}</p>
      </div>
      <IconButton icon={LogOut} label="Keluar" variant="dark" onClick={logout} />
    </div>
  );
}
