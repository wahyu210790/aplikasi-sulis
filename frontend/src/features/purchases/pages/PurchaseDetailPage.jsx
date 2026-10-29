import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Ban, PackageCheck, Pencil, Printer, Trash2 } from 'lucide-react';
import { useAuth } from '../../../auth/useAuth.js';
import { PrintFooter, PrintHeader, PrintSignatures } from '../../../components/print/PrintParts.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Card } from '../../../components/ui/Card.jsx';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { Money } from '../../../components/ui/Money.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Qty } from '../../../components/ui/Qty.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { useToast } from '../../../components/ui/useToast.js';
import { formatDate, formatDateTime } from '../../../lib/format.js';
import { can, canSeeMoney } from '../../../lib/permissions.js';
import { usePurchase, usePurchaseAction } from '../api.js';

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-1 font-medium break-words text-ink">{children}</dd>
    </div>
  );
}

// Texts of the confirmation dialog per action (docs/desain-v2.md B5.1).
const ACTIONS = {
  receive: {
    title: 'Terima barang?',
    message: 'Stok semua barang di bawah bertambah sesuai jumlah. Pastikan barang yang datang sudah dihitung dan cocok.',
    confirmLabel: 'Ya, Terima Barang',
    tone: 'primary',
    success: (number) => `Barang pembelian ${number} diterima. Stok sudah bertambah.`,
  },
  delete: {
    title: 'Hapus draft pembelian?',
    message: 'Draft ini dihapus permanen. Stok tidak berubah.',
    confirmLabel: 'Ya, Hapus',
    tone: 'danger',
    success: (number) => `Draft ${number} dihapus.`,
  },
  cancelDraft: {
    title: 'Batalkan pembelian?',
    message: 'Pembelian ini ditandai Batal dan tidak bisa diterima lagi. Stok tidak berubah.',
    confirmLabel: 'Ya, Batalkan',
    tone: 'danger',
    success: (number) => `Pembelian ${number} dibatalkan.`,
  },
  cancelReceived: {
    title: 'Batalkan pembelian yang sudah diterima?',
    message: 'Stok semua barang di bawah dikurangi kembali. Pembatalan ditolak jika sebagian barang sudah terpakai.',
    confirmLabel: 'Ya, Batalkan Pembelian',
    tone: 'danger',
    success: (number) => `Pembelian ${number} dibatalkan. Stok sudah dikurangi kembali.`,
  },
};

