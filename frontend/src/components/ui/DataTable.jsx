import { cn } from '../../lib/cn.js';
import { EmptyState } from './EmptyState.jsx';
import { Skeleton } from './Skeleton.jsx';

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' };

function cellValue(column, row) {
  return column.render ? column.render(row) : row[column.key];
}

// columns: [{ key, header, render?(row), align?: 'left'|'right'|'center', hideOnMobile?: bool, mobileLabel?: string }]
// The FIRST column is the card title on mobile. A column with key 'actions' is shown at the bottom of each mobile card.
// Desktop (md and up) = table. Mobile (< md) = list of cards.
export function DataTable({ columns, rows, loading = false, emptyState, onRowClick, rowKey = 'id' }) {
  if (!loading && rows.length === 0) {
    return (
      <div className="rounded-card border border-line bg-surface shadow-sm">
        {emptyState ?? <EmptyState title="Belum ada data" />}
      </div>
    );
  }

  const [titleColumn, ...otherColumns] = columns;
  const actionsColumn = otherColumns.find((c) => c.key === 'actions');
  const detailColumns = otherColumns.filter((c) => c.key !== 'actions' && !c.hideOnMobile);

  return (
    <>
      <div className="hidden overflow-x-auto rounded-card border border-line bg-surface shadow-sm md:block">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-canvas">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn('px-4 py-3 text-xs font-semibold tracking-wide text-muted uppercase', ALIGN[column.align ?? 'left'])}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading
              ? Array.from({ length: 5 }, (_, i) => (
                  <tr key={`s${i}`}>
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3">
                        <Skeleton className="h-4 w-full max-w-40" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row) => (
                  <tr
                    key={row[rowKey]}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn('transition-colors hover:bg-canvas', onRowClick && 'cursor-pointer')}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn('px-4 py-3 align-middle text-ink', ALIGN[column.align ?? 'left'])}
                        onClick={column.key === 'actions' ? (e) => e.stopPropagation() : undefined}
                      >
                        {cellValue(column, row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {loading
          ? Array.from({ length: 3 }, (_, i) => (
              <li key={`s${i}`} className="rounded-card border border-line bg-surface p-4 shadow-sm">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-3 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-1/2" />
              </li>
            ))
          : rows.map((row) => (
              <li
                key={row[rowKey]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn('rounded-card border border-line bg-surface p-4 shadow-sm', onRowClick && 'cursor-pointer active:bg-canvas')}
              >
                <div className="font-medium text-ink">{cellValue(titleColumn, row)}</div>
                {detailColumns.map((column) => (
                  <div key={column.key} className="mt-2 flex items-start justify-between gap-3 text-sm">
                    <span className="text-muted">{column.mobileLabel ?? column.header}</span>
                    <span className="text-right text-ink">{cellValue(column, row)}</span>
                  </div>
                ))}
                {actionsColumn ? (
                  <div className="mt-3 flex justify-end gap-2 border-t border-line pt-3" onClick={(e) => e.stopPropagation()}>
                    {cellValue(actionsColumn, row)}
                  </div>
                ) : null}
              </li>
            ))}
      </ul>
    </>
  );
}
