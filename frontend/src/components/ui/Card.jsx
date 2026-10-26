import { cn } from '../../lib/cn.js';

export function Card({ title, description, actions, padded = true, className, children }) {
  return (
    <section className={cn('rounded-card border border-line bg-surface shadow-sm', className)}>
      {title || actions ? (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div className="min-w-0">
            {title ? <h2 className="text-base font-semibold text-ink">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={padded ? 'p-4 sm:p-5' : undefined}>{children}</div>
    </section>
  );
}
