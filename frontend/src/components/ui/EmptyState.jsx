import { Inbox } from 'lucide-react';

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-canvas text-muted ring-1 ring-line">
        <Icon aria-hidden="true" className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
