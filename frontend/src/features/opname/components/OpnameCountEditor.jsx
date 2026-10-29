import { useState } from 'react';
import { Save, Send, Trash2 } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Card } from '../../../components/ui/Card.jsx';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.jsx';
import { FormField } from '../../../components/ui/FormField.jsx';
import { IconButton } from '../../../components/ui/IconButton.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { NumberInput } from '../../../components/ui/NumberInput.jsx';
import { Qty } from '../../../components/ui/Qty.jsx';
import { useToast } from '../../../components/ui/useToast.js';
import { fieldErrors } from '../../../lib/formErrors.js';
import { formatQty, parseQty } from '../../../lib/format.js';
import { ProductPicker } from '../../stock/components/ProductPicker.jsx';
import { StickySubmitBar } from '../../stock/components/StickySubmitBar.jsx';
import { unitOf } from '../../stock/utils.js';
import { useOpnameAction, useSaveOpnameItems } from '../api.js';

const MAX_ITEMS = 50;
let nextKey = 1;

function toRow(product, systemQty, counted = '', notes = '') {
  nextKey += 1;
  return { key: nextKey, product, systemQty, counted, notes };
}

// Saved items -> editable rows. counted_qty "12.500" is shown as "12,5".
function initialRows(items) {
  return items.map((item) => toRow(item.product, item.system_qty, item.counted_qty === null ? '' : formatQty(item.counted_qty), item.notes ?? ''));
}

// Rows -> API items (same order, so "items.2.counted_qty" belongs to the 3rd row). Empty count -> null.
function toItems(rows) {
  return rows.map((row) => ({
    product_id: row.product.id,
    counted_qty: row.counted.trim() === '' ? null : (parseQty(row.counted) ?? row.counted),
    notes: row.notes.trim() || null,
  }));
}

// Counting page of a DRAFT opname (docs/desain-v2.md B5.5): search a product, type the counted quantity.
// Gudang sees the system stock while counting (H7). Inactive products may be counted too.
export function OpnameCountEditor({ opname }) {
  const toast = useToast();
  const save = useSaveOpnameItems();
  const action = useOpnameAction();
  const [rows, setRows] = useState(() => initialRows(opname.items));
  const [errors, setErrors] = useState({});
  const [confirming, setConfirming] = useState(false);

  const missing = rows.filter((row) => row.counted.trim() === '').length;
  const busy = save.isPending || action.isPending;

  function addProduct(product) {
    if (!product) return;
    setRows((list) => [...list, toRow(product, product.stock?.qty ?? null)]);
  }

  function update(key, field, value) {
    setRows((list) => list.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  }

  async function saveRows() {
    setErrors({});
    try {
      await save.mutateAsync({ id: opname.id, items: toItems(rows) });
      return true;
    } catch (error) {
      setErrors(fieldErrors(error));
      toast.error(error.message);
      return false;
    }
  }

  async function handleSave() {
    if (await saveRows()) toast.success('Hasil hitung disimpan.');
  }

  function askSubmit() {
    if (rows.length === 0) {
      toast.error('Tambahkan minimal 1 barang sebelum mengajukan opname.');
      return;
    }
    if (missing > 0) {
      toast.error(`Masih ada ${missing} barang yang belum diisi hasil hitungnya.`);
      return;
    }
    setConfirming(true);
  }

  async function handleSubmit() {
    if (!(await saveRows())) {
      setConfirming(false);
      return;
    }
    try {
      await action.mutateAsync({ id: opname.id, action: 'submit' });
      toast.success(`Stok opname ${opname.number} diajukan ke Owner.`);
      setConfirming(false);
    } catch (error) {
      toast.error(error.message);
      setConfirming(false);
    }
  }

  return (
    <>
      <Card title="Hasil hitung" description={`${rows.length} dari maksimal ${MAX_ITEMS} barang`}>
        <div className="space-y-4">
          {rows.length < MAX_ITEMS ? (
            <FormField label="Tambah barang" htmlFor="opname-add-product" hint="Cari nama atau SKU. Barang nonaktif juga bisa dihitung.">
              <ProductPicker
                key={rows.length}
                id="opname-add-product"
                value={null}
                onChange={addProduct}
                excludeIds={rows.map((row) => row.product.id)}
                includeInactive
              />
            </FormField>
          ) : (
            <p className="text-sm text-muted">Sudah {MAX_ITEMS} barang. Untuk barang lain, buat stok opname baru.</p>
          )}
          {errors.items ? <p role="alert" className="text-sm text-danger">{errors.items}</p> : null}

          {rows.length === 0 ? (
            <p className="rounded-control border border-dashed border-line px-4 py-6 text-center text-sm text-muted">Belum ada barang. Cari barang di atas untuk mulai menghitung.</p>
          ) : (
            <ul className="divide-y divide-line rounded-control border border-line">
              {rows.map((row, index) => {
                const unit = unitOf(row.product);
                return (
                  <li key={row.key} className="space-y-3 p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium break-words text-ink">
                          {row.product.name}{' '}
                          {row.product.is_active === false ? <Badge tone="neutral">Nonaktif</Badge> : null}
                        </div>
                        <div className="font-mono text-xs text-muted">{row.product.sku}</div>
                        <div className="mt-1 text-sm text-muted">
                          Stok sistem: <Qty value={row.systemQty} unit={unit} className="font-medium text-ink" />
                        </div>
                      </div>
                      <IconButton
                        icon={Trash2}
                        label={`Hapus ${row.product.name}`}
                        variant="danger"
                        onClick={() => setRows((list) => list.filter((r) => r.key !== row.key))}
                      />
                    </div>
                    {errors[`items.${index}.product_id`] ? <p className="text-sm text-danger">{errors[`items.${index}.product_id`]}</p> : null}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormField label="Hasil hitung" htmlFor={`count-${row.key}`} error={errors[`items.${index}.counted_qty`]}>
                        <NumberInput
                          id={`count-${row.key}`}
                          value={row.counted}
                          onChange={(v) => update(row.key, 'counted', v)}
                          suffix={unit}
                          placeholder="0"
                          invalid={Boolean(errors[`items.${index}.counted_qty`])}
                        />
                      </FormField>
                      <FormField label="Catatan" htmlFor={`notes-${row.key}`} error={errors[`items.${index}.notes`]}>
                        <Input
                          id={`notes-${row.key}`}
                          value={row.notes}
                          maxLength={300}
                          placeholder="Opsional"
                          onChange={(e) => update(row.key, 'notes', e.target.value)}
                        />
                      </FormField>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>

      <StickySubmitBar summary={missing > 0 ? `${missing} barang belum dihitung` : `${rows.length} barang siap diajukan`}>
        <Button variant="secondary" leftIcon={Save} onClick={handleSave} loading={save.isPending && !confirming} disabled={busy}>
          Simpan
        </Button>
        <Button leftIcon={Send} onClick={askSubmit} disabled={busy}>
          Ajukan ke Owner
        </Button>
      </StickySubmitBar>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleSubmit}
        title="Ajukan stok opname?"
        message="Hasil hitung disimpan lalu dikirim ke Owner. Setelah diajukan, hasil hitung tidak bisa diubah kecuali Owner menolaknya."
        confirmLabel="Ya, Ajukan"
        loading={busy}
      />
    </>
  );
}
