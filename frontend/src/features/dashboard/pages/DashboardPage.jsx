import { useAuth } from '../../../auth/useAuth.js';
import { ROLE_LABELS } from '../../../lib/constants.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Card } from '../../../components/ui/Card.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';

// Fase 1 placeholder. The real dashboard per role comes in Fase 5.
export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Selamat datang, ${user.name}.`} />
      <Card title="Informasi akun">
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Nama</dt>
            <dd className="mt-1 font-medium text-ink">{user.name}</dd>
          </div>
          <div>
            <dt className="text-muted">Email</dt>
            <dd className="mt-1 font-medium break-all text-ink">{user.email}</dd>
          </div>
          <div>
            <dt className="text-muted">Peran</dt>
            <dd className="mt-1">
              <Badge tone="primary">{ROLE_LABELS[user.role]}</Badge>
            </dd>
          </div>
        </dl>
        <p className="mt-5 rounded-control bg-canvas px-4 py-3 text-sm text-muted">
          Aplikasi sedang dibangun bertahap. Menu baru akan muncul setelah setiap tahap selesai.
        </p>
      </Card>
    </>
  );
}
