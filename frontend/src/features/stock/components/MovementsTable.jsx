import { Link } from 'react-router';
import { History } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge.jsx';
import { DataTable } from '../../../components/ui/DataTable.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { Money } from '../../../components/ui/Money.jsx';
import { Qty } from '../../../components/ui/Qty.jsx';
import { MOVEMENT_TYPES } from '../../../lib/constants.js';
import { formatDate, formatQty } from '../../../lib/format.js';

// Link to the document page behind a movement (BK- / RT- / PB- numbers), or null.
function documentPath(document) {
  if (!document) return null;
  if (document.kind === 'purchase') return `/pembelian/${document.id}`;
  return document.number.startsWith('RT-') ? `/pengembalian/${document.id}` : `/barang-keluar/${document.id}`;
}

// Ledger rows from GET /products/{id}/movements (docs/desain-v2.md B3.13). Money columns only when showMoney.
export function MovementsTable({ rows, loading, unit, showMoney, filtered = false }) {
  const columns = [
    {
      key: 'type',
      header: 'Jenis',
      render: (row) => (
        <div className="min-w-0">
          <Badge tone={MOVEMENT_TYPES[row.type]?.tone ?? 'neutral'}>{row.type_label}</Badge>
          <div className="mt-1 text-xs font-normal text-muted">{formatDate(row.movement_date)}</div>
          {row.notes ? <div className="mt-1 max-w-xs text-xs font-normal break-words text-muted">{row.notes}</div> : null}
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
      render: (row) =>
        row.project ? (
          <div>
            <div className="font-mono text-xs">{row.project.code}</div>
            {row.person_name ? <div className="text-xs text-muted">{row.person_name}</div> : null}
          </div>
        ) : (
          <span className="text-muted">–</span>
        ),
    },
    {
      key: 'qty_change',
      header: 'Perubahan',
      align: 'right',
      render: (row) => (
        <span className={row.qty_change.startsWith('-') ? 'font-medium text-danger tabular-nums' : 'font-medium text-success tabular-nums'}>
          {row.qty_change.startsWith('-') ? '' : '+'}
          {formatQty(row.qty_change, unit)}
        </span>
      ),
    },
    { key: 'qty_after', header: 'Stok setelah', align: 'right', render: (row) => <Qty value={row.qty_after} unit={unit} /> },
  ];
  if (showMoney) {
    columns.push({ key: 'value_change', header: 'Nilai', align: 'right', render: (row) => <Money value={row.value_change} /> });
    columns.push({ key: 'avg_cost_after', header: 'Harga modal setelah', align: 'right', render: (row) => <Money value={row.avg_cost_after} /> });
  }
  columns.push({ key: 'created_by', header: 'Oleh', hideOnMobile: true, render: (row) => row.created_by?.name ?? '–' });

  return (
    <DataTable
      columns={columns}
      rows={rows}
      loading={loading}
      emptyState={
        <EmptyState
          icon={History}
          title={filtered ? 'Tidak ada riwayat yang cocok' : 'Belum ada riwayat stok'}
          description={filtered ? 'Coba ubah jenis atau tanggal.' : 'Barang masuk, keluar, dan pembatalan akan tercatat di sini.'}
        />
      }
    />
  );
}
