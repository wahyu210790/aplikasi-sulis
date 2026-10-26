import { Link } from 'react-router';
import { ShieldAlert } from 'lucide-react';

export function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center px-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning-soft text-warning">
        <ShieldAlert aria-hidden="true" className="h-7 w-7" />
      </div>
      <h1 className="mt-4 text-xl font-semibold text-ink">Akses ditolak</h1>
      <p className="mt-1 max-w-sm text-sm text-muted">Anda tidak memiliki akses ke halaman ini.</p>
      <Link to="/" className="mt-6 text-sm font-medium text-primary hover:underline">
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
