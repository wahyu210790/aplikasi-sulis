import { useState } from 'react';
import { Pencil, Plus, Power, PowerOff, Truck } from 'lucide-react';
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
import { useSaveSupplier, useSuppliers } from '../api.js';
import { SupplierFormModal } from '../components/SupplierFormModal.jsx';

const STATUS_FILTER = [
  { value: '', label: 'Semua status' },
  { value: '1', label: 'Aktif' },
  { value: '0', label: 'Nonaktif' },
];

export default function SuppliersPage() {
  const toast = useToast();
  const canManage = true; // the route is already limited to Owner and Finance (suppliers.manage)
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('');
  const [page, setPage] = useState(1);
  const [formItem, setFormItem] = useState(undefined); // undefined = closed, null = new, object = edit
  const [toggleItem, setToggleItem] = useState(null);

  const suppliers = useSuppliers({ search, is_active: isActive, page, per_page: 20 });
  const save = useSaveSupplier();

  function changeFilter(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  async function confirmToggle() {
    const target = toggleItem;
    try {
      await save.mutateAsync({
        id: target.id,
        name: target.name,
        phone: target.phone,
        address: target.address,
        notes: target.notes,
        is_active: !target.is_active,
      });
      toast.success(target.is_active ? 'Pemasok dinonaktifkan.' : 'Pemasok diaktifkan kembali.');
    } catch (error) {
      toast.error(error.message);
    }
    setToggleItem(null);
  }

  const columns = [
    { key: 'name', header: 'Nama pemasok', render: (row) => <span className="font-medium text-ink">{row.name}</span> },
    { key: 'phone', header: 'Telepon', render: (row) => row.phone || <span className="text-muted">-</span> },
    { key: 'address', header: 'Alamat', hideOnMobile: true, render: (row) => row.address || <span className="text-muted">-</span> },
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
        title="Pemasok"
        subtitle="Toko atau distributor tempat membeli barang."
        actions={
          canManage ? (
            <Button leftIcon={Plus} onClick={() => setFormItem(null)}>
              Tambah Pemasok
            </Button>
          ) : null
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={changeFilter(setSearch)} placeholder="Cari nama atau telepon…" />
        <div className="w-full sm:w-44">
          <Select value={isActive} onChange={changeFilter(setIsActive)} options={STATUS_FILTER} />
        </div>
      </FilterBar>

      {suppliers.isError ? (
        <div className="rounded-card border border-line bg-surface shadow-sm">
          <ErrorState message={suppliers.error.message} onRetry={() => suppliers.refetch()} />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={suppliers.data?.data ?? []}
            loading={suppliers.isLoading}
            emptyState={
              <EmptyState
                icon={Truck}
                title={hasFilter ? 'Tidak ada pemasok yang cocok' : 'Belum ada pemasok'}
                description={hasFilter ? 'Coba ubah kata kunci atau filter.' : canManage ? 'Tambahkan pemasok pertama Anda.' : undefined}
              />
            }
          />
          <Pagination meta={suppliers.data?.meta} onPageChange={setPage} />
        </>
      )}

      {formItem !== undefined ? (
        <SupplierFormModal key={formItem?.id ?? 'new'} open onClose={() => setFormItem(undefined)} supplier={formItem} />
      ) : null}

      <ConfirmDialog
        open={Boolean(toggleItem)}
        onClose={() => setToggleItem(null)}
        onConfirm={confirmToggle}
        loading={save.isPending}
        title={toggleItem?.is_active ? 'Nonaktifkan pemasok?' : 'Aktifkan pemasok?'}
        message={
          toggleItem?.is_active
            ? `Pemasok ${toggleItem.name} tidak bisa dipilih lagi untuk pembelian baru. Data pembelian lama tidak berubah.`
            : `Pemasok ${toggleItem?.name ?? ''} bisa dipilih lagi.`
        }
        confirmLabel={toggleItem?.is_active ? 'Ya, nonaktifkan' : 'Ya, aktifkan'}
        tone={toggleItem?.is_active ? 'danger' : 'primary'}
      />
    </>
  );
}
