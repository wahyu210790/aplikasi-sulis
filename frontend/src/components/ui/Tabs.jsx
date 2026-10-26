import { cn } from '../../lib/cn.js';

// tabs: [{ key, label }]. Controlled: value = active key.
export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="-mx-4 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
      <div role="tablist" className="flex gap-6">
        {tabs.map((tab) => {
          const active = tab.key === value;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.key)}
              className={cn(
                '-mb-px border-b-2 py-3 text-sm font-medium whitespace-nowrap transition-colors',
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
