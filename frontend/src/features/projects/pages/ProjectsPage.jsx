import { useState } from 'react';
import { useNavigate } from 'react-router';
import { FolderKanban, Pencil, Plus } from 'lucide-react';
import { useAuth } from '../../../auth/useAuth.js';
import { Button } from '../../../components/ui/Button.jsx';
import { DataTable } from '../../../components/ui/DataTable.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { FilterBar } from '../../../components/ui/FilterBar.jsx';
import { IconButton } from '../../../components/ui/IconButton.jsx';
import { Money } from '../../../components/ui/Money.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import { SearchInput } from '../../../components/ui/SearchInput.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { formatDate } from '../../../lib/format.js';
import { can, canSeeMoney } from '../../../lib/permissions.js';
import { useProjects } from '../api.js';
import { ProjectFormModal } from '../components/ProjectFormModal.jsx';

const STATUS_FILTER = [
  { value: '', label: 'Semua status' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'batal', label: 'Batal' },
];

export default function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canManage = can(user, 'projects.manage');
  const showMoney = canSeeMoney(user);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [formItem, setFormItem] = useState(undefined); // undefined = closed, null = new, object = edit

  const projects = useProjects({ search, status, page, per_page: 20 });

  function changeFilter(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  const columns = [
    {
      key: 'name',
      header: 'Proyek',
      render: (row) => (
        <div className="min-w-0">
          <div className="font-medium text-ink">{row.name}</div>
          <div className="font-mono text-xs text-muted">{row.code}</div>
        </div>
      ),
    },
    { key: 'client_name', header: 'Klien', render: (row) => row.client_name || <span className="text-muted">-</span> },
    { key: 'location', header: 'Lokasi', hideOnMobile: true, render: (row) => row.location || <span className="text-muted">-</span> },
    { key: 'start_date', header: 'Mulai', hideOnMobile: true, render: (row) => (row.start_date ? formatDate(row.start_date) : <span className="text-muted">-</span>) },
  ];
  if (showMoney) {
    columns.push({ key: 'contract_value', header: 'Nilai kontrak', align: 'right', render: (row) => <Money value={row.contract_value} /> });
  }
  columns.push({ key: 'status', header: 'Status', render: (row) => <StatusBadge kind="project" status={row.status} /> });
  if (canManage) {
    columns.push({
      key: 'actions',
      header: 'Aksi',
      align: 'right',
      render: (row) => <IconButton icon={Pencil} label="Ubah" onClick={() => setFormItem(row)} />,
    });
  }

  const hasFilter = Boolean(search || status);

  return (
    <>
      <PageHeader
        title="Proyek"
        subtitle="Proyek tujuan barang keluar."
        actions={
          canManage ? (
            <Button leftIcon={Plus} onClick={() => setFormItem(null)}>
              Tambah Proyek
            </Button>
          ) : null
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={changeFilter(setSearch)} placeholder="Cari kode, nama, atau klien…" />
        <div className="w-full sm:w-44">
          <Select value={status} onChange={changeFilter(setStatus)} options={STATUS_FILTER} />
        </div>
      </FilterBar>

      {projects.isError ? (
        <div className="rounded-card border border-line bg-surface shadow-sm">
          <ErrorState message={projects.error.message} onRetry={() => projects.refetch()} />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={projects.data?.data ?? []}
            loading={projects.isLoading}
            onRowClick={(row) => navigate(`/proyek/${row.id}`)}
            emptyState={
              <EmptyState
                icon={FolderKanban}
                title={hasFilter ? 'Tidak ada proyek yang cocok' : 'Belum ada proyek'}
                description={hasFilter ? 'Coba ubah kata kunci atau filter.' : canManage ? 'Tambahkan proyek pertama Anda.' : undefined}
              />
            }
          />
          <Pagination meta={projects.data?.meta} onPageChange={setPage} />
        </>
      )}

      {formItem !== undefined ? (
        <ProjectFormModal key={formItem?.id ?? 'new'} open onClose={() => setFormItem(undefined)} project={formItem} />
      ) : null}
    </>
  );
}
