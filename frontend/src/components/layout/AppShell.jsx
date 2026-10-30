import { useState } from 'react';
import { Outlet } from 'react-router';
import { X } from 'lucide-react';
import { useAuth } from '../../auth/useAuth.js';
import { cn } from '../../lib/cn.js';
import { Drawer } from '../ui/Drawer.jsx';
import { IconButton } from '../ui/IconButton.jsx';
import { Brand } from './Brand.jsx';
import { MobileBottomBar } from './MobileBottomBar.jsx';
import { bottomBarItems } from './NavItems.js';
import { MobileTopBar } from './MobileTopBar.jsx';
import { RefreshIndicator } from './RefreshIndicator.jsx';
import { Sidebar } from './Sidebar.jsx';
import { SidebarNav } from './SidebarNav.jsx';
import { SidebarUser } from './SidebarUser.jsx';
import { UserMenu } from './UserMenu.jsx';

export function AppShell() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const hasBottomBar = bottomBarItems(user).length > 0;

  return (
    <div className="min-h-screen bg-canvas">
      <RefreshIndicator />
      <Sidebar />

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)}>
        <div className="flex h-14 items-center justify-between border-b border-white/10 pr-2 pl-4">
          <Brand />
          <IconButton icon={X} label="Tutup menu" variant="dark" onClick={() => setMenuOpen(false)} />
        </div>
        <SidebarNav onNavigate={() => setMenuOpen(false)} />
        <SidebarUser />
      </Drawer>

      <div className="lg:pl-64">
        <MobileTopBar onOpenMenu={() => setMenuOpen(true)} />
        <header className="sticky top-0 z-30 hidden h-16 items-center justify-end border-b border-line bg-surface/95 px-8 backdrop-blur lg:flex">
          <UserMenu />
        </header>
        <main className={cn('mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8', hasBottomBar && 'pb-24 lg:pb-8')}>
          <Outlet />
        </main>
      </div>

      <MobileBottomBar />
    </div>
  );
}
