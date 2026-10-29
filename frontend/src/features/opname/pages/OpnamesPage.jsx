import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ClipboardCheck, Plus } from 'lucide-react';
import { useAuth } from '../../../auth/useAuth.js';
import { Button } from '../../../components/ui/Button.jsx';
import { DataTable } from '../../../components/ui/DataTable.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { FilterBar } from '../../../components/ui/FilterBar.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import { SearchInput } from '../../../components/ui/SearchInput.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { formatDate } from '../../../lib/format.js';
import { can } from '../../../lib/permissions.js';
import { useOpnames } from '../api.js';
import { OpnameCreateModal } from '../components/OpnameCreateModal.jsx';

const STATUS_FILTER = [
  { value: '', label: 'Semua status' },
  { value: 'draft', label: 'Draft' },
  { value: 'menunggu_persetujuan', label: 'Menunggu Persetujuan' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'batal', label: 'Batal' },
];

export default function OpnamesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canManage = can(user, 'opname.manage');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

  const opnames = useOpnames({ search, status, page, per_page: 20 });

  function changeFilter(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  const columns = [
    {
      key: 'number',
      header: 'Nomor',
      render: (row) => (
        <div>
          <div className="font-mono font-medium text-ink">{row.number}</div>
          <div className="text-xs text-muted">{formatDate(row.opname_date)}</div>
        </div>
      ),
    },
    { key: 'created_by', header: 'Dibuat oleh', hideOnMobile: true, render: (row) => row.created_by?.name ?? '–' },
    { key: 'items_count', header: 'Jumlah barang', align: 'right', render: (row) => `${row.items_count} barang` },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge kind="opname" status={row.status} /> },
  ];

  const hasFilter = Boolean(search || status);

  return (
    <>
      <PageHeader
        title="Stok Opname"
        subtitle="Hitung stok fisik di gudang. Stok baru dikoreksi setelah Owner menyetujui."
        actions={
          canManage ? (
            <Button leftIcon={Plus} onClick={() => setCreating(true)}>
              Buat Stok Opname
            </Button>
          ) : null
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={changeFilter(setSearch)} placeholder="Cari nomor opname…" />
        <div className="w-full sm:w-56">
          <Select value={status} onChange={changeFilter(setStatus)} options={STATUS_FILTER} />
        </div>
      </FilterBar>

      {opnames.isError ? (
        <div className="rounded-card border border-line bg-surface shadow-sm">
          <ErrorState message={opnames.error.message} onRetry={() => opnames.refetch()} />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={opnames.data?.data ?? []}
            loading={opnames.isLoading}
            onRowClick={(row) => navigate(`/stok-opname/${row.id}`)}
            emptyState={
              <EmptyState
                icon={ClipboardCheck}
                title={hasFilter ? 'Tidak ada opname yang cocok' : 'Belum ada stok opname'}
                description={hasFilter ? 'Coba ubah kata kunci atau filter.' : canManage ? 'Buat stok opname pertama Anda.' : undefined}
              />
            }
          />
          <Pagination meta={opnames.data?.meta} onPageChange={setPage} />
        </>
      )}

      {creating ? <OpnameCreateModal open onClose={() => setCreating(false)} /> : null}
    </>
  );
}
