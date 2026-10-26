import { Brand } from './Brand.jsx';
import { SidebarNav } from './SidebarNav.jsx';
import { SidebarUser } from './SidebarUser.jsx';

// Desktop only (lg and up). Mobile uses MobileTopBar + Drawer.
export function Sidebar() {
  return (
    <aside className="hidden bg-sidebar lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        <Brand />
      </div>
      <SidebarNav />
      <SidebarUser />
    </aside>
  );
}
