import { useState } from 'react';
import { useParams } from 'react-router';
import { Boxes, History, Pencil, TriangleAlert, Wallet } from 'lucide-react';
import { useAuth } from '../../../auth/useAuth.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Card } from '../../../components/ui/Card.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { StatCard } from '../../../components/ui/StatCard.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Tabs } from '../../../components/ui/Tabs.jsx';
import { formatQty, formatRupiah } from '../../../lib/format.js';
import { can, canSeeMoney } from '../../../lib/permissions.js';
import { useProduct } from '../api.js';
import { ProductFormModal } from '../components/ProductFormModal.jsx';

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
        <div className="mt-4 rounded-card border border-line bg-surface shadow-sm">
          {tab === 'history' ? (
            <EmptyState
              icon={History}
              title="Belum ada riwayat stok"
              description="Riwayat barang masuk, keluar, dan penyesuaian akan tampil di sini setelah fitur transaksi stok tersedia."
            />
          ) : (
            <EmptyState
              icon={Wallet}
              title="Belum ada riwayat harga modal"
              description="Perubahan harga modal dari setiap pembelian akan tampil di sini setelah fitur pembelian tersedia."
            />
          )}
        </div>
      </div>

      {editing ? <ProductFormModal key={item.id} open onClose={() => setEditing(false)} product={item} /> : null}
    </>
  );
}
