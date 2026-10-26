import { useState } from 'react';
import { useNavigate } from 'react-router';
import { FileSpreadsheet, Save } from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { Card } from '../../../components/ui/Card.jsx';
import { DateInput } from '../../../components/ui/DateInput.jsx';
import { FormField } from '../../../components/ui/FormField.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { useToast } from '../../../components/ui/useToast.js';
import { formatDate, formatQty, formatRupiah, parseQty } from '../../../lib/format.js';
import { fieldErrors } from '../../../lib/formErrors.js';
import { useCreateOpeningStock } from '../api.js';
import { ItemsEditor } from '../components/ItemsEditor.jsx';
import { StickySubmitBar } from '../components/StickySubmitBar.jsx';
import { checkRows, minBusinessDate, newRow, rowsToItems, todayIso, unitOf } from '../utils.js';

const PRICE = { label: 'Harga modal', field: 'unit_cost' };

function totalValue(rows) {
  return rows.reduce((sum, row) => {
    const qty = parseQty(row.qty);
    return qty && row.price !== null ? sum + Math.round(Number(qty) * row.price) : sum;
  }, 0);
}

// Stok Awal, manual entry — docs/desain-v2.md B5.6. Owner and Finance only.
export default function OpeningStockPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const create = useCreateOpeningStock();
  const [date, setDate] = useState(todayIso());
  const [rows, setRows] = useState([newRow()]);
  const [errors, setErrors] = useState({});
  const [confirming, setConfirming] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    const next = checkRows(rows, PRICE.field);
    if (!date) next.movement_date = 'Isi tanggal.';
    setErrors(next);
    if (Object.keys(next).length === 0) setConfirming(true);
  }

  async function handleConfirm() {
    try {
      const result = await create.mutateAsync({ movement_date: date, items: rowsToItems(rows, PRICE.field) });
      toast.success(`Stok awal ${result.data.length} barang tersimpan.`);
      navigate('/barang');
    } catch (error) {
      const fields = fieldErrors(error);
      // A business error (e.g. the product already has stock history) has no field: show it above the item list.
      setErrors(Object.keys(fields).length > 0 ? fields : { items: error.message });
      setConfirming(false);
    }
  }

  const total = totalValue(rows);

  return (
    <>
      <PageHeader
        title="Stok Awal"
        subtitle="Catat stok dan harga modal barang saat mulai memakai aplikasi."
        breadcrumb={[{ label: 'Barang', to: '/barang' }, { label: 'Stok Awal' }]}
        actions={
          <Button variant="secondary" leftIcon={FileSpreadsheet} onClick={() => navigate('/barang/impor?tab=stok-awal')}>
            Impor Excel
          </Button>
        }
      />

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <Card title="Tanggal" description="Stok awal hanya bisa diisi untuk barang yang belum punya riwayat stok.">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Tanggal stok awal" htmlFor="opening-date" required error={errors.movement_date} hint="Paling lama 30 hari ke belakang.">
              <DateInput id="opening-date" value={date} onChange={setDate} min={minBusinessDate()} max={todayIso()} invalid={Boolean(errors.movement_date)} />
            </FormField>
          </div>
        </Card>

        <Card title="Barang" description="Isi jumlah stok yang ada di gudang dan harga modal per satuan.">
          <ItemsEditor rows={rows} onChange={setRows} errors={errors} price={PRICE} />
        </Card>

        <StickySubmitBar
          summary={
            <>
              {rows.length} barang · Total nilai: <span className="font-semibold text-ink">{formatRupiah(total)}</span>
            </>
          }
        >
          <Button variant="secondary" onClick={() => navigate('/barang')}>
            Batal
          </Button>
          <Button type="submit" size="lg" leftIcon={Save}>
            Simpan Stok Awal
          </Button>
        </StickySubmitBar>
      </form>

      <Modal
        open={confirming}
        onClose={create.isPending ? () => {} : () => setConfirming(false)}
        title="Periksa sebelum menyimpan"
        description={`Stok awal tanggal ${formatDate(date)} tidak bisa diubah setelah disimpan.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={create.isPending}>
              Periksa Lagi
            </Button>
            <Button onClick={handleConfirm} loading={create.isPending}>
              Ya, Simpan
            </Button>
          </>
        }
      >
        <ul className="divide-y divide-line rounded-control border border-line text-sm">
          {rows.map((row) => (
            <li key={row.key} className="flex items-start justify-between gap-3 px-3 py-2">
              <span className="min-w-0 text-ink">{row.product?.name}</span>
              <span className="text-right whitespace-nowrap">
                <span className="block font-medium text-ink tabular-nums">{formatQty(parseQty(row.qty), unitOf(row.product))}</span>
                <span className="block text-xs text-muted">@ {formatRupiah(row.price ?? 0)}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-right text-sm text-muted">
          Total nilai: <span className="font-semibold text-ink">{formatRupiah(total)}</span>
        </p>
      </Modal>
    </>
  );
}
