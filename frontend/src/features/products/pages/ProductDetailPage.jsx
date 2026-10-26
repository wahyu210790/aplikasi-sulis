import { useState } from 'react';
import { useParams } from 'react-router';
import { Boxes, History, Pencil, TriangleAlert, Wallet } from 'lucide-react';
import { useAuth } from '../../../auth/useAuth.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Card } from '../../../components/ui/Card.jsx';
import { DateInput } from '../../../components/ui/DateInput.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { FilterBar } from '../../../components/ui/FilterBar.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { StatCard } from '../../../components/ui/StatCard.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Tabs } from '../../../components/ui/Tabs.jsx';
import { MOVEMENT_TYPES } from '../../../lib/constants.js';
import { formatQty, formatRupiah } from '../../../lib/format.js';
import { can, canSeeMoney } from '../../../lib/permissions.js';
import { useProductMovements } from '../../stock/api.js';
import { MovementsTable } from '../../stock/components/MovementsTable.jsx';
import { useProduct } from '../api.js';
import { ProductFormModal } from '../components/ProductFormModal.jsx';

const TYPE_FILTER = [{ value: '', label: 'Semua jenis' }, ...Object.entries(MOVEMENT_TYPES).map(([value, t]) => ({ value, label: t.label }))];

// "Riwayat" tab: the product's stock ledger, newest first.
function MovementHistory({ productId, unit, showMoney }) {
  const [type, setType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const movements = useProductMovements(productId, { type, date_from: dateFrom, date_to: dateTo, page, per_page: 20 });

  function changeFilter(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <>
      <FilterBar>
        <div className="w-full sm:w-52">
          <Select value={type} onChange={changeFilter(setType)} options={TYPE_FILTER} />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <DateInput value={dateFrom} onChange={changeFilter(setDateFrom)} aria-label="Dari tanggal" className="sm:w-40" />
          <DateInput value={dateTo} onChange={changeFilter(setDateTo)} aria-label="Sampai tanggal" className="sm:w-40" />
        </div>
      </FilterBar>
      {movements.isError ? (
        <div className="rounded-card border border-line bg-surface shadow-sm">
          <ErrorState message={movements.error.message} onRetry={() => movements.refetch()} />
        </div>
      ) : (
        <>
          <MovementsTable
            rows={movements.data?.data ?? []}
            loading={movements.isLoading}
            unit={unit}
            showMoney={showMoney}
            filtered={Boolean(type || dateFrom || dateTo)}
          />
          <Pagination meta={movements.data?.meta} onPageChange={setPage} />
        </>
      )}
    </>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const canManage = can(user, 'products.manage');
  const showMoney = canSeeMoney(user);
  const product = useProduct(id);
  const [tab, setTab] = useState('history');
  const [editing, setEditing] = useState(false);

  const breadcrumb = [{ label: 'Barang', to: '/barang' }, { label: product.data?.data.name ?? 'Detail' }];

  if (product.isLoading) {
    return (
      <>
        <PageHeader title="Detail Barang" breadcrumb={breadcrumb} />
        <div className="flex justify-center py-12 text-muted">
          <Spinner className="h-6 w-6" />
        </div>
      </>
    );
  }

  if (product.isError) {
    return (
      <>
        <PageHeader title="Detail Barang" breadcrumb={breadcrumb} />
        <div className="rounded-card border border-line bg-surface shadow-sm">
          <ErrorState message={product.error.message} onRetry={product.error.status === 404 ? undefined : () => product.refetch()} />
        </div>
      </>
    );
  }

  const item = product.data.data;
  const unit = item.unit.symbol;
  const tabs = [{ key: 'history', label: 'Riwayat' }];
  if (showMoney) tabs.push({ key: 'cost', label: 'Riwayat Harga Modal' });

  return (
    <>
      <PageHeader
        title={item.name}
        subtitle={`SKU ${item.sku}`}
        breadcrumb={breadcrumb}
        actions={
          canManage ? (
            <Button variant="secondary" leftIcon={Pencil} onClick={() => setEditing(true)}>
              Ubah Barang
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Stok saat ini"
          value={formatQty(item.stock.qty, unit)}
          icon={item.is_low_stock ? TriangleAlert : Boxes}
          tone={item.is_low_stock ? 'danger' : 'primary'}
          hint={item.is_low_stock ? 'Stok menipis — sudah di bawah atau sama dengan stok minimum.' : undefined}
        />
        <StatCard
          label="Stok minimum"
          value={formatQty(item.min_stock, unit)}
          icon={History}
          tone="info"
          hint={Number(item.min_stock) > 0 ? undefined : 'Tidak ada peringatan stok menipis.'}
        />
        {showMoney ? (
          <>
            <StatCard
              label="Harga modal rata-rata"
              value={item.stock.has_cost ? formatRupiah(item.stock.avg_cost) : '–'}
              icon={Wallet}
              tone="success"
              hint={item.stock.has_cost ? `per ${unit}` : 'Belum ada harga modal.'}
            />
            <StatCard label="Nilai stok" value={formatRupiah(item.stock.stock_value)} icon={Wallet} tone="success" />
          </>
        ) : null}
      </div>

      <Card title="Informasi barang" className="mt-6">
        <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-muted">Kategori</dt>
            <dd className="mt-1 font-medium text-ink">{item.category.name}</dd>
          </div>
          <div>
            <dt className="text-muted">Satuan</dt>
            <dd className="mt-1 font-medium text-ink">
              {item.unit.name} ({unit})
            </dd>
          </div>
          <div>
            <dt className="text-muted">Status</dt>
            <dd className="mt-1 flex flex-wrap gap-2">
              <StatusBadge kind="user" status={item.is_active ? 'active' : 'inactive'} />
              {item.is_low_stock ? (
                <Badge tone="danger" icon={TriangleAlert}>
                  Menipis
                </Badge>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Catatan</dt>
            <dd className="mt-1 break-words text-ink">{item.notes || '–'}</dd>
          </div>
        </dl>
      </Card>

      <div className="mt-6">
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
        <div className="mt-4">
          {tab === 'history' ? (
            <MovementHistory productId={item.id} unit={unit} showMoney={showMoney} />
          ) : (
            <div className="rounded-card border border-line bg-surface shadow-sm">
              <EmptyState
                icon={Wallet}
                title="Riwayat harga modal belum tersedia"
                description="Perubahan harga modal per pembelian akan tampil di sini bersama laporan harga modal. Sementara itu, lihat kolom Harga modal setelah di tab Riwayat."
              />
            </div>
          )}
        </div>
      </div>

      {editing ? <ProductFormModal key={item.id} open onClose={() => setEditing(false)} product={item} /> : null}
    </>
  );
}
