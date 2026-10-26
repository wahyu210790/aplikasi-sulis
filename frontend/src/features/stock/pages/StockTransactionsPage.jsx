import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus } from 'lucide-react';
import { useAuth } from '../../../auth/useAuth.js';
import { Button } from '../../../components/ui/Button.jsx';
import { DataTable } from '../../../components/ui/DataTable.jsx';
import { DateInput } from '../../../components/ui/DateInput.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { FilterBar } from '../../../components/ui/FilterBar.jsx';
import { Money } from '../../../components/ui/Money.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import { SearchInput } from '../../../components/ui/SearchInput.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { formatDate } from '../../../lib/format.js';
import { can, canSeeMoney } from '../../../lib/permissions.js';
import { useStockTransactions } from '../api.js';
import { DOC_TYPES } from '../docTypes.js';

const STATUS_FILTER = [
  { value: '', label: 'Semua status' },
  { value: 'posted', label: 'Tercatat' },
  { value: 'reversed', label: 'Dibatalkan' },
];

// List of stock documents of one type: 'project_out' (/barang-keluar) or 'project_return' (/pengembalian).
export default function StockTransactionsPage({ type }) {
  const doc = DOC_TYPES[type];
  const { user } = useAuth();
  const navigate = useNavigate();
  const canCreate = can(user, doc.createAction);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const list = useStockTransactions({ type, search, status, date_from: dateFrom, date_to: dateTo, page, per_page: 20 });

  function changeFilter(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  const columns = [
    {
      key: 'number',
      header: 'Nomor',
      render: (row) => (
        <div>
          <div className="font-mono font-medium text-ink">{row.number}</div>
          <div className="text-xs text-muted">{formatDate(row.transaction_date)}</div>
        </div>
      ),
    },
    {
      key: 'project',
      header: 'Proyek',
      render: (row) => (
        <div className="min-w-0">
          <div className="text-ink">{row.project.name}</div>
          <div className="font-mono text-xs text-muted">{row.project.code}</div>
        </div>
      ),
    },
    { key: 'person_name', header: doc.personLabel },
    { key: 'lines_count', header: 'Jumlah barang', align: 'right', render: (row) => `${row.lines_count} barang` },
  ];
  if (canSeeMoney(user)) {
    columns.push({ key: 'total_value', header: 'Nilai', align: 'right', render: (row) => <Money value={row.total_value} /> });
  }
  columns.push({ key: 'status', header: 'Status', render: (row) => <StatusBadge kind="stock_transaction" status={row.status} /> });

  const hasFilter = Boolean(search || status || dateFrom || dateTo);

  return (
    <>
      <PageHeader
        title={doc.title}
        subtitle={doc.subtitle}
        actions={
          canCreate ? (
            <Button leftIcon={Plus} onClick={() => navigate(`${doc.path}/baru`)}>
              {doc.newLabel}
            </Button>
          ) : null
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={changeFilter(setSearch)} placeholder="Cari nomor atau nama orang…" />
        <div className="w-full sm:w-40">
          <Select value={status} onChange={changeFilter(setStatus)} options={STATUS_FILTER} />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <DateInput value={dateFrom} onChange={changeFilter(setDateFrom)} aria-label="Dari tanggal" className="sm:w-40" />
          <DateInput value={dateTo} onChange={changeFilter(setDateTo)} aria-label="Sampai tanggal" className="sm:w-40" />
        </div>
      </FilterBar>

      {list.isError ? (
        <div className="rounded-card border border-line bg-surface shadow-sm">
          <ErrorState message={list.error.message} onRetry={() => list.refetch()} />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={list.data?.data ?? []}
            loading={list.isLoading}
            onRowClick={(row) => navigate(`${doc.path}/${row.id}`)}
            emptyState={
              <EmptyState
                icon={doc.icon}
                title={hasFilter ? 'Tidak ada dokumen yang cocok' : doc.emptyTitle}
                description={hasFilter ? 'Coba ubah kata kunci, status, atau tanggal.' : undefined}
              />
            }
          />
          <Pagination meta={list.data?.meta} onPageChange={setPage} />
        </>
      )}
    </>
  );
}