export default function PurchaseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const showMoney = canSeeMoney(user);
  const query = usePurchase(id);
  const action = usePurchaseAction();
  const [pending, setPending] = useState(null); // a key of ACTIONS while its dialog is open

  const breadcrumb = [{ label: 'Pembelian', to: '/pembelian' }, { label: query.data?.data.number ?? 'Detail' }];

  if (query.isLoading || query.isError) {
    return (
      <>
        <PageHeader title="Detail Pembelian" breadcrumb={breadcrumb} />
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
  const canManage = can(user, 'purchases.manage');
  // Only goods that really arrived get a printed receipt (also after a later cancel, then marked DIBATALKAN).
  const printable = Boolean(item.received_at);

  async function handleConfirm(reason) {
    const kind = pending;
    try {
      await action.mutateAsync({ id: item.id, action: kind.startsWith('cancel') ? 'cancel' : kind, reason });
      toast.success(ACTIONS[kind].success(item.number));
      setPending(null);
      if (kind === 'delete') navigate('/pembelian');
    } catch (error) {
      toast.error(error.message);
    }
  }

  const dialog = pending ? ACTIONS[pending] : null;

  return (
    <>
      <PageHeader
        title={item.number}
        subtitle={`Pembelian dari ${item.supplier.name}`}
        breadcrumb={breadcrumb}
        actions={
          <>
            {printable ? (
              <Button variant="secondary" leftIcon={Printer} onClick={() => window.print()}>
                Cetak
              </Button>
            ) : null}
            {isDraft && canManage ? (
              <>
                <Button variant="secondary" leftIcon={Pencil} onClick={() => navigate(`/pembelian/${item.id}/ubah`)}>
                  Ubah
                </Button>
                <Button variant="secondary" leftIcon={Trash2} onClick={() => setPending('delete')}>
                  Hapus
                </Button>
                <Button variant="secondary" leftIcon={Ban} onClick={() => setPending('cancelDraft')}>
                  Batalkan
                </Button>
              </>
            ) : null}
            {isDraft && can(user, 'purchases.receive') ? (
              <Button leftIcon={PackageCheck} onClick={() => setPending('receive')}>
                Terima Barang
              </Button>
            ) : null}
            {item.status === 'diterima' && can(user, 'purchases.cancelReceived') ? (
              <Button variant="danger" leftIcon={Ban} onClick={() => setPending('cancelReceived')}>
                Batalkan Pembelian
              </Button>
            ) : null}
          </>
        }
      />

      {item.status === 'batal' ? (
        <div role="status" className="mb-6 rounded-card border border-line bg-danger-soft px-4 py-3 text-sm text-danger sm:px-5">
          <p className="font-semibold">Pembelian ini sudah dibatalkan</p>
          <p className="mt-1">
            Oleh {item.cancelled_by?.name ?? '–'} pada {formatDateTime(item.cancelled_at)}. Alasan: {item.cancel_reason}
          </p>
        </div>
      ) : null}

      <div className={printable ? 'print-area space-y-6' : 'space-y-6'}>
        <PrintHeader title="BUKTI PENERIMAAN BARANG" number={item.number} cancelled={item.status === 'batal'} />

        <Card title="Informasi pembelian">
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Status">
              <StatusBadge kind="purchase" status={item.status} />
            </Field>
            <Field label="Pemasok">{item.supplier.name}</Field>
            <Field label="Tanggal pembelian">{formatDate(item.purchase_date)}</Field>
            <Field label="No. faktur">{item.invoice_no || '–'}</Field>
            <Field label="Dibuat oleh">
              {item.created_by?.name ?? '–'}, {formatDateTime(item.created_at)}
            </Field>
            <Field label="Diterima oleh">{item.received_by ? `${item.received_by.name}, ${formatDateTime(item.received_at)}` : '–'}</Field>
            <Field label="Catatan">{item.notes || '–'}</Field>
          </dl>
        </Card>

        <Card title="Daftar barang" description={`${item.items.length} barang`} padded={false}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-canvas">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Barang</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-muted uppercase">Jumlah</th>
                  {showMoney ? (
                    <>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-muted uppercase">Harga satuan</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-muted uppercase">Subtotal</th>
                    </>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {item.items.map((line) => (
                  <tr key={line.id}>
                    <td className="px-4 py-3">
                      <div className="text-ink">{line.product.name}</div>
                      <div className="font-mono text-xs text-muted">{line.product.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      <Qty value={line.qty} unit={line.product.unit_symbol} />
                    </td>
                    {showMoney ? (
                      <>
                        <td className="px-4 py-3 text-right">
                          <Money value={line.unit_price} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Money value={line.line_total} />
                        </td>
                      </>
                    ) : null}
                  </tr>
                ))}
              </tbody>
              {showMoney ? (
                <tfoot className="bg-canvas">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right font-semibold text-ink">Total</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      <Money value={item.total_value} />
                    </td>
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        </Card>

        <PrintSignatures
          signatures={[
            { label: 'Diserahkan oleh (Pemasok)', name: '' },
            { label: 'Diterima oleh (Gudang)', name: item.received_by?.name ?? '' },
          ]}
        />
        <PrintFooter user={user} />
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
        requireReason={pending === 'cancelDraft' || pending === 'cancelReceived'}
        reasonLabel="Alasan pembatalan"
        loading={action.isPending}
      />
    </>
  );
}
