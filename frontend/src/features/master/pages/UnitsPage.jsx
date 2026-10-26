import { useState } from 'react';
import { Pencil, Plus, Power, PowerOff, Ruler } from 'lucide-react';
import { useAuth } from '../../../auth/useAuth.js';
import { Button } from '../../../components/ui/Button.jsx';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.jsx';
import { DataTable } from '../../../components/ui/DataTable.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { FilterBar } from '../../../components/ui/FilterBar.jsx';
import { IconButton } from '../../../components/ui/IconButton.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import { SearchInput } from '../../../components/ui/SearchInput.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { useToast } from '../../../components/ui/useToast.js';
import { formatDateTime } from '../../../lib/format.js';
import { can } from '../../../lib/permissions.js';
import { useSaveUnit, useUnits } from '../api.js';
import { UnitFormModal } from '../components/UnitFormModal.jsx';

const STATUS_FILTER = [
  { value: '', label: 'Semua status' },
  { value: '1', label: 'Aktif' },
  { value: '0', label: 'Nonaktif' },
];

export default function UnitsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const canManage = can(user, 'master.manage');
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('');
  const [page, setPage] = useState(1);
  const [formItem, setFormItem] = useState(undefined); // undefined = closed, null = new, object = edit
  const [toggleItem, setToggleItem] = useState(null);

  const units = useUnits({ search, is_active: isActive, page, per_page: 20 });
  const save = useSaveUnit();

  function changeFilter(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  async function confirmToggle() {
    const target = toggleItem;
    try {
      await save.mutateAsync({ id: target.id, name: target.name, symbol: target.symbol, is_active: !target.is_active });
      toast.success(target.is_active ? 'Satuan dinonaktifkan.' : 'Satuan diaktifkan kembali.');
    } catch (error) {
      toast.error(error.message);
    }
    setToggleItem(null);
  }

  const columns = [
    { key: 'name', header: 'Nama satuan', render: (row) => <span className="font-medium text-ink">{row.name}</span> },
    { key: 'symbol', header: 'Simbol', render: (row) => <span className="font-mono text-sm">{row.symbol}</span> },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge kind="user" status={row.is_active ? 'active' : 'inactive'} /> },
    { key: 'updated_at', header: 'Terakhir diubah', hideOnMobile: true, render: (row) => <span className="text-muted">{formatDateTime(row.updated_at)}</span> },
  ];
  if (canManage) {
    columns.push({
      key: 'actions',
      header: 'Aksi',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <IconButton icon={Pencil} label="Ubah" onClick={() => setFormItem(row)} />
          {row.is_active ? (
            <IconButton icon={PowerOff} label="Nonaktifkan" variant="danger" onClick={() => setToggleItem(row)} />
          ) : (
            <IconButton icon={Power} label="Aktifkan" onClick={() => setToggleItem(row)} />
          )}
        </div>
      ),
    });
  }

  const hasFilter = Boolean(search || isActive);

  return (
    <>
      <PageHeader
        title="Satuan"
        subtitle="Satuan jumlah barang, misalnya meter, batang, atau pcs."
        actions={
          canManage ? (
            <Button leftIcon={Plus} onClick={() => setFormItem(null)}>
              Tambah Satuan
            </Button>
          ) : null
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={changeFilter(setSearch)} placeholder="Cari nama atau simbol…" />
        <div className="w-full sm:w-44">
          <Select value={isActive} onChange={changeFilter(setIsActive)} options={STATUS_FILTER} />
        </div>
      </FilterBar>

      {units.isError ? (
        <div className="rounded-card border border-line bg-surface shadow-sm">
          <ErrorState message={units.error.message} onRetry={() => units.refetch()} />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={units.data?.data ?? []}
            loading={units.isLoading}
            emptyState={
              <EmptyState
                icon={Ruler}
                title={hasFilter ? 'Tidak ada satuan yang cocok' : 'Belum ada satuan'}
                description={hasFilter ? 'Coba ubah kata kunci atau filter.' : canManage ? 'Tambahkan satuan pertama Anda.' : undefined}
              />
            }
          />
          <Pagination meta={units.data?.meta} onPageChange={setPage} />
        </>
      )}

      {formItem !== undefined ? (
        <UnitFormModal key={formItem?.id ?? 'new'} open onClose={() => setFormItem(undefined)} unit={formItem} />
      ) : null}

      <ConfirmDialog
        open={Boolean(toggleItem)}
        onClose={() => setToggleItem(null)}
        onConfirm={confirmToggle}
        loading={save.isPending}
        title={toggleItem?.is_active ? 'Nonaktifkan satuan?' : 'Aktifkan satuan?'}
        message={
          toggleItem?.is_active
            ? `Satuan ${toggleItem.name} tidak bisa dipilih lagi untuk barang baru. Barang yang sudah memakai satuan ini tidak berubah.`
            : `Satuan ${toggleItem?.name ?? ''} bisa dipilih lagi.`
        }
        confirmLabel={toggleItem?.is_active ? 'Ya, nonaktifkan' : 'Ya, aktifkan'}
        tone={toggleItem?.is_active ? 'danger' : 'primary'}
      />
    </>
  );
}
