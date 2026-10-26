import { useAuth } from '../../../auth/useAuth.js';
import { bottomBarItems } from '../../../components/layout/NavItems.js';
import { cn } from '../../../lib/cn.js';

// Save bar that stays visible at the bottom of the screen while a long form scrolls.
// For Gudang on mobile it sits just above the bottom menu bar.
export function StickySubmitBar({ children, summary }) {
  const { user } = useAuth();
  const aboveBottomBar = bottomBarItems(user).length > 0;

  return (
    <div
      className={cn(
        'sticky z-20 -mx-4 mt-6 border-t border-line bg-surface/95 px-4 py-3 shadow-sm backdrop-blur sm:mx-0 sm:rounded-card sm:border',
        aboveBottomBar ? 'bottom-[calc(4rem+env(safe-area-inset-bottom))] lg:bottom-0' : 'bottom-0',
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {summary ? <div className="text-sm text-muted">{summary}</div> : <span />}
        <div className="flex flex-col-reverse gap-2 sm:flex-row">{children}</div>
      </div>
    </div>
  );
}
