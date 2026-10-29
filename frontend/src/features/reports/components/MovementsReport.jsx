import { useState } from 'react';
import { Link } from 'react-router';
import { History } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge.jsx';
import { ComboBox } from '../../../components/ui/ComboBox.jsx';
import { DataTable } from '../../../components/ui/DataTable.jsx';
import { DateInput } from '../../../components/ui/DateInput.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { FilterBar } from '../../../components/ui/FilterBar.jsx';
import { Money } from '../../../components/ui/Money.jsx';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { MOVEMENT_TYPES } from '../../../lib/constants.js';
import { formatDate, formatQty } from '../../../lib/format.js';
import { useDebouncedValue } from '../../../lib/useDebouncedValue.js';
import { useProjects } from '../../projects/api.js';
import { ProductPicker } from '../../stock/components/ProductPicker.jsx';
import { useMovementsReport } from '../api.js';

const TYPE_FILTER = [
  { value: '', label: 'Semua jenis' },
  ...Object.entries(MOVEMENT_TYPES).map(([value, t]) => ({
    value,
    label: t.label,
  })),
];

// Link to the document page behind a movement (BK- / RT- / PB- / SO- numbers), or null.
function documentPath(document) {
  if (!document) return null;
  if (document.kind === 'purchase') return `/pembelian/${document.id}`;
  if (document.kind === 'stock_opname') return `/stok-opname/${document.id}`;
  return document.number.startsWith('RT-') ? `/pengembalian/${document.id}` : `/barang-keluar/${document.id}`;
}

function projectOption(project) {
  return {
    value: project.id,
    label: `${project.code} — ${project.name}`,
    project,
  };
}

// Searchable project filter (any status).
function ProjectFilter({ value, onChange }) {
  const [query, setQuery] = useState('');
  const search = useDebouncedValue(query, 300);
  const projects = useProjects({ search, per_page: 20 });

  return (
    <ComboBox
      id="movements-project"
      value={value ? projectOption(value) : null}
      onChange={(option) => onChange(option?.project ?? null)}
      options={(projects.data?.data ?? []).map(projectOption)}
      onQueryChange={setQuery}
      loading={projects.isFetching}
      placeholder="Semua proyek"
      emptyText="Proyek tidak ditemukan"
    />
  );
}

// "Pergerakan Barang" (B9.2 GET /reports/movements): every stock movement, newest first.
// Every role. Money columns only when showMoney (the API leaves money keys out for Gudang).
export function MovementsReport({ showMoney }) {
  const [type, setType] = useState('');
  const [product, setProduct] = useState(null);
  const [project, setProject] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const movements = useMovementsReport({
    type,
    product_id: product?.id,
    project_id: project?.id,
    date_from: dateFrom,
    date_to: dateTo,
    page,
    per_page: 20,
  });
  const filtered = Boolean(type || product || project || dateFrom || dateTo);

  function changeFilter(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  const columns = [
    {
      key: 'type',
      header: 'Jenis',
      render: (row) => (
        <div className="min-w-0">
          <Badge tone={MOVEMENT_TYPES[row.type]?.tone ?? 'neutral'}>{row.type_label}</Badge>
          <div className="mt-1 text-xs font-normal text-muted">{formatDate(row.movement_date)}</div>
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Barang',
      render: (row) => (
        <div className="min-w-0">
          <Link to={`/barang/${row.product.id}`} className="text-ink hover:text-primary hover:underline">
            {row.product.name}
          </Link>
          <div className="font-mono text-xs text-muted">{row.product.sku}</div>
        </div>
      ),
    },
    {
      key: 'document',
      header: 'Dokumen',
      render: (row) => {
        const path = documentPath(row.document);
        return path ? (
          <Link to={path} className="font-mono text-primary hover:underline">
            {row.document.number}
          </Link>
        ) : (
          <span className="text-muted">–</span>
        );
      },
    },
    {
      key: 'project',
      header: 'Proyek',
      hideOnMobile: true,
      render: (row) =>
        row.project ? <span className="font-mono text-xs">{row.project.code}</span> : <span className="text-muted">–</span>,
    },
    {
      key: 'qty_change',
      header: 'Perubahan',
      align: 'right',
      render: (row) => (
        <span className={row.qty_change.startsWith('-') ? 'font-medium text-danger tabular-nums' : 'font-medium text-success tabular-nums'}>
          {row.qty_change.startsWith('-') ? '' : '+'}
          {formatQty(row.qty_change, row.product.unit_symbol)}
        </span>
      ),
    },
  ];
  if (showMoney) {
    columns.push({
      key: 'value_change',
      header: 'Nilai',
      align: 'right',
      render: (row) => <Money value={row.value_change} />,
    });
  }
  columns.push({
    key: 'created_by',
    header: 'Oleh',
    hideOnMobile: true,
    render: (row) => row.created_by?.name ?? '–',
  });

  return (
    <>
      <FilterBar>
        <div className="w-full sm:w-48">
          <Select value={type} onChange={changeFilter(setType)} options={TYPE_FILTER} />
        </div>
        <div className="w-full sm:w-64">
          <ProductPicker id="movements-product" value={product} onChange={changeFilter(setProduct)} />
        </div>
        <div className="w-full sm:w-64">
          <ProjectFilter value={project} onChange={changeFilter(setProject)} />
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
          <DataTable
            columns={columns}
            rows={movements.data?.data ?? []}
            loading={movements.isLoading}
            emptyState={
              <EmptyState
                icon={History}
                title={filtered ? 'Tidak ada pergerakan yang cocok' : 'Belum ada pergerakan barang'}
                description={filtered ? 'Coba ubah filter.' : 'Barang masuk, keluar, dan pembatalan akan tercatat di sini.'}
              />
            }
          />
          <Pagination meta={movements.data?.meta} onPageChange={setPage} />
        </>
      )}
    </>
  );
}
