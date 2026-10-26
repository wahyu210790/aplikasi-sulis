import { useState } from 'react';
import { Button } from '../../../components/ui/Button.jsx';
import { FormField } from '../../../components/ui/FormField.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Switch } from '../../../components/ui/Switch.jsx';
import { Textarea } from '../../../components/ui/Textarea.jsx';
import { useToast } from '../../../components/ui/useToast.js';
import { fieldErrors } from '../../../lib/formErrors.js';
import { useSaveSupplier } from '../api.js';

// supplier = null -> "Tambah Pemasok"; object -> "Ubah Pemasok". Render with key={supplier?.id ?? 'new'}.
export function SupplierFormModal({ open, onClose, supplier }) {
  const toast = useToast();
  const save = useSaveSupplier();
  const isEdit = Boolean(supplier);
  const [form, setForm] = useState({
    name: supplier?.name ?? '',
    phone: supplier?.phone ?? '',
    address: supplier?.address ?? '',
    notes: supplier?.notes ?? '',
    is_active: supplier?.is_active ?? true,
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrors({});
    setFormError('');
    const body = { name: form.name, phone: form.phone || null, address: form.address || null, notes: form.notes || null };
    try {
      if (isEdit) {
        await save.mutateAsync({ id: supplier.id, ...body, is_active: form.is_active });
        toast.success('Perubahan pemasok disimpan.');
      } else {
        await save.mutateAsync(body);
        toast.success('Pemasok berhasil ditambahkan.');
      }
      onClose();
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
      title={isEdit ? 'Ubah Pemasok' : 'Tambah Pemasok'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Batal
          </Button>
          <Button type="submit" form="supplier-form" loading={save.isPending}>
            Simpan
          </Button>
        </>
      }
    >
      <form id="supplier-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError ? <p role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">{formError}</p> : null}
        <FormField label="Nama pemasok" htmlFor="supplier-name" required error={errors.name}>
          <Input id="supplier-name" value={form.name} maxLength={150} onChange={(e) => set('name', e.target.value)} invalid={Boolean(errors.name)} />
        </FormField>
        <FormField label="Telepon" htmlFor="supplier-phone" error={errors.phone}>
          <Input id="supplier-phone" type="tel" inputMode="tel" value={form.phone} maxLength={30} onChange={(e) => set('phone', e.target.value)} invalid={Boolean(errors.phone)} />
        </FormField>
        <FormField label="Alamat" htmlFor="supplier-address" error={errors.address}>
          <Textarea id="supplier-address" rows={2} value={form.address} maxLength={300} onChange={(e) => set('address', e.target.value)} invalid={Boolean(errors.address)} />
        </FormField>
        <FormField label="Catatan" htmlFor="supplier-notes" error={errors.notes}>
          <Textarea id="supplier-notes" rows={2} value={form.notes} maxLength={500} onChange={(e) => set('notes', e.target.value)} invalid={Boolean(errors.notes)} />
        </FormField>
        {isEdit ? (
          <FormField label="Status" error={errors.is_active} hint="Pemasok nonaktif tidak bisa dipilih untuk pembelian baru.">
            <Switch checked={form.is_active} onChange={(v) => set('is_active', v)} label={form.is_active ? 'Aktif' : 'Nonaktif'} />
          </FormField>
        ) : null}
      </form>
    </Modal>
  );
}
