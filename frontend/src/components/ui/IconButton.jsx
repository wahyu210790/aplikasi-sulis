import { cn } from '../../lib/cn.js';

const VARIANTS = {
  ghost: 'text-muted hover:bg-canvas hover:text-ink',
  secondary: 'border border-line bg-surface text-ink hover:bg-canvas',
  danger: 'text-danger hover:bg-danger-soft',
  dark: 'text-slate-300 hover:bg-sidebar-active hover:text-white',
};

// label is required: it becomes aria-label and the tooltip (icon-only buttons need a text name).
export function IconButton({ icon: Icon, label, variant = 'ghost', type = 'button', className, ...rest }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-control transition-colors sm:h-9 sm:w-9',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      <Icon aria-hidden="true" className="h-5 w-5" />
    </button>
  );
}
