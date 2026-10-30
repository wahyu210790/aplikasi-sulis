import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal.jsx';
import { cn } from '../../../lib/cn.js';
import { formatDateTime } from '../../../lib/format.js';
import { actorName, changeRows } from '../fields.js';
import { actionLabel } from '../labels.js';

// Before/after table with Indonesian field names. An edit lists only the changed fields (QA bug #10);
// "Tampilkan semua data" also lists the unchanged ones.
function ChangesTable({ changes }) {
  const [showAll, setShowAll] = useState(false);
  const { rows, hasBefore, total } = changeRows(changes, { showAll });
  if (total === 0) return <p className="text-sm text-muted">Tidak ada rincian perubahan.</p>;

  return (
    <div className="space-y-2">
      {rows.length === 0 ? (
        <p className="text-sm text-muted">Tidak ada data yang berubah.</p>
      ) : (
        <div className="overflow-x-auto rounded-control border border-line">
          <table className="min-w-full divide-y divide-line text-sm">
            <thead className="bg-canvas">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-muted uppercase">Data</th>
                {hasBefore ? <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-muted uppercase">Sebelum</th> : null}
                <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-muted uppercase">{hasBefore ? 'Sesudah' : 'Isi'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => (
                <tr key={row.key} className={cn(showAll && row.changed && 'bg-warning-soft')}>
                  <td className="px-3 py-2 align-top text-muted">{row.label}</td>
                  {hasBefore ? <td className="max-w-[16rem] px-3 py-2 align-top break-words whitespace-pre-wrap">{row.before}</td> : null}
                  <td className="max-w-[16rem] px-3 py-2 align-top break-words whitespace-pre-wrap">{row.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {hasBefore && total > 0 ? (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="min-h-11 text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {showAll ? 'Tampilkan yang berubah saja' : 'Tampilkan semua data'}
        </button>
      ) : null}
    </div>
  );
}

export function AuditLogDetailModal({ log, onClose }) {
  return (
    <Modal open={Boolean(log)} onClose={onClose} title={log ? actionLabel(log.action) : ''} description={log?.summary} size="lg">
      {log ? (
        <div className="space-y-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Waktu</dt>
              <dd className="mt-1 font-medium text-ink">{formatDateTime(log.created_at)}</dd>
            </div>
            <div>
              <dt className="text-muted">Pengguna</dt>
              <dd className="mt-1 font-medium text-ink">{actorName(log.user)}</dd>
            </div>
            <div>
              <dt className="text-muted">Alamat IP</dt>
              <dd className="mt-1 font-mono text-xs text-ink">{log.ip || '–'}</dd>
            </div>
          </dl>
          <ChangesTable key={log.id} changes={log.changes} />
        </div>
      ) : null}
    </Modal>
  );
}
