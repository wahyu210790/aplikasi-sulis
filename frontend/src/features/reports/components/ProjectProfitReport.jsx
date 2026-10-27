import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Boxes, ChartColumn, FolderKanban, Receipt, Wallet } from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { FilterBar } from '../../../components/ui/FilterBar.jsx';
import { Money } from '../../../components/ui/Money.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { StatCard } from '../../../components/ui/StatCard.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { formatPercent, formatRupiah } from '../../../lib/format.js';
import { useProjectProfitReport } from '../api.js';

const STATUS_FILTER = [
  { value: '', label: 'Semua status' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'batal', label: 'Batal' },
];

function margin(value) {
  return value === null || value === undefined ? '–' : formatPercent(value);
}

// "Laba Proyek" (B9.2 GET /reports/project-profit): every project with contract, material, other costs, profit and margin.
export function ProjectProfitReport() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const report = useProjectProfitReport({ status });
  const totals = report.data?.totals;

  const columns = [
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
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge kind="project" status={row.status} />,
    },
    {
      key: 'contract_value',
      header: 'Nilai kontrak',
      align: 'right',
      render: (row) => <Money value={row.contract_value} />,
    },
    {
      key: 'material_cost',
      header: 'Biaya material',
      align: 'right',
      render: (row) => <Money value={row.material_cost} />,
    },
    {
      key: 'other_costs',
      header: 'Biaya lain',
      align: 'right',
      render: (row) => <Money value={row.other_costs} />,
    },
    {
      key: 'profit',
      header: 'Laba',
      align: 'right',
      render: (row) => <Money value={row.profit} className="font-semibold" />,
    },
    {
      key: 'margin_percent',
      header: 'Margin',
      align: 'right',
      render: (row) => <span className="tabular-nums">{margin(row.margin_percent)}</span>,
    },
  ];

  return (
    <>
      <FilterBar>
        <div className="w-full sm:w-44">
          <Select value={status} onChange={setStatus} options={STATUS_FILTER} />
        </div>
      </FilterBar>

      {report.isError ? (
        <div className="rounded-card border border-line bg-surface shadow-sm">
          <ErrorState message={report.error.message} onRetry={() => report.refetch()} />
        </div>
      ) : (
        <div className="space-y-4">
          {totals ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total nilai kontrak" value={formatRupiah(totals.contract_value)} icon={Wallet} tone="info" />
              <StatCard label="Total biaya material" value={formatRupiah(totals.material_cost)} icon={Boxes} tone="warning" />
              <StatCard label="Total biaya lain" value={formatRupiah(totals.other_costs)} icon={Receipt} tone="warning" />
              <StatCard
                label="Total laba"
                value={formatRupiah(totals.profit)}
                icon={ChartColumn}
                tone={totals.profit < 0 ? 'danger' : 'success'}
                hint={`Margin ${margin(totals.margin_percent)}`}
              />
            </div>
          ) : null}
          <DataTable
            columns={columns}
            rows={report.data?.data ?? []}
            loading={report.isLoading}
            onRowClick={(row) => navigate(`/proyek/${row.id}`)}
            emptyState={
              <EmptyState
                icon={FolderKanban}
                title={status ? 'Tidak ada proyek dengan status ini' : 'Belum ada proyek'}
                description="Laba dihitung dari nilai kontrak − biaya material − biaya lain."
              />
            }
          />
        </div>
      )}
    </>
  );
}
