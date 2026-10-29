import { useState } from 'react';
import { useParams } from 'react-router';
import { Ban, CheckCircle2, Undo2 } from 'lucide-react';
import { useAuth } from '../../../auth/useAuth.js';
import { Button } from '../../../components/ui/Button.jsx';
import { Card } from '../../../components/ui/Card.jsx';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Qty } from '../../../components/ui/Qty.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { useToast } from '../../../components/ui/useToast.js';
import { cn } from '../../../lib/cn.js';
import { formatDate, formatDateTime } from '../../../lib/format.js';
import { can } from '../../../lib/permissions.js';
import { useOpname, useOpnameAction } from '../api.js';
import { OpnameCountEditor } from '../components/OpnameCountEditor.jsx';

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-1 font-medium break-words text-ink">{children}</dd>
    </div>
  );
}

function who(person, at) {
  return person ? `${person.name}, ${formatDateTime(at)}` : '–';
}

// Texts of the confirmation dialog per action (docs/desain-v2.md B5.5).
const ACTIONS = {
  post: {
    title: 'Setujui stok opname?',
    message: 'Stok sistem dihitung ulang sekarang, lalu stok setiap barang dikoreksi menjadi sama dengan hasil hitung. Tindakan ini tidak bisa dibatalkan.',
    confirmLabel: 'Ya, Setujui',
    tone: 'primary',
    success: (number) => `Stok opname ${number} disetujui. Stok sudah dikoreksi.`,
  },
  reject: {
    title: 'Tolak stok opname?',
    message: 'Opname kembali ke Draft agar gudang bisa menghitung ulang. Stok tidak berubah.',
    confirmLabel: 'Ya, Tolak',
    tone: 'danger',
    success: (number) => `Stok opname ${number} dikembalikan ke gudang.`,
  },
  cancel: {
    title: 'Batalkan stok opname?',
    message: 'Opname ini ditandai Batal dan tidak bisa dipakai lagi. Stok tidak berubah.',
    confirmLabel: 'Ya, Batalkan',
    tone: 'danger',
    success: (number) => `Stok opname ${number} dibatalkan.`,
  },
};

function diffClass(value) {
  if (value === null || Number(value) === 0) return 'text-muted';
  return Number(value) > 0 ? 'text-success' : 'text-warning';
}

