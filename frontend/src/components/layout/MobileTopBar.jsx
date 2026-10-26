import { Menu as MenuIcon } from 'lucide-react';
import { IconButton } from '../ui/IconButton.jsx';
import { UserMenu } from './UserMenu.jsx';

export function MobileTopBar({ onOpenMenu }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface/95 px-2 backdrop-blur lg:hidden">
      <IconButton icon={MenuIcon} label="Buka menu" onClick={onOpenMenu} />
      <p className="flex-1 truncate text-base font-semibold text-ink">Stok Gudang</p>
      <UserMenu />
    </header>
  );
}
