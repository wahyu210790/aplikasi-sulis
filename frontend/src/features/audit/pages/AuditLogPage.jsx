import { useState } from 'react';
import { History } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge.jsx';
import { DataTable } from '../../../components/ui/DataTable.jsx';
import { DateInput } from '../../../components/ui/DateInput.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { FilterBar } from '../../../components/ui/FilterBar.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { ROLE_LABELS } from '../../../lib/constants.js';
import { dateRangeError } from '../../../lib/dateRange.js';
import { formatDateTime } from '../../../lib/format.js';
import { useUsers } from '../../users/api.js';
import { useAuditLogs } from '../api.js';
import { AuditLogDetailModal } from '../components/AuditLogDetailModal.jsx';
import { ACTION_GROUPS, actionLabel, isFailure } from '../labels.js';

// Log Aktivitas — docs/desain-v2.md B8 / B12.4. Owner only. Click a row to see the before/after details.
export default function AuditLogPage() {
  const [userId, setUserId] = useState('');
  const [action, setAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const users = useUsers({ per_page: 100 });
  const rangeError = dateRangeError(dateFrom, dateTo);
  const logs = useAuditLogs({ user_id: userId, action, date_from: dateFrom, date_to: dateTo, page, per_page: 25 }, { enabled: !rangeError });

  function changeFilter(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  const userOptions = [{ value: '', label: 'Semua pengguna' }, ...(users.data?.data ?? []).map((u) => ({ value: String(u.id), label: u.name }))];
  const actionOptions = [{ value: '', label: 'Semua aktivitas' }, ...ACTION_GROUPS];

  const columns = [
    { key: 'created_at', header: 'Waktu', render: (row) => <span className="whitespace-nowrap text-muted">{formatDateTime(row.created_at)}</span> },
    {
      key: 'user',
      header: 'Pengguna',
      hideOnMobile: true,
      render: (row) =>
        row.user ? (
          <div>
            <div className="text-ink">{row.user.name}</div>
            <div className="text-xs text-muted">{ROLE_LABELS[row.user.role] ?? row.user.role}</div>
          </div>
        ) : (
          <span className="text-muted">Sistem</span>
        ),
    },
    {
      key: 'action',
      header: 'Aktivitas',
      render: (row) => <Badge tone={isFailure(row.action) ? 'danger' : 'neutral'}>{actionLabel(row.action)}</Badge>,
    },
    { key: 'summary', header: 'Ringkasan', render: (row) => <span className="break-words">{row.summary}</span> },
  ];

  const hasFilter = Boolean(userId || action || dateFrom || dateTo);

  return (
    <>
      <PageHeader title="Log Aktivitas" subtitle="Catatan semua perubahan data dan aktivitas masuk. Klik baris untuk melihat rinciannya." />

      <FilterBar>
        <div className="w-full sm:w-52">
          <Select value={userId} onChange={changeFilter(setUserId)} options={userOptions} />
        </div>
        <div className="w-full sm:w-52">
          <Select value={action} onChange={changeFilter(setAction)} options={actionOptions} />
        </div>
        <DateInput
          value={dateFrom}
          onChange={changeFilter(setDateFrom)}
          max={dateTo || undefined}
          invalid={Boolean(rangeError)}
          aria-label="Dari tanggal"
          className="sm:w-40"
        />
        <DateInput
          value={dateTo}
          onChange={changeFilter(setDateTo)}
          min={dateFrom || undefined}
          invalid={Boolean(rangeError)}
          aria-label="Sampai tanggal"
          className="sm:w-40"
        />
      </FilterBar>

      {rangeError ? (
        <p role="alert" className="rounded-card border border-line bg-danger-soft px-4 py-3 text-sm text-danger">
          {rangeError}
        </p>
      ) : logs.isError ? (
        <div className="rounded-card border border-line bg-surface shadow-sm">
          <ErrorState message={logs.error.message} onRetry={() => logs.refetch()} />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={logs.data?.data ?? []}
            loading={logs.isLoading}
            onRowClick={setSelected}
            emptyState={
              <EmptyState
                icon={History}
                title={hasFilter ? 'Tidak ada aktivitas yang cocok' : 'Belum ada aktivitas'}
                description={hasFilter ? 'Coba ubah filter.' : undefined}
              />
            }
          />
          <Pagination meta={logs.data?.meta} onPageChange={setPage} />
        </>
      )}

      <AuditLogDetailModal log={selected} onClose={() => setSelected(null)} />
    </>
  );
}
