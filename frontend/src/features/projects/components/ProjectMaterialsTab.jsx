import { Boxes } from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { Money } from '../../../components/ui/Money.jsx';
import { Qty } from '../../../components/ui/Qty.jsx';
import { useProjectMaterials } from '../api.js';

// Material per product of one project (B9.2). Gudang sees quantities only: the API removes net_value and totals.
export function ProjectMaterialsTab({ projectId, showMoney }) {
  const materials = useProjectMaterials(projectId);

  if (materials.isError) {
    return (
      <div className="rounded-card border border-line bg-surface shadow-sm">
        <ErrorState message={materials.error.message} onRetry={() => materials.refetch()} />
      </div>
    );
  }

  const columns = [
    {
      key: 'product',
      header: 'Barang',
      render: (row) => (
        <div className="min-w-0">
          <div className="font-medium text-ink">{row.product.name}</div>
          <div className="font-mono text-xs text-muted">{row.product.sku}</div>
        </div>
      ),
    },
    { key: 'qty_out', header: 'Keluar', align: 'right', render: (row) => <Qty value={row.qty_out} unit={row.product.unit_symbol} /> },
    { key: 'qty_returned', header: 'Kembali', align: 'right', render: (row) => <Qty value={row.qty_returned} unit={row.product.unit_symbol} /> },
    {
      key: 'net_qty',
      header: 'Terpakai (bersih)',
      align: 'right',
      render: (row) => <Qty value={row.net_qty} unit={row.product.unit_symbol} className="font-medium" />,
    },
  ];
  if (showMoney) {
    columns.push({ key: 'net_value', header: 'Nilai material', align: 'right', render: (row) => <Money value={row.net_value} /> });
  }

  const rows = (materials.data?.data ?? []).map((row) => ({ ...row, id: row.product.id }));
  const total = materials.data?.totals?.net_value;

  return (
    <div className="space-y-3">
      <DataTable
        columns={columns}
        rows={rows}
        loading={materials.isLoading}
        emptyState={
          <EmptyState icon={Boxes} title="Belum ada material" description="Barang yang dikirim ke proyek ini lewat Barang Keluar akan tampil di sini." />
        }
      />
      {showMoney && rows.length > 0 ? (
        <div className="flex items-center justify-between rounded-card border border-line bg-surface px-4 py-3 text-sm shadow-sm">
          <span className="text-muted">Total biaya material (harga modal saat keluar, dikurangi pengembalian)</span>
          <Money value={total} className="font-semibold text-ink" />
        </div>
      ) : null}
    </div>
  );
}
