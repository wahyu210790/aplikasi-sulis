import { useState } from 'react';
import { Button } from '../../../components/ui/Button.jsx';
import { FormField } from '../../../components/ui/FormField.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Switch } from '../../../components/ui/Switch.jsx';
import { useToast } from '../../../components/ui/useToast.js';
import { fieldErrors } from '../../../lib/formErrors.js';
import { useSaveUnit } from '../api.js';

// unit = null -> "Tambah Satuan"; object -> "Ubah Satuan". Render with key={unit?.id ?? 'new'}.
export function UnitFormModal({ open, onClose, unit }) {
  const toast = useToast();
  const save = useSaveUnit();
  const isEdit = Boolean(unit);
  const [form, setForm] = useState({ name: unit?.name ?? '', symbol: unit?.symbol ?? '', is_active: unit?.is_active ?? true });
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
        await save.mutateAsync({ id: unit.id, name: form.name, symbol: form.symbol, is_active: form.is_active });
        toast.success('Perubahan satuan disimpan.');
      } else {
        await save.mutateAsync({ name: form.name, symbol: form.symbol });
        toast.success('Satuan berhasil ditambahkan.');
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
      title={isEdit ? 'Ubah Satuan' : 'Tambah Satuan'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Batal
          </Button>
          <Button type="submit" form="unit-form" loading={save.isPending}>
            Simpan
          </Button>
        </>
      }
    >
      <form id="unit-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError ? <p role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">{formError}</p> : null}
        <FormField label="Nama satuan" htmlFor="unit-name" required error={errors.name} hint="Contoh: meter, batang, pcs.">
          <Input id="unit-name" value={form.name} maxLength={50} onChange={(e) => set('name', e.target.value)} invalid={Boolean(errors.name)} />
        </FormField>
        <FormField label="Simbol" htmlFor="unit-symbol" required error={errors.symbol} hint="Singkatan yang tampil di samping jumlah, contoh: m, btg, pcs.">
          <Input id="unit-symbol" value={form.symbol} maxLength={20} onChange={(e) => set('symbol', e.target.value)} invalid={Boolean(errors.symbol)} />
        </FormField>
        {isEdit ? (
          <FormField label="Status" error={errors.is_active} hint="Satuan nonaktif tidak bisa dipilih untuk barang baru.">
            <Switch checked={form.is_active} onChange={(v) => set('is_active', v)} label={form.is_active ? 'Aktif' : 'Nonaktif'} />
          </FormField>
        ) : null}
      </form>
    </Modal>
  );
}
