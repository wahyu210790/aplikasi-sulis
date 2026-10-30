import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button.jsx';

// meta: { current_page, last_page, per_page, total } from the API (B16).
// Normal-size buttons: 44 px high on a phone, so they are easy to tap (QA bug #14).
export function Pagination({ meta, onPageChange }) {
  if (!meta || meta.total === 0) return null;
  const from = (meta.current_page - 1) * meta.per_page + 1;
  const to = Math.min(meta.current_page * meta.per_page, meta.total);

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-muted sm:flex-row">
      <p>
        Menampilkan <span className="font-medium text-ink">{from}</span>–<span className="font-medium text-ink">{to}</span> dari{' '}
        <span className="font-medium text-ink">{meta.total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" leftIcon={ChevronLeft} disabled={meta.current_page <= 1} onClick={() => onPageChange(meta.current_page - 1)}>
          Sebelumnya
        </Button>
        <span className="px-1 tabular-nums">
          {meta.current_page} / {meta.last_page}
        </span>
        <Button variant="secondary" disabled={meta.current_page >= meta.last_page} onClick={() => onPageChange(meta.current_page + 1)}>
          Berikutnya
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
