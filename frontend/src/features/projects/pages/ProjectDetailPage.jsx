import { useState } from 'react';
import { useParams } from 'react-router';
import { Boxes, ChartColumn, Pencil, Receipt } from 'lucide-react';
import { useAuth } from '../../../auth/useAuth.js';
import { Button } from '../../../components/ui/Button.jsx';
import { Card } from '../../../components/ui/Card.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { Money } from '../../../components/ui/Money.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Tabs } from '../../../components/ui/Tabs.jsx';
import { formatDate, formatDateTime } from '../../../lib/format.js';
import { can, canSeeMoney } from '../../../lib/permissions.js';
import { useProject } from '../api.js';
import { ProjectFormModal } from '../components/ProjectFormModal.jsx';

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
        ) : (
          <div className="rounded-card border border-line bg-surface shadow-sm">
            {tab === 'material' ? (
              <EmptyState
                icon={Boxes}
                title="Belum ada material"
                description="Barang yang dikirim ke proyek ini akan tampil di sini setelah fitur barang keluar tersedia."
              />
            ) : tab === 'costs' ? (
              <EmptyState icon={Receipt} title="Belum ada biaya lain" description="Biaya selain material akan bisa dicatat di sini pada tahap berikutnya." />
            ) : (
              <EmptyState icon={ChartColumn} title="Laba belum tersedia" description="Perhitungan laba proyek akan tampil di sini pada tahap berikutnya." />
            )}
          </div>
        )}
      </div>

      {editing ? <ProjectFormModal key={item.id} open onClose={() => setEditing(false)} project={item} /> : null}
    </>
  );
}
