import { useState } from 'react';
import { Button } from '../../../components/ui/Button.jsx';
import { ComboBox } from '../../../components/ui/ComboBox.jsx';
import { FormField } from '../../../components/ui/FormField.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { NumberInput } from '../../../components/ui/NumberInput.jsx';
import { Switch } from '../../../components/ui/Switch.jsx';
import { Textarea } from '../../../components/ui/Textarea.jsx';
import { useToast } from '../../../components/ui/useToast.js';
import { formatQty, parseQty } from '../../../lib/format.js';
import { fieldErrors } from '../../../lib/formErrors.js';
import { useCategories, useUnits } from '../../master/api.js';
import { useSaveProduct } from '../api.js';

function toOption(item, description) {
  return item ? { value: item.id, label: item.name, description } : null;
}

// Active items for the dropdown, plus the product's current item if it is now inactive.
function withCurrent(options, current) {
  if (!current || options.some((o) => o.value === current.value)) return options;
  return [current, ...options];
}

// product = null -> "Tambah Barang"; object -> "Ubah Barang". Render with key={product?.id ?? 'new'}.
// onSaved(product) is called with the saved product from the API.
export function ProductFormModal({ open, onClose, product, onSaved }) {
  const toast = useToast();
  const save = useSaveProduct();
  const categories = useCategories({ all: 1 });
  const units = useUnits({ all: 1 });
  const isEdit = Boolean(product);
  const [form, setForm] = useState({
    sku: product?.sku ?? '',
    name: product?.name ?? '',
    category: toOption(product?.category),
    unit: toOption(product?.unit, product?.unit.symbol),
    min_stock: product ? formatQty(product.min_stock) : '0',
    notes: product?.notes ?? '',
    is_active: product?.is_active ?? true,
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  const categoryOptions = withCurrent(
    (categories.data?.data ?? []).map((c) => toOption(c)),
    toOption(product?.category),
  );
  const unitOptions = withCurrent(
    (units.data?.data ?? []).map((u) => toOption(u, u.symbol)),
    toOption(product?.unit, product?.unit.symbol),
  );

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrors({});
    setFormError('');
    const minStock = form.min_stock.trim() === '' ? '0' : parseQty(form.min_stock);
    if (minStock === null) {
      setErrors({ min_stock: 'Stok minimum harus berupa angka, contoh 10 atau 12,5.' });
      return;
    }
    const body = {
      sku: form.sku,
      name: form.name,
      category_id: form.category?.value ?? null,
      unit_id: form.unit?.value ?? null,
      min_stock: minStock,
      notes: form.notes || null,
    };
    try {
      let result;
      if (isEdit) {
        result = await save.mutateAsync({ id: product.id, ...body, is_active: form.is_active });
        toast.success('Perubahan barang disimpan.');
      } else {
        result = await save.mutateAsync(body);
        toast.success('Barang berhasil ditambahkan.');
      }
      onClose();
      if (onSaved) onSaved(result.data);
    } catch (error) {
      const fields = fieldErrors(error);
      setErrors(fields);
      if (Object.keys(fields).length === 0) setFormError(error.message);
    }
  }

  return (
    <Modal
      open={open}
      onClose={save.isPending ? () => {} : onClose}
      title={isEdit ? 'Ubah Barang' : 'Tambah Barang'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Batal
          </Button>
          <Button type="submit" form="product-form" loading={save.isPending}>
            Simpan
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError ? <p role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">{formError}</p> : null}
        <FormField label="SKU (kode barang)" htmlFor="product-sku" required error={errors.sku} hint="Huruf, angka, dan tanda - . _ /. Contoh: KBL-NYM-2X15.">
          <Input id="product-sku" value={form.sku} maxLength={50} onChange={(e) => set('sku', e.target.value.toUpperCase())} invalid={Boolean(errors.sku)} />
        </FormField>
        <FormField label="Nama barang" htmlFor="product-name" required error={errors.name}>
          <Input id="product-name" value={form.name} maxLength={150} onChange={(e) => set('name', e.target.value)} invalid={Boolean(errors.name)} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Kategori" htmlFor="product-category" required error={errors.category_id}>
            <ComboBox
              id="product-category"
              value={form.category}
              onChange={(v) => set('category', v)}
              options={categoryOptions}
              loading={categories.isLoading}
              invalid={Boolean(errors.category_id)}
            />
          </FormField>
          <FormField label="Satuan" htmlFor="product-unit" required error={errors.unit_id}>
            <ComboBox
              id="product-unit"
              value={form.unit}
              onChange={(v) => set('unit', v)}
              options={unitOptions}
              loading={units.isLoading}
              invalid={Boolean(errors.unit_id)}
            />
          </FormField>
        </div>
        <FormField label="Stok minimum" htmlFor="product-min-stock" error={errors.min_stock} hint="Isi 0 jika tidak perlu peringatan stok menipis.">
          <NumberInput
            id="product-min-stock"
            value={form.min_stock}
            onChange={(v) => set('min_stock', v)}
            suffix={form.unit?.description}
            invalid={Boolean(errors.min_stock)}
          />
        </FormField>
        <FormField label="Catatan" htmlFor="product-notes" error={errors.notes}>
          <Textarea id="product-notes" rows={2} value={form.notes} maxLength={500} onChange={(e) => set('notes', e.target.value)} invalid={Boolean(errors.notes)} />
        </FormField>
        {isEdit ? (
          <FormField label="Status" error={errors.is_active} hint="Barang nonaktif tidak bisa dipilih untuk transaksi baru.">
            <Switch checked={form.is_active} onChange={(v) => set('is_active', v)} label={form.is_active ? 'Aktif' : 'Nonaktif'} />
          </FormField>
        ) : null}
      </form>
    </Modal>
  );
}
