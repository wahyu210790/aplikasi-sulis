import { cn } from '../../lib/cn.js';

// tabs: [{ key, label }]. Controlled: value = active key.
// The line under the tabs sits on the tab list itself, so the active tab's underline never makes the box 1px
// taller than its scroll area (QA bug #16: a stray scrollbar). Tabs wider than the screen scroll sideways
// without a visible scrollbar, and a tapped tab scrolls fully into view (QA bug #19).
export function Tabs({ tabs, value, onChange }) {
  function select(event, key) {
    onChange(key);
    event.currentTarget.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }

  return (
    <div className="-mx-4 overflow-x-auto overflow-y-hidden px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
      <div role="tablist" className="flex w-max min-w-full gap-6 border-b border-line">
        {tabs.map((tab) => {
          const active = tab.key === value;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={(event) => select(event, tab.key)}
              className={cn(
                '-mb-px min-h-11 border-b-2 py-3 text-sm font-medium whitespace-nowrap transition-colors',
                active ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
