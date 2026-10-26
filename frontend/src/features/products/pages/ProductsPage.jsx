import { useState } from 'react';
import { useNavigate } from 'react-router';
import { FileSpreadsheet, Package, Pencil, Plus, TriangleAlert } from 'lucide-react';
import { useAuth } from '../../../auth/useAuth.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { DataTable } from '../../../components/ui/DataTable.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { FilterBar } from '../../../components/ui/FilterBar.jsx';
import { IconButton } from '../../../components/ui/IconButton.jsx';
import { Money } from '../../../components/ui/Money.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import { Qty } from '../../../components/ui/Qty.jsx';
import { SearchInput } from '../../../components/ui/SearchInput.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { can, canSeeMoney } from '../../../lib/permissions.js';
import { useCategories } from '../../master/api.js';
import { useProducts } from '../api.js';
import { ProductFormModal } from '../components/ProductFormModal.jsx';

const STATUS_FILTER = [
  { value: '', label: 'Semua status' },
  { value: '1', label: 'Aktif' },
  { value: '0', label: 'Nonaktif' },
];

const STOCK_FILTER = [
  { value: '', label: 'Semua stok' },
  { value: '1', label: 'Stok menipis' },
];

export default function ProductsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canManage = can(user, 'products.manage');
  const canImport = can(user, 'products.import');
  const showMoney = canSeeMoney(user);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isActive, setIsActive] = useState('');
  const [lowStock, setLowStock] = useState('');
  const [page, setPage] = useState(1);
  const [formItem, setFormItem] = useState(undefined); // undefined = closed, null = new, object = edit

  const products = useProducts({ search, category_id: categoryId, is_active: isActive, low_stock: lowStock, page, per_page: 20 });
  const categories = useCategories({ all: 1 });
  const categoryFilter = [
    { value: '', label: 'Semua kategori' },
    ...(categories.data?.data ?? []).map((c) => ({ value: String(c.id), label: c.name })),
  ];

  function changeFilter(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  const columns = [
    { key: 'sku', header: 'SKU', render: (row) => <span className="font-mono text-sm">{row.sku}</span> },
    {
      key: 'name',
      header: 'Nama barang',
      render: (row) => (
        <div className="min-w-0">
          <div className="font-medium text-ink">{row.name}</div>
          <div className="text-xs text-muted">{row.category.name}</div>
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stok',
      align: 'right',
      render: (row) => (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Qty value={row.stock.qty} unit={row.unit.symbol} />
          {row.is_low_stock ? (
            <Badge tone="danger" icon={TriangleAlert}>
              Menipis
            </Badge>
          ) : null}
        </div>
      ),
    },
  ];
  if (showMoney) {
    columns.push({ key: 'stock_value', header: 'Nilai stok', align: 'right', hideOnMobile: true, render: (row) => <Money value={row.stock.stock_value} /> });
  }
  columns.push({ key: 'status', header: 'Status', hideOnMobile: true, render: (row) => <StatusBadge kind="user" status={row.is_active ? 'active' : 'inactive'} /> });
  if (canManage) {
    columns.push({
      key: 'actions',
      header: 'Aksi',
      align: 'right',
      render: (row) => <IconButton icon={Pencil} label="Ubah" onClick={() => setFormItem(row)} />,
    });
  }

  const hasFilter = Boolean(search || categoryId || isActive || lowStock);

  return (
    <>
      <PageHeader
        title="Barang"
        subtitle="Daftar barang di gudang beserta stoknya."
        actions={
          <>
            {canImport ? (
              <Button variant="secondary" leftIcon={FileSpreadsheet} onClick={() => navigate('/barang/impor')}>
                Impor Excel
              </Button>
            ) : null}
            {canManage ? (
              <Button leftIcon={Plus} onClick={() => setFormItem(null)}>
                Tambah Barang
              </Button>
            ) : null}
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={changeFilter(setSearch)} placeholder="Cari SKU atau nama barang…" />
        <div className="w-full sm:w-48">
          <Select value={categoryId} onChange={changeFilter(setCategoryId)} options={categoryFilter} />
        </div>
        <div className="w-full sm:w-40">
          <Select value={lowStock} onChange={changeFilter(setLowStock)} options={STOCK_FILTER} />
        </div>
        <div className="w-full sm:w-40">
          <Select value={isActive} onChange={changeFilter(setIsActive)} options={STATUS_FILTER} />
        </div>
      </FilterBar>

      {products.isError ? (
        <div className="rounded-card border border-line bg-surface shadow-sm">
          <ErrorState message={products.error.message} onRetry={() => products.refetch()} />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={products.data?.data ?? []}
            loading={products.isLoading}
            onRowClick={(row) => navigate(`/barang/${row.id}`)}
            emptyState={
              <EmptyState
                icon={Package}
                title={hasFilter ? 'Tidak ada barang yang cocok' : 'Belum ada barang'}
                description={hasFilter ? 'Coba ubah kata kunci atau filter.' : canManage ? 'Tambahkan barang pertama Anda.' : undefined}
              />
            }
          />
          <Pagination meta={products.data?.meta} onPageChange={setPage} />
        </>
      )}

      {formItem !== undefined ? (
        <ProductFormModal key={formItem?.id ?? 'new'} open onClose={() => setFormItem(undefined)} product={formItem} />
      ) : null}
    </>
  );
}
