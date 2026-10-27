import { useAuth } from '../../../auth/useAuth.js';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { useDashboard } from '../api.js';
import { GudangDashboard } from '../components/GudangDashboard.jsx';
import { MoneyDashboard } from '../components/MoneyDashboard.jsx';

// Dashboard per role (docs/desain-v2.md B9.2). Owner/Finance: totals and profit. Gudang: lists without money.
export default function DashboardPage() {
  const { user } = useAuth();
  const dashboard = useDashboard();
  const data = dashboard.data?.data;

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Selamat datang, ${user.name}.`} />
      {dashboard.isError ? (
        <div className="rounded-card border border-line bg-surface shadow-sm">
          <ErrorState message={dashboard.error.message} onRetry={() => dashboard.refetch()} />
        </div>
      ) : !data ? (
        <div className="flex justify-center py-12 text-muted">
          <Spinner className="h-6 w-6" />
        </div>
      ) : data.view === 'money' ? (
        <MoneyDashboard data={data} />
      ) : (
        <GudangDashboard data={data} />
      )}
    </>
  );
}
