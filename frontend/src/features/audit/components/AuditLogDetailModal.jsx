import { Modal } from '../../../components/ui/Modal.jsx';
import { ROLE_LABELS } from '../../../lib/constants.js';
import { cn } from '../../../lib/cn.js';
import { formatDateTime } from '../../../lib/format.js';
import { actionLabel } from '../labels.js';

// Shows a value from changes.before / changes.after as plain text (lists and objects as JSON).
function show(value) {
  if (value === undefined || value === null || value === '') return '–';
  if (typeof value === 'boolean') return value ? 'ya' : 'tidak';
  if (typeof value === 'object') return JSON.stringify(value, null, 1);
  return String(value);
}

// Before/after table: one row per field, changed fields highlighted.
function ChangesTable({ changes }) {
  const before = changes?.before ?? {};
  const after = changes?.after ?? {};
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  if (keys.length === 0) return <p className="text-sm text-muted">Tidak ada rincian perubahan.</p>;

  return (
    <div className="overflow-x-auto rounded-control border border-line">
      <table className="min-w-full divide-y divide-line text-sm">
        <thead className="bg-canvas">
          <tr>
            <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-muted uppercase">Data</th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-muted uppercase">Sebelum</th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-muted uppercase">Sesudah</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {keys.map((key) => {
            const changed = JSON.stringify(before[key]) !== JSON.stringify(after[key]);
            return (
              <tr key={key} className={cn(changed && 'bg-warning-soft')}>
                <td className="px-3 py-2 align-top font-mono text-xs text-muted">{key}</td>
                <td className="max-w-[16rem] px-3 py-2 align-top break-words whitespace-pre-wrap">{show(before[key])}</td>
                <td className="max-w-[16rem] px-3 py-2 align-top break-words whitespace-pre-wrap">{show(after[key])}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
              <dd className="mt-1 font-medium text-ink">{log.user ? `${log.user.name} (${ROLE_LABELS[log.user.role] ?? log.user.role})` : '–'}</dd>
            </div>
            <div>
              <dt className="text-muted">Kode aktivitas</dt>
              <dd className="mt-1 font-mono text-xs text-ink">{log.action}</dd>
            </div>
            <div>
              <dt className="text-muted">Alamat IP</dt>
              <dd className="mt-1 font-mono text-xs text-ink">{log.ip || '–'}</dd>
            </div>
          </dl>
          <ChangesTable changes={log.changes} />
        </div>
      ) : null}
    </Modal>
  );
}
