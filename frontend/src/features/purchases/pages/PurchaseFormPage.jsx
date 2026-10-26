import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Save } from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { Card } from '../../../components/ui/Card.jsx';
import { DateInput } from '../../../components/ui/DateInput.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { FormField } from '../../../components/ui/FormField.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Money } from '../../../components/ui/Money.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { Textarea } from '../../../components/ui/Textarea.jsx';
import { useToast } from '../../../components/ui/useToast.js';
import { formatQty, parseQty } from '../../../lib/format.js';
import { fieldErrors } from '../../../lib/formErrors.js';
import { useSuppliers } from '../../master/api.js';
import { ItemsEditor } from '../../stock/components/ItemsEditor.jsx';
import { StickySubmitBar } from '../../stock/components/StickySubmitBar.jsx';
import { checkRows, minBusinessDate, newRow, rowsToItems, todayIso } from '../../stock/utils.js';
import { usePurchase, useSavePurchase } from '../api.js';

// Rupiah total of the rows as typed (same rounding as the API: each line rounded to whole rupiah).
function totalOf(rows) {
  return rows.reduce((sum, row) => {
    const qty = parseQty(row.qty);
    return qty && row.price !== null ? sum + Math.round(Number(qty) * row.price) : sum;
  }, 0);
}

// purchase = null -> new draft; object -> edit that draft.
function PurchaseForm({ purchase }) {
  const navigate = useNavigate();
  const toast = useToast();
  const save = useSavePurchase();
  const suppliers = useSuppliers({ all: 1 });
  const [supplierId, setSupplierId] = useState(purchase?.supplier.id ?? null);
  const [date, setDate] = useState(purchase?.purchase_date ?? todayIso());
  const [invoiceNo, setInvoiceNo] = useState(purchase?.invoice_no ?? '');
  const [notes, setNotes] = useState(purchase?.notes ?? '');
  const [rows, setRows] = useState(() =>
    purchase ? purchase.items.map((item) => newRow(item.product, formatQty(item.qty), item.unit_price)) : [newRow()],
  );
  const [errors, setErrors] = useState({});

  // An inactive supplier of an old draft is still shown so the form does not look empty.
  const supplierOptions = (suppliers.data?.data ?? []).map((s) => ({ value: s.id, label: s.name }));
  if (purchase && !supplierOptions.some((o) => o.value === purchase.supplier.id)) {
    supplierOptions.push({ value: purchase.supplier.id, label: `${purchase.supplier.name} (nonaktif)` });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const next = checkRows(rows, 'unit_price');
    if (!supplierId) next.supplier_id = 'Pilih pemasok.';
    if (!date) next.purchase_date = 'Isi tanggal pembelian.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    try {
      const body = { supplier_id: supplierId, purchase_date: date, invoice_no: invoiceNo, notes: notes || null, items: rowsToItems(rows, 'unit_price') };
      const result = await save.mutateAsync(purchase ? { id: purchase.id, ...body } : body);
      toast.success(purchase ? 'Perubahan pembelian disimpan.' : `Pembelian ${result.data.number} disimpan sebagai Draft.`);
      navigate(`/pembelian/${result.data.id}`);
    } catch (error) {
      const fields = fieldErrors(error);
      setErrors(Object.keys(fields).length > 0 ? fields : { items: error.message });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <Card title="Data pembelian">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Pemasok" htmlFor="purchase-supplier" required error={errors.supplier_id}>
            <Select
              id="purchase-supplier"
              value={supplierId}
              onChange={setSupplierId}
              options={supplierOptions}
              placeholder={suppliers.isLoading ? 'Memuat…' : 'Pilih pemasok'}
              invalid={Boolean(errors.supplier_id)}
            />
          </FormField>
          <FormField label="Tanggal pembelian" htmlFor="purchase-date" required error={errors.purchase_date}>
            <DateInput id="purchase-date" value={date} onChange={setDate} min={minBusinessDate()} max={todayIso()} invalid={Boolean(errors.purchase_date)} />
          </FormField>
          <FormField label="No. faktur" htmlFor="purchase-invoice" error={errors.invoice_no}>
            <Input id="purchase-invoice" value={invoiceNo} maxLength={50} onChange={(e) => setInvoiceNo(e.target.value)} invalid={Boolean(errors.invoice_no)} />
          </FormField>
          <FormField label="Catatan" htmlFor="purchase-notes" error={errors.notes}>
            <Textarea id="purchase-notes" rows={1} value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} invalid={Boolean(errors.notes)} />
          </FormField>
        </div>
      </Card>

      <Card title="Barang" description="Harga satuan dalam rupiah, sesuai faktur pemasok.">
        <ItemsEditor rows={rows} onChange={setRows} errors={errors} price={{ label: 'Harga satuan', field: 'unit_price' }} />
      </Card>

      <StickySubmitBar
        summary={
          <span>
            Total: <Money value={totalOf(rows)} className="font-semibold text-ink" />
          </span>
        }
      >
        <Button variant="secondary" onClick={() => navigate(purchase ? `/pembelian/${purchase.id}` : '/pembelian')} disabled={save.isPending}>
          Batal
        </Button>
        <Button type="submit" size="lg" leftIcon={Save} loading={save.isPending}>
          Simpan Draft
        </Button>
      </StickySubmitBar>
    </form>
  );
}

// /pembelian/baru and /pembelian/:id/ubah (Owner and Finance). Only a Draft can be edited.
export default function PurchaseFormPage() {
  const { id } = useParams();
  const purchase = usePurchase(id);
  const title = id ? 'Ubah Pembelian' : 'Buat Pembelian';
  const breadcrumb = [{ label: 'Pembelian', to: '/pembelian' }, { label: id ? (purchase.data?.data.number ?? 'Ubah') : 'Baru' }];

  if (!id) {
    return (
      <>
        <PageHeader title={title} subtitle="Disimpan sebagai Draft. Stok bertambah setelah gudang menerima barang." breadcrumb={breadcrumb} />
        <PurchaseForm purchase={null} />
      </>
    );
  }

  return (
    <>
      <PageHeader title={title} breadcrumb={breadcrumb} />
      {purchase.isLoading ? (
        <div className="flex justify-center py-12 text-muted">
          <Spinner className="h-6 w-6" />
        </div>
      ) : purchase.isError || purchase.data.data.status !== 'draft' ? (
        <div className="rounded-card border border-line bg-surface shadow-sm">
          <ErrorState message={purchase.isError ? purchase.error.message : 'Hanya pembelian berstatus Draft yang bisa diubah.'} />
        </div>
      ) : (
        <PurchaseForm key={purchase.data.data.id} purchase={purchase.data.data} />
      )}
    </>
  );
}
