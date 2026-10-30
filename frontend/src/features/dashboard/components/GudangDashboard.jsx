import { Link, useNavigate } from 'react-router';
import { ClipboardList, PackageCheck, ShoppingCart, TriangleAlert } from 'lucide-react';
import { Card } from '../../../components/ui/Card.jsx';
import { DataTable } from '../../../components/ui/DataTable.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { Qty } from '../../../components/ui/Qty.jsx';
import { StatCard } from '../../../components/ui/StatCard.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { formatDate } from '../../../lib/format.js';

function transactionPath(row) {
  return row.type === 'project_return' ? `/pengembalian/${row.id}` : `/barang-keluar/${row.id}`;
}

// Gudang dashboard: low stock, purchases waiting to be received, last 10 stock transactions. No money anywhere.
export function GudangDashboard({ data }) {
  const navigate = useNavigate();

  const lowStockColumns = [
    {
      key: 'name',
      header: 'Barang',
      render: (row) => (
        <div className="min-w-0">
          <div className="font-medium text-ink">{row.name}</div>
          <div className="font-mono text-xs text-muted">{row.sku}</div>
        </div>
      ),
    },
    {
      key: 'qty',
      header: 'Stok',
      align: 'right',
      render: (row) => <Qty value={row.qty} unit={row.unit_symbol} className="font-medium text-danger" />,
    },
    { key: 'min_stock', header: 'Minimum', align: 'right', render: (row) => <Qty value={row.min_stock} unit={row.unit_symbol} /> },
  ];

  const purchaseColumns = [
    {
      key: 'number',
      header: 'Nomor',
      render: (row) => (
        <div className="min-w-0">
          <div className="font-mono font-medium text-ink">{row.number}</div>
          <div className="text-xs text-muted">{row.supplier.name}</div>
        </div>
      ),
    },
    { key: 'purchase_date', header: 'Tanggal', align: 'right', render: (row) => formatDate(row.purchase_date) },
  ];

  const transactionColumns = [
    {
      key: 'number',
      header: 'Nomor',
      render: (row) => (
        <div className="min-w-0">
          <div className="font-mono font-medium text-ink">{row.number}</div>
          <div className="text-xs text-muted">{row.type_label}</div>
        </div>
      ),
    },
    {
      key: 'project',
      header: 'Proyek',
      render: (row) => (
        <div className="min-w-0">
          <div className="font-mono text-xs">{row.project.code}</div>
          <div className="text-xs text-muted">{formatDate(row.transaction_date)}</div>
        </div>
      ),
    },
    { key: 'status', header: 'Status', align: 'right', render: (row) => <StatusBadge kind="stock_transaction" status={row.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Stok menipis"
          value={data.low_stock_count}
          icon={TriangleAlert}
          tone={data.low_stock_count > 0 ? 'warning' : 'success'}
          hint="Barang di bawah stok minimum"
        />
        <StatCard label="Pembelian menunggu diterima" value={data.purchases_waiting_count} icon={ShoppingCart} tone="primary" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card
          title="Stok menipis"
          padded={false}
          actions={
            <Link to="/barang" className="-my-3 inline-block py-3 text-sm text-primary hover:underline">
              Lihat barang
            </Link>
          }
        >
          <DataTable
            columns={lowStockColumns}
            rows={data.low_stock}
            onRowClick={(row) => navigate(`/barang/${row.id}`)}
            emptyState={<EmptyState icon={PackageCheck} title="Semua stok aman" description="Tidak ada barang di bawah stok minimum." />}
          />
        </Card>
        <Card title="Pembelian menunggu diterima" padded={false}>
          <DataTable
            columns={purchaseColumns}
            rows={data.purchases_waiting}
            onRowClick={(row) => navigate(`/pembelian/${row.id}`)}
            emptyState={<EmptyState icon={ShoppingCart} title="Tidak ada pembelian yang menunggu" />}
          />
        </Card>
      </div>

      <Card title="10 transaksi stok terakhir" padded={false}>
        <DataTable
          columns={transactionColumns}
          rows={data.recent_transactions}
          onRowClick={(row) => navigate(transactionPath(row))}
          emptyState={<EmptyState icon={ClipboardList} title="Belum ada transaksi stok" />}
        />
      </Card>
    </div>
  );
}
