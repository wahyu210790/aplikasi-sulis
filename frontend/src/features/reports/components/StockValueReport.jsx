import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Package, Wallet } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge.jsx';
import { DataTable } from '../../../components/ui/DataTable.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { FilterBar } from '../../../components/ui/FilterBar.jsx';
import { Money } from '../../../components/ui/Money.jsx';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import { Qty } from '../../../components/ui/Qty.jsx';
import { SearchInput } from '../../../components/ui/SearchInput.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { StatCard } from '../../../components/ui/StatCard.jsx';
import { formatRupiah } from '../../../lib/format.js';
import { useStockValueReport } from '../api.js';
import { ExportButton } from './ExportButton.jsx';

const ACTIVE_FILTER = [
  { value: '', label: 'Semua barang' },
  { value: '1', label: 'Aktif' },
  { value: '0', label: 'Nonaktif' },
];

// "Nilai Stok" (B9.2 GET /reports/stock-value): qty × average cost per product, plus the total of all matching products.
export function StockValueReport() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('');
  const [page, setPage] = useState(1);
  const report = useStockValueReport({
    search,
    is_active: isActive,
    page,
    per_page: 20,
  });

  function changeFilter(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  const columns = [
    {
      key: 'product',
      header: 'Barang',
      render: (row) => (
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 font-medium text-ink">
            {row.product.name}
            {row.product.is_active ? null : <Badge>Nonaktif</Badge>}
          </div>
          <div className="font-mono text-xs text-muted">{row.product.sku}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Kategori',
      hideOnMobile: true,
      render: (row) => row.product.category_name,
    },
    {
      key: 'qty',
      header: 'Stok',
      align: 'right',
      render: (row) => <Qty value={row.qty} unit={row.product.unit_symbol} />,
    },
    {
      key: 'avg_cost',
      header: 'Harga modal rata-rata',
      align: 'right',
      render: (row) => (row.has_cost ? <Money value={row.avg_cost} /> : <span className="text-muted">Belum ada</span>),
    },
    {
      key: 'stock_value',
      header: 'Nilai stok',
      align: 'right',
      render: (row) => <Money value={row.stock_value} className="font-medium" />,
    },
  ];

  const rows = (report.data?.data ?? []).map((row) => ({
    ...row,
    id: row.product.id,
  }));
  const total = report.data?.totals?.stock_value;

  return (
    <>
      <FilterBar>
        <SearchInput value={search} onChange={changeFilter(setSearch)} placeholder="Cari nama atau SKU…" />
        <div className="w-full sm:w-44">
          <Select value={isActive} onChange={changeFilter(setIsActive)} options={ACTIVE_FILTER} />
        </div>
        <ExportButton report="stock-value" params={{ search, is_active: isActive }} fileName="nilai-stok" />
      </FilterBar>

      {report.isError ? (
        <div className="rounded-card border border-line bg-surface shadow-sm">
          <ErrorState message={report.error.message} onRetry={() => report.refetch()} />
        </div>
      ) : (
        <div className="space-y-4">
          {total !== undefined ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                label="Total nilai stok"
                value={formatRupiah(total)}
                icon={Wallet}
                tone="info"
                hint="Semua barang yang cocok dengan filter."
              />
            </div>
          ) : null}
          <DataTable
            columns={columns}
            rows={rows}
            loading={report.isLoading}
            onRowClick={(row) => navigate(`/barang/${row.product.id}`)}
            emptyState={<EmptyState icon={Package} title={search || isActive ? 'Tidak ada barang yang cocok' : 'Belum ada barang'} />}
          />
          <Pagination meta={report.data?.meta} onPageChange={setPage} />
        </div>
      )}
    </>
  );
}
