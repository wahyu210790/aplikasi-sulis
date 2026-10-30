import { Link, useNavigate } from 'react-router';
import { Boxes, FolderKanban, History, ShoppingCart, TriangleAlert, Wallet } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Card } from '../../../components/ui/Card.jsx';
import { DataTable } from '../../../components/ui/DataTable.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { Money } from '../../../components/ui/Money.jsx';
import { StatCard } from '../../../components/ui/StatCard.jsx';
import { MOVEMENT_TYPES } from '../../../lib/constants.js';
import { formatDate, formatPercent, formatQty, formatRupiah } from '../../../lib/format.js';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// "2026-10" -> "Oktober 2026"
function monthLabel(month) {
  const [year, m] = month.split('-');
  return `${MONTHS[Number(m) - 1]} ${year}`;
}

// Owner / Finance dashboard: totals, top 5 projects by profit, last 10 movements.
export function MoneyDashboard({ data }) {
  const navigate = useNavigate();
  const { totals } = data;

  const projectColumns = [
    {
      key: 'project',
      header: 'Proyek',
      render: (row) => (
        <div className="min-w-0">
          <div className="font-medium text-ink">{row.name}</div>
          <div className="font-mono text-xs text-muted">{row.code}</div>
        </div>
      ),
    },
    {
      key: 'contract_value',
      header: 'Nilai kontrak',
      align: 'right',
      hideOnMobile: true,
      render: (row) => <Money value={row.contract_value} />,
    },
    { key: 'profit', header: 'Laba', align: 'right', render: (row) => <Money value={row.profit} className="font-semibold" /> },
    {
      key: 'margin_percent',
      header: 'Margin',
      align: 'right',
      render: (row) => <span className="tabular-nums">{row.margin_percent === null ? '–' : formatPercent(row.margin_percent)}</span>,
    },
  ];

  const movementColumns = [
    {
      key: 'type',
      header: 'Jenis',
      render: (row) => (
        <div className="min-w-0">
          <Badge tone={MOVEMENT_TYPES[row.type]?.tone ?? 'neutral'}>{row.type_label}</Badge>
          <div className="mt-1 text-xs text-muted">{formatDate(row.movement_date)}</div>
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Barang',
      render: (row) => (
        <div className="min-w-0">
          <div className="text-ink">{row.product.name}</div>
          {row.project ? <div className="font-mono text-xs text-muted">{row.project.code}</div> : null}
        </div>
      ),
    },
    {
      key: 'qty_change',
      header: 'Perubahan',
      align: 'right',
      render: (row) => (
        <span className={row.qty_change.startsWith('-') ? 'text-danger tabular-nums' : 'text-success tabular-nums'}>
          {row.qty_change.startsWith('-') ? '' : '+'}
          {formatQty(row.qty_change, row.product.unit_symbol)}
        </span>
      ),
    },
    { key: 'value_change', header: 'Nilai', align: 'right', render: (row) => <Money value={row.value_change} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <StatCard label="Nilai stok" value={formatRupiah(totals.stock_value)} icon={Wallet} tone="info" />
        <StatCard
          label="Stok menipis"
          value={totals.low_stock_count}
          icon={TriangleAlert}
          tone={totals.low_stock_count > 0 ? 'warning' : 'success'}
          hint="Barang di bawah stok minimum"
        />
        <StatCard label="Proyek aktif" value={totals.active_projects} icon={FolderKanban} tone="primary" />
        <StatCard
          label="Pembelian menunggu"
          value={totals.purchases_waiting}
          icon={ShoppingCart}
          tone="primary"
          hint="Draft, belum diterima"
        />
        <StatCard
          label="Biaya material bulan ini"
          value={formatRupiah(totals.material_cost_this_month)}
          icon={Boxes}
          tone="warning"
          hint={monthLabel(data.month)}
        />
      </div>

      <div className="grid gap-6 2xl:grid-cols-2">
        <Card
          title="5 proyek dengan laba tertinggi"
          padded={false}
          actions={
            <Link to="/laporan?tab=laba" className="-my-3 inline-block py-3 text-sm text-primary hover:underline">
              Lihat laporan
            </Link>
          }
        >
          <DataTable
            columns={projectColumns}
            rows={data.top_projects}
            onRowClick={(row) => navigate(`/proyek/${row.id}`)}
            emptyState={<EmptyState icon={FolderKanban} title="Belum ada proyek" />}
          />
        </Card>
        <Card
          title="10 pergerakan barang terakhir"
          padded={false}
          actions={
            <Link to="/laporan?tab=pergerakan" className="-my-3 inline-block py-3 text-sm text-primary hover:underline">
              Lihat semua
            </Link>
          }
        >
          <DataTable
            columns={movementColumns}
            rows={data.recent_movements}
            emptyState={<EmptyState icon={History} title="Belum ada pergerakan barang" />}
          />
        </Card>
      </div>
    </div>
  );
}