export default function OpnameDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const query = useOpname(id);
  const action = useOpnameAction();
  const [pending, setPending] = useState(null); // a key of ACTIONS while its dialog is open

  const breadcrumb = [{ label: 'Stok Opname', to: '/stok-opname' }, { label: query.data?.data.number ?? 'Detail' }];

  if (query.isLoading || query.isError) {
    return (
      <>
        <PageHeader title="Detail Stok Opname" breadcrumb={breadcrumb} />
        {query.isLoading ? (
          <div className="flex justify-center py-12 text-muted">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <div className="rounded-card border border-line bg-surface shadow-sm">
            <ErrorState message={query.error.message} onRetry={query.error.status === 404 ? undefined : () => query.refetch()} />
          </div>
        )}
      </>
    );
  }

  const item = query.data.data;
  const isDraft = item.status === 'draft';
  const isWaiting = item.status === 'menunggu_persetujuan';
  const isDone = item.status === 'selesai';
  const canManage = can(user, 'opname.manage');
  const canApprove = can(user, 'opname.approve');

  async function handleConfirm(reason) {
    const kind = pending;
    try {
      await action.mutateAsync({ id: item.id, action: kind, reason });
      toast.success(ACTIONS[kind].success(item.number));
      setPending(null);
    } catch (error) {
      toast.error(error.message);
    }
  }

  const dialog = pending ? ACTIONS[pending] : null;

  return (
    <>
      <PageHeader
        title={item.number}
        subtitle={`Stok opname tanggal ${formatDate(item.opname_date)}`}
        breadcrumb={breadcrumb}
        actions={
          <>
            {(isDraft || isWaiting) && canManage ? (
              <Button variant="secondary" leftIcon={Ban} onClick={() => setPending('cancel')}>
                Batalkan
              </Button>
            ) : null}
            {isWaiting && canApprove ? (
              <>
                <Button variant="secondary" leftIcon={Undo2} onClick={() => setPending('reject')}>
                  Tolak
                </Button>
                <Button leftIcon={CheckCircle2} onClick={() => setPending('post')}>
                  Setujui
                </Button>
              </>
            ) : null}
          </>
        }
      />

      {isDraft && item.reject_reason ? (
        <div role="status" className="mb-6 rounded-card border border-line bg-warning-soft px-4 py-3 text-sm text-warning sm:px-5">
          <p className="font-semibold">Ditolak Owner, silakan hitung ulang</p>
          <p className="mt-1">
            Oleh {item.rejected_by?.name ?? '–'} pada {formatDateTime(item.rejected_at)}. Catatan: {item.reject_reason}
          </p>
        </div>
      ) : null}
      {isWaiting ? (
        <div role="status" className="mb-6 rounded-card border border-line bg-info-soft px-4 py-3 text-sm text-info sm:px-5">
          {canApprove
            ? 'Periksa hasil hitung di bawah. Stok sistem dihitung ulang saat Anda menyetujui.'
            : 'Menunggu persetujuan Owner. Stok belum berubah.'}
        </div>
      ) : null}

      <div className="space-y-6">
        <Card title="Informasi opname">
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Status">
              <StatusBadge kind="opname" status={item.status} />
            </Field>
            <Field label="Tanggal opname">{formatDate(item.opname_date)}</Field>
            <Field label="Dibuat oleh">{who(item.created_by, item.created_at)}</Field>
            <Field label="Diajukan oleh">{who(item.submitted_by, item.submitted_at)}</Field>
            <Field label="Disetujui oleh">{who(item.posted_by, item.posted_at)}</Field>
            {item.status === 'batal' ? <Field label="Dibatalkan oleh">{who(item.cancelled_by, item.cancelled_at)}</Field> : null}
            <Field label="Catatan">{item.notes || '–'}</Field>
          </dl>
        </Card>

        {isDraft && canManage ? (
          <OpnameCountEditor key={`${item.id}-${item.rejected_at ?? 'new'}`} opname={item} />
        ) : (
          <Card title="Daftar barang" description={`${item.items.length} barang`} padded={false}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-line text-sm">
                <thead className="bg-canvas">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Barang</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-muted uppercase">Stok sistem</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-muted uppercase">Hasil hitung</th>
                    {isDone ? <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-muted uppercase">Selisih</th> : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {item.items.map((line) => (
                    <tr key={line.id}>
                      <td className="px-4 py-3">
                        <div className="text-ink">{line.product.name}</div>
                        <div className="font-mono text-xs text-muted">{line.product.sku}</div>
                        {line.notes ? <div className="mt-1 text-xs break-words text-muted">{line.notes}</div> : null}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Qty value={line.system_qty} unit={line.product.unit_symbol} />
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        <Qty value={line.counted_qty} unit={line.product.unit_symbol} />
                      </td>
                      {isDone ? (
                        <td className={cn('px-4 py-3 text-right font-medium', diffClass(line.diff_qty))}>
                          {Number(line.diff_qty) > 0 ? '+' : ''}
                          <Qty value={line.diff_qty} unit={line.product.unit_symbol} />
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <ConfirmDialog
        key={pending ?? 'closed'}
        open={Boolean(dialog)}
        onClose={() => setPending(null)}
        onConfirm={handleConfirm}
        title={dialog?.title}
        message={dialog?.message}
        confirmLabel={dialog?.confirmLabel}
        tone={dialog?.tone}
        requireReason={pending === 'reject'}
        reasonLabel="Catatan untuk gudang"
        loading={action.isPending}
      />
    </>
  );
}
