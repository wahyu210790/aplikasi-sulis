import { useState } from 'react';
import { useParams } from 'react-router';
import { Boxes, ChartColumn, Pencil, Receipt, Wallet } from 'lucide-react';
import { useAuth } from '../../../auth/useAuth.js';
import { Button } from '../../../components/ui/Button.jsx';
import { Card } from '../../../components/ui/Card.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { Money } from '../../../components/ui/Money.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { StatCard } from '../../../components/ui/StatCard.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Tabs } from '../../../components/ui/Tabs.jsx';
import { formatDate, formatDateTime, formatPercent, formatRupiah } from '../../../lib/format.js';
import { can, canSeeMoney } from '../../../lib/permissions.js';
import { useProject } from '../api.js';
import { ProjectCostsTab } from '../components/ProjectCostsTab.jsx';
import { ProjectFormModal } from '../components/ProjectFormModal.jsx';
import { ProjectMaterialsTab } from '../components/ProjectMaterialsTab.jsx';
import { ProjectProfitTab } from '../components/ProjectProfitTab.jsx';

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-1 font-medium break-words text-ink">{children}</dd>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const canManage = can(user, 'projects.manage');
  const canManageCosts = can(user, 'projectCosts.manage');
  const showMoney = canSeeMoney(user);
  const project = useProject(id);
  const [tab, setTab] = useState('summary');
  const [editing, setEditing] = useState(false);

  const breadcrumb = [{ label: 'Proyek', to: '/proyek' }, { label: project.data?.data.code ?? 'Detail' }];

  if (project.isLoading) {
    return (
      <>
        <PageHeader title="Detail Proyek" breadcrumb={breadcrumb} />
        <div className="flex justify-center py-12 text-muted">
          <Spinner className="h-6 w-6" />
        </div>
      </>
    );
  }

  if (project.isError) {
    return (
      <>
        <PageHeader title="Detail Proyek" breadcrumb={breadcrumb} />
        <div className="rounded-card border border-line bg-surface shadow-sm">
          <ErrorState message={project.error.message} onRetry={project.error.status === 404 ? undefined : () => project.refetch()} />
        </div>
      </>
    );
  }

  const item = project.data.data;
  const tabs = [
    { key: 'summary', label: 'Ringkasan' },
    { key: 'material', label: 'Material' },
  ];
  if (showMoney) {
    tabs.push({ key: 'costs', label: 'Biaya Lain' });
    tabs.push({ key: 'profit', label: 'Laba' });
  }

  return (
    <>
      <PageHeader
        title={item.name}
        subtitle={`Kode ${item.code}`}
        breadcrumb={breadcrumb}
        actions={
          canManage ? (
            <Button variant="secondary" leftIcon={Pencil} onClick={() => setEditing(true)}>
              Ubah Proyek
            </Button>
          ) : null
        }
      />

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      <div className="mt-4">
        {tab === 'summary' ? (
          <div className="space-y-4">
            {showMoney && item.summary ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Nilai kontrak" value={formatRupiah(item.contract_value)} icon={Wallet} tone="info" />
                <StatCard label="Biaya material" value={formatRupiah(item.summary.material_cost)} icon={Boxes} tone="warning" />
                <StatCard label="Biaya lain" value={formatRupiah(item.summary.other_costs)} icon={Receipt} tone="warning" />
                <StatCard
                  label="Laba"
                  value={formatRupiah(item.summary.profit)}
                  icon={ChartColumn}
                  tone={item.summary.profit < 0 ? 'danger' : 'success'}
                  hint={item.summary.margin_percent === null ? 'Margin –' : `Margin ${formatPercent(item.summary.margin_percent)}`}
                />
              </div>
            ) : null}
            <Card title="Ringkasan proyek">
              <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Status">
                  <StatusBadge kind="project" status={item.status} />
                </Field>
                <Field label="Klien">{item.client_name || '–'}</Field>
                <Field label="Lokasi">{item.location || '–'}</Field>
                <Field label="Tanggal mulai">{item.start_date ? formatDate(item.start_date) : '–'}</Field>
                <Field label="Tanggal selesai">{item.end_date ? formatDate(item.end_date) : '–'}</Field>
                {showMoney ? (
                  <Field label="Nilai kontrak">
                    <Money value={item.contract_value} />
                  </Field>
                ) : null}
                <Field label="Dibuat oleh">{item.created_by?.name ?? '–'}</Field>
                <Field label="Dibuat pada">{formatDateTime(item.created_at)}</Field>
                <Field label="Catatan">{item.notes || '–'}</Field>
              </dl>
            </Card>
          </div>
        ) : tab === 'material' ? (
          <ProjectMaterialsTab projectId={item.id} showMoney={showMoney} />
        ) : tab === 'costs' && showMoney ? (
          <ProjectCostsTab projectId={item.id} canManage={canManageCosts} />
        ) : tab === 'profit' && showMoney ? (
          <ProjectProfitTab project={item} />
        ) : null}
      </div>

      {editing ? <ProjectFormModal key={item.id} open onClose={() => setEditing(false)} project={item} /> : null}
    </>
  );
}
