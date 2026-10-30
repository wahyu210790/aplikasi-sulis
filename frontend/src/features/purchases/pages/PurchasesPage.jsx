import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../../auth/useAuth.js';
import { Button } from '../../../components/ui/Button.jsx';
import { DataTable } from '../../../components/ui/DataTable.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { FilterBar } from '../../../components/ui/FilterBar.jsx';
import { Money } from '../../../components/ui/Money.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import { SearchInput } from '../../../components/ui/SearchInput.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { formatDate } from '../../../lib/format.js';
import { can, canSeeMoney } from '../../../lib/permissions.js';
import { usePurchases } from '../api.js';

const STATUS_FILTER = [
  { value: '', label: 'Semua status' },
  { value: 'draft', label: 'Draft' },
  { value: 'diterima', label: 'Diterima' },
  { value: 'batal', label: 'Dibatalkan' },
];

export default function PurchasesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canManage = can(user, 'purchases.manage');
  const showMoney = canSeeMoney(user);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const purchases = usePurchases({ search, status, page, per_page: 20 });
  // Gudang never sees cancelled purchases (the API hides them too).
  const statusOptions = showMoney ? STATUS_FILTER : STATUS_FILTER.filter((o) => o.value !== 'batal');

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
          <div className="text-xs text-muted">{formatDate(row.purchase_date)}</div>
        </div>
      ),
    },
    { key: 'supplier', header: 'Pemasok', render: (row) => row.supplier.name },
    { key: 'invoice_no', header: 'No. faktur', hideOnMobile: true, render: (row) => row.invoice_no || <span className="text-muted">-</span> },
    { key: 'items_count', header: 'Jumlah barang', align: 'right', render: (row) => `${row.items_count} barang` },
  ];
  if (showMoney) {
    columns.push({ key: 'total_value', header: 'Total', align: 'right', render: (row) => <Money value={row.total_value} /> });
  }
  columns.push({ key: 'status', header: 'Status', render: (row) => <StatusBadge kind="purchase" status={row.status} /> });

  const hasFilter = Boolean(search || status);

  return (
    <>
      <PageHeader
        title="Pembelian"
        subtitle={canManage ? 'Pembelian barang dari pemasok. Stok bertambah setelah barang diterima gudang.' : 'Pembelian yang menunggu atau sudah diterima gudang.'}
        actions={
          canManage ? (
            <Button leftIcon={Plus} onClick={() => navigate('/pembelian/baru')}>
              Buat Pembelian
            </Button>
          ) : null
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={changeFilter(setSearch)} placeholder="Cari nomor, faktur, atau pemasok…" />
        <div className="w-full sm:w-44">
          <Select value={status} onChange={changeFilter(setStatus)} options={statusOptions} />
        </div>
      </FilterBar>

      {purchases.isError ? (
        <div className="rounded-card border border-line bg-surface shadow-sm">
          <ErrorState message={purchases.error.message} onRetry={() => purchases.refetch()} />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={purchases.data?.data ?? []}
            loading={purchases.isLoading}
            onRowClick={(row) => navigate(`/pembelian/${row.id}`)}
            emptyState={
              <EmptyState
                icon={ShoppingCart}
                title={hasFilter ? 'Tidak ada pembelian yang cocok' : 'Belum ada pembelian'}
                description={hasFilter ? 'Coba ubah kata kunci atau filter.' : canManage ? 'Buat pembelian pertama Anda.' : undefined}
              />
            }
          />
          <Pagination meta={purchases.data?.meta} onPageChange={setPage} />
        </>
      )}
    </>
  );
}
