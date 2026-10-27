import { Link } from 'react-router';
import { Wallet } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge.jsx';
import { DataTable } from '../../../components/ui/DataTable.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { Money } from '../../../components/ui/Money.jsx';
import { Qty } from '../../../components/ui/Qty.jsx';
import { MOVEMENT_TYPES } from '../../../lib/constants.js';
import { formatDate } from '../../../lib/format.js';

// Rows from GET /reports/cost-history or GET /products/{id}/cost-history (Owner/Finance only).
// showProduct: add the product column (the report over all products).
export function CostHistoryTable({ rows, loading, showProduct = false, filtered = false }) {
  const columns = [
    {
      key: 'type',
      header: 'Tanggal',
      render: (row) => (
        <div className="min-w-0">
          <div className="font-medium text-ink">{formatDate(row.movement_date)}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            <Badge tone={MOVEMENT_TYPES[row.type]?.tone ?? 'neutral'}>{row.type_label}</Badge>
            {row.reversed ? <Badge tone="danger">Dibatalkan</Badge> : null}
          </div>
        </div>
      ),
    },
  ];
  if (showProduct) {
    columns.push({
      key: 'product',
      header: 'Barang',
      render: (row) => (
        <div className="min-w-0">
          <div className="text-ink">{row.product.name}</div>
          <div className="font-mono text-xs text-muted">{row.product.sku}</div>
        </div>
      ),
    });
  }
  columns.push(
    {
      key: 'source',
      header: 'Pemasok / dokumen',
      render: (row) =>
        row.purchase ? (
          <div>
            <Link to={`/pembelian/${row.purchase.id}`} className="font-mono text-primary hover:underline">
              {row.purchase.number}
            </Link>
            {row.supplier ? <div className="text-xs text-muted">{row.supplier.name}</div> : null}
          </div>
        ) : (
          <span className="text-muted">Stok awal</span>
        ),
    },
    {
      key: 'qty',
      header: 'Jumlah',
      align: 'right',
      render: (row) => <Qty value={row.qty} unit={row.product.unit_symbol} />,
    },
    {
      key: 'unit_cost',
      header: 'Harga beli',
      align: 'right',
      render: (row) => <Money value={row.unit_cost} />,
    },
    {
      key: 'avg_cost_after',
      header: 'Harga modal rata-rata setelahnya',
      align: 'right',
      render: (row) => <Money value={row.avg_cost_after} className="font-medium" />,
    },
  );

  return (
    <DataTable
      columns={columns}
      rows={rows}
      loading={loading}
      emptyState={
        <EmptyState
          icon={Wallet}
          title={filtered ? 'Tidak ada riwayat yang cocok' : 'Belum ada riwayat harga modal'}
          description={filtered ? 'Coba ubah barang atau tanggal.' : 'Stok awal dan pembelian yang diterima akan tampil di sini.'}
        />
      }
    />
  );
}
