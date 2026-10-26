import { Spinner } from '../ui/Spinner.jsx';

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas text-muted" role="status" aria-label="Memuat">
      <Spinner className="h-6 w-6" />
    </div>
  );
}
