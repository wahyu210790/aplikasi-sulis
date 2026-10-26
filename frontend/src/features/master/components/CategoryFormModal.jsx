import { useState } from 'react';
import { Button } from '../../../components/ui/Button.jsx';
import { FormField } from '../../../components/ui/FormField.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Switch } from '../../../components/ui/Switch.jsx';
import { useToast } from '../../../components/ui/useToast.js';
import { fieldErrors } from '../../../lib/formErrors.js';
import { useSaveCategory } from '../api.js';

// category = null -> "Tambah Kategori"; object -> "Ubah Kategori". Render with key={category?.id ?? 'new'}.
export function CategoryFormModal({ open, onClose, category }) {
  const toast = useToast();
  const save = useSaveCategory();
  const isEdit = Boolean(category);
  const [form, setForm] = useState({ name: category?.name ?? '', is_active: category?.is_active ?? true });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrors({});
    setFormError('');
    try {
      if (isEdit) {
        await save.mutateAsync({ id: category.id, name: form.name, is_active: form.is_active });
        toast.success('Perubahan kategori disimpan.');
      } else {
        await save.mutateAsync({ name: form.name });
        toast.success('Kategori berhasil ditambahkan.');
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
      title={isEdit ? 'Ubah Kategori' : 'Tambah Kategori'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Batal
          </Button>
          <Button type="submit" form="category-form" loading={save.isPending}>
            Simpan
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError ? <p role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">{formError}</p> : null}
        <FormField label="Nama kategori" htmlFor="category-name" required error={errors.name} hint="Contoh: Kabel, Pipa, Lampu.">
          <Input id="category-name" value={form.name} maxLength={100} onChange={(e) => set('name', e.target.value)} invalid={Boolean(errors.name)} />
        </FormField>
        {isEdit ? (
          <FormField label="Status" error={errors.is_active} hint="Kategori nonaktif tidak bisa dipilih untuk barang baru.">
            <Switch checked={form.is_active} onChange={(v) => set('is_active', v)} label={form.is_active ? 'Aktif' : 'Nonaktif'} />
          </FormField>
        ) : null}
      </form>
    </Modal>
  );
}
