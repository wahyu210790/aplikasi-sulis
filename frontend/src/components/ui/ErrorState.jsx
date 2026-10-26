import { RefreshCw, TriangleAlert } from 'lucide-react';
import { Button } from './Button.jsx';

export function ErrorState({ message = 'Gagal memuat data.', onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center px-4 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <TriangleAlert aria-hidden="true" className="h-6 w-6" />
      </div>
      <p className="mt-4 text-sm text-ink">{message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" leftIcon={RefreshCw} className="mt-4" onClick={onRetry}>
          Coba lagi
        </Button>
      ) : null}
    </div>
  );
}
