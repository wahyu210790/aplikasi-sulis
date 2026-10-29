import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Ban, Printer } from 'lucide-react';
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
import { useReverseStockTransaction, useStockTransaction } from '../api.js';
import { DOC_TYPES } from '../docTypes.js';

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-1 font-medium break-words text-ink">{children}</dd>
    </div>
  );
}

// Detail of one stock document (printable). type: 'project_out' or 'project_return'.
export default function StockTransactionDetailPage({ type }) {
  const doc = DOC_TYPES[type];
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const showMoney = canSeeMoney(user);
  const query = useStockTransaction(id);
  const reverse = useReverseStockTransaction();
  const [confirming, setConfirming] = useState(false);

  const breadcrumb = [{ label: doc.title, to: doc.path }, { label: query.data?.data.number ?? 'Detail' }];

  if (query.isLoading) {
    return (
      <>
        <PageHeader title={`Detail ${doc.title}`} breadcrumb={breadcrumb} />
        <div className="flex justify-center py-12 text-muted">
          <Spinner className="h-6 w-6" />
        </div>
      </>
    );
  }

  // A document of the other type opened with this URL is treated as not found.
  if (query.isError || query.data.data.type !== type) {
    return (
      <>
        <PageHeader title={`Detail ${doc.title}`} breadcrumb={breadcrumb} />
        <div className="rounded-card border border-line bg-surface shadow-sm">
          <ErrorState message={query.isError ? query.error.message : 'Data tidak ditemukan.'} />
        </div>
      </>
    );
  }

  const item = query.data.data;
  const posted = item.status === 'posted';

  async function handleReverse(reason) {
    try {
      await reverse.mutateAsync({ id: item.id, reason });
      toast.success(`${item.number} dibatalkan. Stok sudah dikembalikan.`);
      setConfirming(false);
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <>
      <PageHeader
        title={item.number}
        subtitle={item.type_label}
        breadcrumb={breadcrumb}
        actions={
          <>
            <Button variant="secondary" leftIcon={Printer} onClick={() => window.print()}>
              Cetak
            </Button>
            {posted && can(user, 'stock.reverse') ? (
              <Button variant="danger" leftIcon={Ban} onClick={() => setConfirming(true)}>
                Batalkan
              </Button>
            ) : null}
          </>
        }
      />

      {!posted ? (
        <div role="status" className="mb-6 rounded-card border border-line bg-danger-soft px-4 py-3 text-sm text-danger sm:px-5">
          <p className="font-semibold">Dokumen ini sudah dibatalkan</p>
          <p className="mt-1">
            Oleh {item.reversed_by?.name ?? '–'} pada {formatDateTime(item.reversed_at)}. Alasan: {item.reverse_reason}
          </p>
        </div>
      ) : null}

      <div className="print-area space-y-6">
        <PrintHeader title={doc.printTitle} number={item.number} cancelled={!posted} />

        <Card title="Informasi dokumen">
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Tanggal">{formatDate(item.transaction_date)}</Field>
            <Field label="Proyek">
              <Link to={`/proyek/${item.project.id}`} className="text-primary hover:underline print:text-ink">
                {item.project.code} — {item.project.name}
              </Link>
            </Field>
            <Field label={doc.personLabel}>{item.person_name}</Field>
            <Field label="Status">
              <StatusBadge kind="stock_transaction" status={item.status} />
            </Field>
            <Field label="Dicatat oleh">
              {item.created_by?.name ?? '–'}, {formatDateTime(item.created_at)}
            </Field>
            <Field label="Catatan">{item.notes || '–'}</Field>
          </dl>
        </Card>

        <Card title="Daftar barang" description={`${item.lines.length} barang`} padded={false}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-canvas">
                <tr>
                  <th scope="col" className="w-10 px-4 py-3 text-left text-xs font-semibold text-muted uppercase">No</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Barang</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-muted uppercase">Jumlah</th>
                  {showMoney ? <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-muted uppercase">Nilai</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {item.lines.map((line, index) => (
                  <tr key={line.id}>
                    <td className="px-4 py-3 text-muted tabular-nums">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="text-ink">{line.product.name}</div>
                      <div className="font-mono text-xs text-muted">{line.product.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      <Qty value={line.qty} unit={line.product.unit_symbol} />
                    </td>
                    {showMoney ? (
                      <td className="px-4 py-3 text-right">
                        <Money value={line.value} />
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
              {showMoney ? (
                <tfoot className="bg-canvas">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right font-semibold text-ink">Total nilai</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      <Money value={item.total_value} />
                    </td>
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        </Card>

        <PrintSignatures signatures={doc.signatures.map((sign) => ({ label: sign.label, name: sign.person ? item.person_name : '' }))} />
        <PrintFooter user={user} />
      </div>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleReverse}
        title={`Batalkan ${item.number}?`}
        message="Stok semua barang di dokumen ini dikembalikan seperti sebelum dokumen dicatat. Dokumen tetap tersimpan dengan status Dibatalkan dan tidak bisa diaktifkan lagi."
        confirmLabel="Ya, Batalkan Dokumen"
        tone="danger"
        requireReason
        reasonLabel="Alasan pembatalan"
        loading={reverse.isPending}
      />
    </>
  );
}
