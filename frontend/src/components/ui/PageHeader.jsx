import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';

// breadcrumb: [{ label, to }] — the last item is the current page (no link needed).
// Each link has a 44 px high tap area (padding with a matching negative margin, so the layout stays the same; QA bug #14).
export function PageHeader({ title, subtitle, actions, breadcrumb }) {
  return (
    <div className="mb-6">
      {breadcrumb?.length ? (
        <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1 text-xs text-muted">
          {breadcrumb.map((item, index) => (
            <span key={item.label} className="inline-flex items-center gap-1">
              {index > 0 ? <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" /> : null}
              {item.to ? (
                <Link to={item.to} className="-my-3.5 inline-block py-3.5 hover:text-ink hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span className="text-ink">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
